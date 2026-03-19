import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { SmsService } from './sms/sms.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WhatsappService, SmsService],
  exports: [WhatsappService, SmsService, NotificationsService],
})
export class NotificationsModule {}
