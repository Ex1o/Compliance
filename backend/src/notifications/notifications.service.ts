import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { SmsService } from './sms/sms.service';
import { decryptField } from '../common/utils/crypto.util';
import { format } from 'date-fns';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private sms: SmsService,
  ) {}

  async sendRemindersForDueIn(daysAhead: number): Promise<number> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd   = new Date(targetDate.setHours(23, 59, 59, 999));

    // Check which notification flag to update
    const notifiedFlag = daysAhead === 7 ? 'notified7d'
      : daysAhead === 3 ? 'notified3d'
      : 'notified0d';

    const instances = await this.prisma.deadlineInstance.findMany({
      where: {
        dueDate:      { gte: dayStart, lte: dayEnd },
        status:       'PENDING',
        [notifiedFlag]: false,
      },
      include: {
        rule: true,
        business: { include: { user: true } },
      },
    });

    let sent = 0;
    for (const instance of instances) {
      try {
        const mobile = decryptField(instance.business.user.mobile);
        const dueStr = format(instance.dueDate, 'dd MMM yyyy');

        const ok = await this.whatsapp.sendDeadlineReminder(
          mobile,
          daysAhead,
          instance.rule.title,
          dueStr,
          instance.rule.penaltyFormula,
        );

        if (!ok) {
          // SMS fallback
          await this.sms.sendReminderSms(
            mobile,
            `ComplianceWala: ${instance.rule.title} is due on ${dueStr}. Penalty: ${instance.rule.penaltyFormula}. File at: ${instance.rule.portalUrl}`,
          );
        }

        // Mark as notified
        await this.prisma.deadlineInstance.update({
          where: { id: instance.id },
          data: { [notifiedFlag]: true },
        });

        // Log notification
        await this.prisma.notificationLog.create({
          data: {
            businessId: instance.businessId,
            channel:    ok ? 'WHATSAPP' : 'SMS',
            message:    `${instance.rule.title} — due ${dueStr}`,
            recipient:  mobile,
            status:     'SENT',
          },
        });

        sent++;
      } catch (err: any) {
        this.logger.error(`Failed reminder for instance ${instance.id}: ${err.message}`);
      }
    }

    this.logger.log(`Sent ${sent} reminders for ${daysAhead}-day deadline`);
    return sent;
  }

  async sendExtensionAlerts(ruleId: string, newDate: Date, oldDate: Date): Promise<number> {
    const rule = await this.prisma.deadlineRule.findUnique({ where: { id: ruleId } });
    if (!rule) return 0;

    const affected = await this.prisma.deadlineInstance.findMany({
      where: { ruleId, status: 'PENDING' },
      include: { business: { include: { user: true } } },
    });

    let sent = 0;
    for (const instance of affected) {
      try {
        const mobile = decryptField(instance.business.user.mobile);
        await this.whatsapp.sendDeadlineExtensionAlert(
          mobile,
          rule.title,
          format(oldDate, 'dd MMM yyyy'),
          format(newDate, 'dd MMM yyyy'),
        );
        sent++;
      } catch {}
    }
    return sent;
  }
}
