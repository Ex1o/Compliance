import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class DevSkipLoginDto {
  @ApiPropertyOptional({ example: '9876543210', description: 'Optional Indian 10-digit mobile number for dev login' })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9]\d{9}$/, { message: 'Must be a valid Indian mobile number' })
  mobile?: string;
}
