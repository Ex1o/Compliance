import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Get('history')
  @ApiOperation({ summary: 'Get notification history for the current business' })
  async getHistory(@CurrentUser() user: { id: string }) {
    const business = await this.prisma.business.findUnique({ where: { userId: user.id } });
    if (!business) return [];
    return this.prisma.notificationLog.findMany({
      where: { businessId: business.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }
}
