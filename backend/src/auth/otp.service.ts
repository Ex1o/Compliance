// ─── otp.service.ts ───────────────────────────────────────────────────────────
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  constructor(private config: ConfigService) {}

  async generate(): Promise<{ otp: string; otpHash: string; expiresAt: Date }> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(
      Date.now() + this.config.get<number>('OTP_EXPIRY_MINUTES', 10) * 60 * 1000,
    );
    return { otp, otpHash, expiresAt };
  }

  async verify(otp: string, otpHash: string): Promise<boolean> {
    return bcrypt.compare(otp, otpHash);
  }
}
