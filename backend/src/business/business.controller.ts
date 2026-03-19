import {
  Controller, Get, Post, Put, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessProfileDto } from './dto/create-business-profile.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Business')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'business', version: '1' })
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update business profile (onboarding wizard)' })
  @ApiResponse({ status: 200, description: 'Profile saved, deadline generation queued' })
  async createProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBusinessProfileDto,
  ) {
    return this.businessService.createOrUpdateProfile(user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current business profile' })
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.businessService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update business profile' })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateBusinessProfileDto,
  ) {
    return this.businessService.updateProfile(user.id, dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getNotifications(@CurrentUser() user: { id: string }) {
    return this.businessService.getNotificationPreferences(user.id);
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotifications(
    @CurrentUser() user: { id: string },
    @Body() body: any,
  ) {
    return this.businessService.updateNotificationPreferences(user.id, body);
  }
}
