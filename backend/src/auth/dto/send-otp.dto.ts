// ─── dto/send-otp.dto.ts ─────────────────────────────────────────────────────
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210', description: 'Indian 10-digit mobile number' })
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9]\d{9}$/, { message: 'Must be a valid Indian mobile number' })
  mobile: string;
}
