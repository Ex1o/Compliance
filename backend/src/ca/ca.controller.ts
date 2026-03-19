import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CaService } from './ca.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AddClientDto {
  @ApiProperty({ example: '9876543210' })
  @IsString() @Length(10,10) @Matches(/^[6-9]\d{9}$/)
  mobile: string;
}

@ApiTags('CA')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CA_PARTNER)
@Controller({ path: 'ca', version: '1' })
export class CaController {
  constructor(private readonly caService: CaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'CA dashboard: all clients with deadline summary' })
  getDashboard(@CurrentUser() user: { id: string }) {
    return this.caService.getDashboard(user.id);
  }

  @Get('clients/:businessId/deadlines')
  @ApiOperation({ summary: 'Get deadlines for a specific client' })
  getClientDeadlines(
    @CurrentUser() user: { id: string },
    @Param('businessId') businessId: string,
  ) {
    return this.caService.getClientDeadlines(user.id, businessId);
  }

  @Patch('clients/deadlines/:instanceId/file')
  @ApiOperation({ summary: 'Mark a client deadline as filed' })
  markFiled(
    @CurrentUser() user: { id: string },
    @Param('instanceId') instanceId: string,
  ) {
    return this.caService.markClientDeadlineFiled(user.id, instanceId);
  }

  @Post('clients')
  @ApiOperation({ summary: 'Add a client by mobile number' })
  addClient(
    @CurrentUser() user: { id: string },
    @Body() dto: AddClientDto,
  ) {
    return this.caService.addClient(user.id, dto.mobile);
  }

  @Delete('clients/:businessId')
  @ApiOperation({ summary: 'Remove a client from CA portfolio' })
  removeClient(
    @CurrentUser() user: { id: string },
    @Param('businessId') businessId: string,
  ) {
    return this.caService.removeClient(user.id, businessId);
  }
}
