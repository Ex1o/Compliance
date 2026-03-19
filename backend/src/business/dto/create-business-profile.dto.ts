import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEnum, IsArray, IsBoolean, IsOptional,
  Matches, Length, ArrayMinSize,
} from 'class-validator';
import {
  EntityType, GstStatus, EmployeeRange,
  Industry, TurnoverRange,
} from '@prisma/client';

export class CreateBusinessProfileDto {
  @ApiProperty({ example: 'Rajesh Textiles Pvt Ltd' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ example: '27AABCR1234K1Z5' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
  gstin?: string;

  @ApiProperty({ enum: EntityType })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({ enum: GstStatus })
  @IsEnum(GstStatus)
  gstStatus: GstStatus;

  @ApiProperty({ enum: EmployeeRange })
  @IsEnum(EmployeeRange)
  employeeRange: EmployeeRange;

  @ApiProperty({ example: ['MH', 'GJ'], description: 'ISO state codes' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  states: string[];

  @ApiProperty({ enum: Industry })
  @IsEnum(Industry)
  industry: Industry;

  @ApiProperty({ enum: TurnoverRange })
  @IsEnum(TurnoverRange)
  turnoverRange: TurnoverRange;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isExporter?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasPoshObligation?: boolean;
}
