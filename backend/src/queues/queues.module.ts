import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DeadlineGenerationProcessor } from './processors/deadline-generation.processor';
import { WhatsappReminderProcessor } from './processors/whatsapp-reminder.processor';
import { PenaltyUpdateProcessor } from './processors/penalty-update.processor';
import { DeadlinesModule } from '../deadlines/deadlines.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'deadline-generation' },
      { name: 'whatsapp-reminders' },
      { name: 'penalty-update' },
    ),
    DeadlinesModule,
    NotificationsModule,
  ],
  providers: [
    DeadlineGenerationProcessor,
    WhatsappReminderProcessor,
    PenaltyUpdateProcessor,
  ],
})
export class QueuesModule {}
