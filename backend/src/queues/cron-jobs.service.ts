import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronJobsService implements OnModuleInit {
  private readonly logger = new Logger(CronJobsService.name);

  constructor(
    @InjectQueue('whatsapp-reminders') private reminderQueue: Queue,
    @InjectQueue('penalty-update')     private penaltyQueue: Queue,
  ) {}

  async onModuleInit() {
    // Set up repeatable jobs on startup (idempotent)
    await this.setupRepeatableJobs();
    this.logger.log('Repeatable cron jobs registered');
  }

  private async setupRepeatableJobs() {
    // Remove existing repeatable jobs to avoid duplicates
    const existing = await this.reminderQueue.getRepeatableJobs();
    for (const job of existing) {
      await this.reminderQueue.removeRepeatableByKey(job.key);
    }

    // 7-day reminders: 8:00 AM IST (2:30 AM UTC)
    await this.reminderQueue.add('send-7day-reminders', {}, {
      repeat: { cron: '30 2 * * *', tz: 'Asia/Kolkata' },
      jobId: 'cron-7day',
      removeOnComplete: 50,
      removeOnFail: 100,
    });

    // 3-day reminders: 8:15 AM IST
    await this.reminderQueue.add('send-3day-reminders', {}, {
      repeat: { cron: '45 2 * * *', tz: 'Asia/Kolkata' },
      jobId: 'cron-3day',
    });

    // Due-today reminders: 8:30 AM IST
    await this.reminderQueue.add('send-due-today-reminders', {}, {
      repeat: { cron: '0 3 * * *', tz: 'Asia/Kolkata' },
      jobId: 'cron-due-today',
    });

    // Penalty updates: midnight IST
    const penaltyExisting = await this.penaltyQueue.getRepeatableJobs();
    for (const job of penaltyExisting) {
      await this.penaltyQueue.removeRepeatableByKey(job.key);
    }
    await this.penaltyQueue.add('update-all-penalties', {}, {
      repeat: { cron: '30 18 * * *', tz: 'Asia/Kolkata' }, // 18:30 UTC = midnight IST
      jobId: 'cron-penalty-update',
    });
  }

  // Health heartbeat - log queue depths every hour
  @Cron(CronExpression.EVERY_HOUR)
  async logQueueHealth() {
    const [waiting, active, failed] = await Promise.all([
      this.reminderQueue.getWaitingCount(),
      this.reminderQueue.getActiveCount(),
      this.reminderQueue.getFailedCount(),
    ]);
    this.logger.log(`Queue health — waiting: ${waiting}, active: ${active}, failed: ${failed}`);

    if (failed > 10) {
      this.logger.error(`HIGH FAILED JOB COUNT: ${failed}. Check Bull Board.`);
    }
  }
}
