import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async issueTokenPair(
    userId: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId, role),
      this.signRefreshToken(userId),
    ]);
    return { accessToken, refreshToken };
  }

  async signAccessToken(userId: string, role: UserRole): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
      },
    );
  }

  async signRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    // Return base64 payload: userId|rawToken
    return Buffer.from(`${userId}|${rawToken}`).toString('base64');
  }

  async refreshAccessToken(
    userId: string,
    role: UserRole,
    rawRefreshToken: string,
  ): Promise<string> {
    const decoded = Buffer.from(rawRefreshToken, 'base64').toString('utf8');
    const [tokenUserId, rawToken] = decoded.split('|');

    if (tokenUserId !== userId) throw new UnauthorizedException('Invalid refresh token');

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let validToken: any = null;
    for (const stored of storedTokens) {
      const match = await bcrypt.compare(rawToken, stored.tokenHash);
      if (match) { validToken = stored; break; }
    }

    if (!validToken) throw new UnauthorizedException('Refresh token expired or revoked');

    return this.signAccessToken(userId, role);
  }

  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const decoded = Buffer.from(rawRefreshToken, 'base64').toString('utf8');
      const [userId, rawToken] = decoded.split('|');
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: { userId, revokedAt: null },
      });
      for (const stored of storedTokens) {
        const match = await bcrypt.compare(rawToken, stored.tokenHash);
        if (match) {
          await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } catch {
      this.logger.warn('Failed to revoke refresh token');
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
