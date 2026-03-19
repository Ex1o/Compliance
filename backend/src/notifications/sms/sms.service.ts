import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private config: ConfigService) {}

  async sendOtp(mobile: string, otp: string): Promise<boolean> {
    try {
      const authKey    = this.config.get('MSG91_AUTH_KEY');
      const templateId = this.config.get('MSG91_OTP_TEMPLATE_ID');
      const senderId   = this.config.get('MSG91_SENDER_ID', 'CMPLWL');

      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        { mobile: `91${mobile}`, authkey: authKey, template_id: templateId, otp },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 },
      );

      this.logger.log(`OTP SMS sent to +91${mobile.slice(-4).padStart(10, '*')}`);
      return true;
    } catch (error: any) {
      this.logger.error(`OTP SMS failed: ${error?.message}`);
      return false;
    }
  }

  async sendReminderSms(mobile: string, message: string): Promise<boolean> {
    try {
      const authKey  = this.config.get('MSG91_AUTH_KEY');
      const senderId = this.config.get('MSG91_SENDER_ID', 'CMPLWL');

      await axios.get('https://api.msg91.com/api/sendhttp.php', {
        params: {
          authkey: authKey,
          mobiles: `91${mobile}`,
          message,
          sender: senderId,
          route: 4,
          country: 91,
        },
        timeout: 8000,
      });

      return true;
    } catch (error: any) {
      this.logger.error(`SMS failed to ${mobile}: ${error?.message}`);
      return false;
    }
  }
}
