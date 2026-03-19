import {
  Controller, Post, Body, Get, UseGuards, Req,
  HttpCode, HttpStatus, Res, Version,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { DevSkipLoginDto } from './dto/dev-skip-login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 600000 } }) // 3 per 10min per IP
  @ApiOperation({ summary: 'Send OTP to mobile number' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP and receive JWT tokens' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'Tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto);

    // Set refresh token in httpOnly cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/v1/auth/refresh',
    });

    return {
      accessToken: result.accessToken,
      isNewUser: result.isNewUser,
      user: result.user,
    };
  }

  @Public()
  @Post('dev/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Development-only: login without OTP and receive JWT tokens' })
  @ApiBody({ type: DevSkipLoginDto, required: false })
  @ApiResponse({ status: 200, description: 'Dev login successful' })
  @ApiResponse({ status: 403, description: 'Only available outside production' })
  async devSkipLogin(
    @Body() dto: DevSkipLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.devSkipLogin(dto.mobile);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return {
      accessToken: result.accessToken,
      isNewUser: result.isNewUser,
      user: result.user,
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  async refresh(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    return this.authService.refresh(user.id, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    await this.authService.logout(user.id, refreshToken);
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }
}
