import {
  Injectable, BadRequestException, UnauthorizedException,
  Logger, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { SmsService } from '../notifications/sms/sms.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { encryptField, hashField } from '../common/utils/crypto.util';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
    private tokenService: TokenService,
    private smsService: SmsService,
    private config: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ message: string; expiresIn: number }> {
    const { mobile } = dto;

    // Validate Indian mobile number
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw new BadRequestException('Invalid Indian mobile number');
    }

    const mobileHash = hashField(mobile);

    // Rate-limit OTP requests: max 3 per 10 minutes per number
    const recentOtps = await this.prisma.otpSession.count({
      where: {
        user: { mobileHash },
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recentOtps >= 3) {
      throw new BadRequestException('Too many OTP requests. Try again in 10 minutes.');
    }

    // Upsert user (create if new, find if existing)
    const mobileEncrypted = encryptField(mobile);
    const user = await this.prisma.user.upsert({
      where: { mobileHash },
      create: { mobile: mobileEncrypted, mobileHash },
      update: {},
    });

    // Generate and store OTP
    const { otp, otpHash, expiresAt } = await this.otpService.generate();
    await this.prisma.otpSession.create({
      data: { userId: user.id, otpHash, expiresAt },
    });

    // Send via MSG91
    await this.smsService.sendOtp(mobile, otp);
    this.logger.log(`OTP sent to +91${mobile.slice(-4).padStart(10, '*')}`);

    const expiresIn = this.config.get<number>('OTP_EXPIRY_MINUTES', 10);
    return { message: 'OTP sent successfully', expiresIn };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    user: { id: string; role: UserRole };
  }> {
    const { mobile, otp } = dto;
    const mobileHash = hashField(mobile);

    const user = await this.prisma.user.findUnique({
      where: { mobileHash },
      include: { business: true },
    });

    if (!user) throw new UnauthorizedException('User not found. Please request OTP first.');
    if (!user.isActive) throw new UnauthorizedException('Account is suspended.');

    // Find the latest valid, unverified OTP session
    const session = await this.prisma.otpSession.findFirst({
      where: {
        userId: user.id,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) throw new UnauthorizedException('OTP expired. Please request a new one.');

    const maxAttempts = this.config.get<number>('OTP_MAX_ATTEMPTS', 5);
    if (session.attempts >= maxAttempts) {
      throw new UnauthorizedException('Too many incorrect attempts. Request a new OTP.');
    }

    // Verify OTP
    const isValid = await this.otpService.verify(otp, session.otpHash);
    if (!isValid) {
      await this.prisma.otpSession.update({
        where: { id: session.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = maxAttempts - session.attempts - 1;
      throw new UnauthorizedException(`Incorrect OTP. ${remaining} attempts remaining.`);
    }

    // Mark session verified
    await this.prisma.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Issue tokens
    const { accessToken, refreshToken } = await this.tokenService.issueTokenPair(user.id, user.role);
    const isNewUser = !user.business?.profileComplete;

    return {
      accessToken,
      refreshToken,
      isNewUser,
      user: { id: user.id, role: user.role },
    };
  }

  async devSkipLogin(mobile?: string): Promise<{
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    user: { id: string; role: UserRole };
  }> {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') {
      throw new ForbiddenException('Dev skip login is not available in production.');
    }

    const selectedMobile = mobile ?? '9999999999';
    if (!/^[6-9]\d{9}$/.test(selectedMobile)) {
      throw new BadRequestException('Invalid Indian mobile number');
    }

    const mobileHash = hashField(selectedMobile);
    const mobileEncrypted = encryptField(selectedMobile);

    await this.prisma.user.upsert({
      where: { mobileHash },
      create: {
        mobile: mobileEncrypted,
        mobileHash,
        role: 'MSME_OWNER',
        isActive: true,
      },
      update: { isActive: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { mobileHash },
      include: { business: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = await this.tokenService.issueTokenPair(user.id, user.role);
    const isNewUser = !user.business?.profileComplete;

    return {
      accessToken,
      refreshToken,
      isNewUser,
      user: { id: user.id, role: user.role },
    };
  }

  async refresh(userId: string, refreshTokenRaw: string): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    const accessToken = await this.tokenService.refreshAccessToken(userId, user.role, refreshTokenRaw);
    return { accessToken };
  }

  async logout(userId: string, refreshTokenRaw: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshTokenRaw);
    this.logger.log(`User ${userId} logged out`);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        business: { include: { subscription: true } },
        caProfile: { include: { subscription: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
