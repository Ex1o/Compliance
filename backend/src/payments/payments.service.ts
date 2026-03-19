import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';
import { SubscriptionPlan } from '@prisma/client';

const PLAN_AMOUNTS: Record<SubscriptionPlan, number> = {
  FREE: 0, STARTER: 29900, GROWTH: 69900, CA_PARTNER: 249900,
};
const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  FREE: 'Free', STARTER: 'Starter', GROWTH: 'Growth Plan', CA_PARTNER: 'CA Partner Plan',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly razorpay: Razorpay;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.razorpay = new Razorpay({
      key_id:     config.get('RAZORPAY_KEY_ID'),
      key_secret: config.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createSubscription(userId: string, plan: SubscriptionPlan) {
    if (plan === 'FREE') throw new BadRequestException('No payment needed for Free plan');
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new BadRequestException('Complete business profile first');

    const rzpPlan = await this.razorpay.plans.create({
      period: 'monthly', interval: 1,
      item: { name: PLAN_NAMES[plan], amount: PLAN_AMOUNTS[plan], currency: 'INR' },
    });

    const rzpSub = await this.razorpay.subscriptions.create({
      plan_id: rzpPlan.id, total_count: 12, customer_notify: 1,
    });

    await this.prisma.subscription.upsert({
      where:  { businessId: business.id },
      create: { businessId: business.id, plan, status: 'TRIAL', razorpaySubId: rzpSub.id },
      update: { plan, razorpaySubId: rzpSub.id },
    });

    return { subscriptionId: rzpSub.id, keyId: this.config.get('RAZORPAY_KEY_ID'), plan, amount: PLAN_AMOUNTS[plan] };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (expected !== signature) throw new BadRequestException('Invalid webhook signature');

    const event = JSON.parse(payload.toString());
    const sub = event.payload?.subscription?.entity;
    if (!sub) return;

    const stored = await this.prisma.subscription.findFirst({ where: { razorpaySubId: sub.id } });
    if (!stored) return;

    switch (event.event) {
      case 'subscription.charged':
        await this.prisma.subscription.update({
          where: { id: stored.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd:   new Date(sub.current_end   * 1000),
          },
        });
        break;
      case 'subscription.cancelled':
        await this.prisma.subscription.update({
          where: { id: stored.id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), plan: 'FREE' },
        });
        break;
      case 'subscription.halted':
        await this.prisma.subscription.update({
          where: { id: stored.id }, data: { status: 'SUSPENDED' },
        });
        break;
    }
    this.logger.log(`Webhook processed: ${event.event}`);
  }

  async getCurrentSubscription(userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { userId }, include: { subscription: true },
    });
    return business?.subscription ?? null;
  }
}
