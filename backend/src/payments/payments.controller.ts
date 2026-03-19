import {
  Controller, Post, Get, Body, Headers,
  Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SubscriptionPlan } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class CreateSubDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('subscribe')
  @ApiOperation({ summary: 'Create Razorpay subscription' })
  createSubscription(@CurrentUser() user: { id: string }, @Body() dto: CreateSubDto) {
    return this.paymentsService.createSubscription(user.id, dto.plan);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription' })
  getSubscription(@CurrentUser() user: { id: string }) {
    return this.paymentsService.getCurrentSubscription(user.id);
  }

  @Public()
  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook (public)' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    await this.paymentsService.handleWebhook((req as any).rawBody ?? Buffer.from(JSON.stringify(req.body)), signature);
    return { received: true };
  }
}
