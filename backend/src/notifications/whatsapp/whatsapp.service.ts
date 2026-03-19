import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface WhatsAppTemplatePayload {
  mobile: string;
  templateName: string;
  variables: Record<string, string>;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl = 'https://api.interakt.ai/v1/public/message';

  constructor(private config: ConfigService) {}

  async sendTemplate(payload: WhatsAppTemplatePayload): Promise<boolean> {
    try {
      const apiKey = this.config.get('INTERAKT_API_KEY');
      const response = await axios.post(
        this.baseUrl,
        {
          countryCode: '+91',
          phoneNumber: payload.mobile,
          type: 'Template',
          template: {
            name: payload.templateName,
            languageCode: 'en',
            headerValues: [],
            bodyValues: Object.values(payload.variables),
          },
        },
        {
          headers: {
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      this.logger.log(`WhatsApp sent to +91${payload.mobile.slice(-4).padStart(10,'*')}: ${payload.templateName}`);
      return response.status === 200;
    } catch (error: any) {
      this.logger.error(`WhatsApp failed to ${payload.mobile}: ${error?.message}`);
      return false;
    }
  }

  async sendDeadlineReminder(
    mobile: string,
    daysUntilDue: number,
    deadlineName: string,
    dueDate: string,
    penalty: string,
  ): Promise<boolean> {
    const templateMap: Record<number, string> = {
      7: this.config.get('INTERAKT_WA_TEMPLATE_7D', ''),
      3: this.config.get('INTERAKT_WA_TEMPLATE_3D', ''),
      0: this.config.get('INTERAKT_WA_TEMPLATE_DUE', ''),
    };

    const templateName = templateMap[daysUntilDue];
    if (!templateName) {
      this.logger.warn(`No template for ${daysUntilDue} days reminder`);
      return false;
    }

    return this.sendTemplate({
      mobile,
      templateName,
      variables: { deadlineName, dueDate, penalty, daysLeft: String(daysUntilDue) },
    });
  }

  async sendDeadlineExtensionAlert(
    mobile: string,
    deadlineName: string,
    oldDate: string,
    newDate: string,
  ): Promise<boolean> {
    return this.sendTemplate({
      mobile,
      templateName: this.config.get('INTERAKT_WA_TEMPLATE_EXT', ''),
      variables: { deadlineName, oldDate, newDate },
    });
  }
}
