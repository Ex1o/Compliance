import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeadlinesService } from '../deadlines/deadlines.service';
import { PenaltyCalculatorService } from '../deadlines/engine/penalty-calculator.service';
import { UserRole } from '@prisma/client';
import { decryptField } from '../common/utils/crypto.util';

@Injectable()
export class CaService {
  private readonly logger = new Logger(CaService.name);

  constructor(
    private prisma: PrismaService,
    private deadlinesService: DeadlinesService,
    private penaltyCalc: PenaltyCalculatorService,
  ) {}

  async ensureCaProfile(userId: string) {
    return this.prisma.cAProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getDashboard(userId: string) {
    const ca = await this.prisma.cAProfile.findUnique({
      where: { userId },
      include: {
        clients: {
          include: {
            deadlines: { include: { rule: true }, orderBy: { dueDate: 'asc' } },
            subscription: true,
            user: true,
          },
        },
      },
    });
    if (!ca) throw new NotFoundException('CA profile not found');

    const clientSummaries = ca.clients.map((client) => {
      const overdue   = client.deadlines.filter((d) => d.status === 'OVERDUE').length;
      const thisWeek  = client.deadlines.filter((d) => {
        const days = Math.ceil((d.dueDate.getTime() - Date.now()) / 86400000);
        return d.status === 'PENDING' && days >= 0 && days <= 7;
      }).length;

      const totalPenalty = this.penaltyCalc.calculateTotalPenalty(client.deadlines as any);
      const nextDeadline = client.deadlines.find((d) => d.status === 'PENDING' && d.dueDate > new Date());

      return {
        id:           client.id,
        name:         client.name,
        entityType:   client.entityType,
        overdueCount: overdue,
        dueThisWeek:  thisWeek,
        totalPenalty: Math.round(totalPenalty),
        nextDeadline: nextDeadline ? {
          title:   (nextDeadline as any).rule.title,
          dueDate: nextDeadline.dueDate,
          daysLeft: Math.ceil((nextDeadline.dueDate.getTime() - Date.now()) / 86400000),
        } : null,
        complianceScore: this.calculateQuickScore(client.deadlines),
      };
    });

    const summary = {
      totalClients:   clientSummaries.length,
      overdueClients: clientSummaries.filter((c) => c.overdueCount > 0).length,
      dueThisWeek:    clientSummaries.reduce((s, c) => s + c.dueThisWeek, 0),
      allClear:       clientSummaries.filter((c) => c.overdueCount === 0 && c.dueThisWeek === 0).length,
    };

    return { summary, clients: clientSummaries };
  }

  async getClientDeadlines(caUserId: string, clientBusinessId: string) {
    const ca = await this.prisma.cAProfile.findUnique({ where: { userId: caUserId } });
    if (!ca) throw new NotFoundException('CA profile not found');

    const client = await this.prisma.business.findFirst({
      where: { id: clientBusinessId, caId: ca.id },
      include: { deadlines: { include: { rule: true }, orderBy: { dueDate: 'asc' } } },
    });
    if (!client) throw new ForbiddenException('Client not found or not in your portfolio');
    return client;
  }

  async markClientDeadlineFiled(caUserId: string, instanceId: string) {
    const ca = await this.prisma.cAProfile.findUnique({ where: { userId: caUserId } });
    if (!ca) throw new NotFoundException();

    const instance = await this.prisma.deadlineInstance.findUnique({
      where: { id: instanceId },
      include: { business: true },
    });
    if (!instance) throw new NotFoundException('Deadline instance not found');
    if (instance.business.caId !== ca.id) throw new ForbiddenException('Not your client');

    return this.prisma.deadlineInstance.update({
      where: { id: instanceId },
      data: { status: 'FILED', filedAt: new Date(), filedByUserId: caUserId },
    });
  }

  async addClient(caUserId: string, clientMobile: string) {
    const ca = await this.ensureCaProfile(caUserId);
    const clientMobileHash = require('../common/utils/crypto.util').hashField(clientMobile);
    const clientUser = await this.prisma.user.findUnique({ where: { mobileHash: clientMobileHash } });
    if (!clientUser) throw new NotFoundException('User with this mobile not found. Ask them to sign up first.');

    const clientBusiness = await this.prisma.business.findUnique({ where: { userId: clientUser.id } });
    if (!clientBusiness) throw new NotFoundException('Client has not completed their business profile yet.');

    await this.prisma.business.update({
      where: { id: clientBusiness.id },
      data: { caId: ca.id },
    });

    this.logger.log(`CA ${caUserId} added client ${clientBusiness.id}`);
    return { message: 'Client linked successfully', clientName: clientBusiness.name };
  }

  async removeClient(caUserId: string, clientBusinessId: string) {
    const ca = await this.prisma.cAProfile.findUnique({ where: { userId: caUserId } });
    if (!ca) throw new NotFoundException();

    await this.prisma.business.updateMany({
      where: { id: clientBusinessId, caId: ca.id },
      data: { caId: null },
    });
    return { message: 'Client unlinked' };
  }

  private calculateQuickScore(deadlines: any[]): number {
    const past = deadlines.filter((d) => d.dueDate < new Date());
    if (!past.length) return 100;
    const filed = past.filter((d) => d.status === 'FILED').length;
    return Math.round((filed / past.length) * 100);
  }
}
