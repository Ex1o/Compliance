import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('whatsapp-reminders')
export class WhatsappReminderProcessor {
  private readonly logger = new Logger(WhatsappReminderProcessor.name);

  constructor(
    private notificationsService: NotificationsService,
    @InjectQueue('whatsapp-reminders') private reminderQueue: Queue,
  ) {}

  // Schedule daily at 8 AM IST (2:30 AM UTC)
  @Cron('30 2 * * *', { timeZone: 'Asia/Kolkata' })
  async scheduleDailyReminders() {
    this.logger.log('Scheduling daily WhatsApp reminders...');
    await this.reminderQueue.add('send-7day', {}, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    await this.reminderQueue.add('send-3day', {}, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    await this.reminderQueue.add('send-today', {}, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  }

  @Process('send-7day')
  async handle7Day(job: Job) {
    const count = await this.notificationsService.sendRemindersForDueIn(7);
    return { sent: count };
  }

  @Process('send-3day')
  async handle3Day(job: Job) {
    const count = await this.notificationsService.sendRemindersForDueIn(3);
    return { sent: count };
  }

  @Process('send-today')
  async handleToday(job: Job) {
    const count = await this.notificationsService.sendRemindersForDueIn(0);
    return { sent: count };
  }

  @OnQueueFailed()
  handleFailed(job: Job, err: Error) {
    this.logger.error(`WhatsApp reminder job ${job.id} failed: ${err.message}`);
  }
}
