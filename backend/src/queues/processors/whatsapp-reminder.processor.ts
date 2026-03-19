import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Processor('whatsapp-reminders')
export class WhatsappReminderProcessor {
  private readonly logger = new Logger(WhatsappReminderProcessor.name);

  constructor(
    private notificationsService: NotificationsService,
    @InjectQueue('whatsapp-reminders') private queue: Queue,
  ) {}

  // Schedule daily at 8:00 AM IST (02:30 UTC)
  @Cron('30 2 * * *', { timeZone: 'Asia/Kolkata' })
  async scheduleDailyReminders() {
    this.logger.log('Scheduling daily WhatsApp reminders');
    await this.queue.add('send-7d-reminders', {}, { priority: 1 });
    await this.queue.add('send-3d-reminders', {}, { priority: 1 });
    await this.queue.add('send-due-reminders', {}, { priority: 1 });
  }

  @Process('send-7d-reminders')
  async handle7dReminders(_job: Job) {
    const count = await this.notificationsService.sendRemindersForDueIn(7);
    return { sent: count };
  }

  @Process('send-3d-reminders')
  async handle3dReminders(_job: Job) {
    const count = await this.notificationsService.sendRemindersForDueIn(3);
    return { sent: count };
  }

  @Process('send-due-reminders')
  async handle0dReminders(_job: Job) {
    const count = await this.notificationsService.sendRemindersForDueIn(0);
    return { sent: count };
  }
}
