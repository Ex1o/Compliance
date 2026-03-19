import {
  Injectable, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PenaltyCalculatorService } from './engine/penalty-calculator.service';
import { DeadlineStatus } from '@prisma/client';
import { addDays, isAfter, isBefore } from 'date-fns';

@Injectable()
export class DeadlinesService {
  private readonly logger = new Logger(DeadlinesService.name);

  constructor(
    private prisma: PrismaService,
    private penaltyCalc: PenaltyCalculatorService,
  ) {}

  async getDashboardSummary(userId: string) {
    const business = await this.getBusinessOrThrow(userId);

    const [overdue, dueThisWeek, dueThisMonth, allInstances] = await Promise.all([
      this.prisma.deadlineInstance.count({
        where: { businessId: business.id, status: 'OVERDUE' },
      }),
      this.prisma.deadlineInstance.count({
        where: {
          businessId: business.id,
          status: 'PENDING',
          dueDate: { gte: new Date(), lte: addDays(new Date(), 7) },
        },
      }),
      this.prisma.deadlineInstance.count({
        where: {
          businessId: business.id,
          status: 'PENDING',
          dueDate: { gte: new Date(), lte: addDays(new Date(), 30) },
        },
      }),
      this.prisma.deadlineInstance.findMany({
        where: { businessId: business.id },
        include: { rule: true },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
    ]);

    const overdueInstances = allInstances.filter((i) => i.status === 'OVERDUE');
    const totalPenalty = this.penaltyCalc.calculateTotalPenalty(overdueInstances as any);
    const penaltySaved = this.penaltyCalc.calculatePenaltySaved(allInstances as any);

    // Upcoming deadlines (next 10)
    const upcoming = allInstances
      .filter((i) => i.status !== 'FILED')
      .slice(0, 10)
      .map((i) => this.formatInstance(i));

    return {
      summary: { overdue, dueThisWeek, dueThisMonth },
      penalties: { total: Math.round(totalPenalty), saved: Math.round(penaltySaved) },
      overdueItems: overdueInstances.map((i) => ({
        ...this.formatInstance(i),
        accrued: Math.round(this.penaltyCalc.calculateAccruedPenalty(i as any)),
        daysOverdue: this.penaltyCalc.getDaysOverdue(i.dueDate),
      })),
      upcoming,
    };
  }

  async getAll(userId: string, filters: {
    category?: string; status?: string; search?: string;
  }) {
    const business = await this.getBusinessOrThrow(userId);

    const where: any = { businessId: business.id };
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.category) where.rule = { category: filters.category.toUpperCase() };
    if (filters.search) {
      where.rule = { ...where.rule, OR: [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { formNumber: { contains: filters.search, mode: 'insensitive' } },
      ]};
    }

    const instances = await this.prisma.deadlineInstance.findMany({
      where,
      include: { rule: true },
      orderBy: { dueDate: 'asc' },
    });

    return instances.map((i) => ({
      ...this.formatInstance(i),
      accrued: i.status === 'OVERDUE'
        ? Math.round(this.penaltyCalc.calculateAccruedPenalty(i as any))
        : 0,
    }));
  }

  async markAsFiled(userId: string, instanceId: string) {
    const instance = await this.prisma.deadlineInstance.findUnique({
      where: { id: instanceId },
      include: { business: true },
    });

    if (!instance) throw new NotFoundException('Deadline not found');
    if (instance.business.userId !== userId) throw new ForbiddenException();
    if (instance.status === 'FILED') return { message: 'Already marked as filed' };

    const updated = await this.prisma.deadlineInstance.update({
      where: { id: instanceId },
      data: { status: 'FILED', filedAt: new Date(), filedByUserId: userId },
      include: { rule: true },
    });

    // Recalculate compliance score async
    this.updateComplianceScore(instance.businessId).catch(() => {});

    this.logger.log(`Deadline ${instanceId} marked as filed by user ${userId}`);
    return { message: 'Filing recorded successfully', instance: this.formatInstance(updated) };
  }

  async getCalendar(userId: string, year: number, month: number) {
    const business = await this.getBusinessOrThrow(userId);
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0);

    const instances = await this.prisma.deadlineInstance.findMany({
      where: {
        businessId: business.id,
        dueDate: { gte: startDate, lte: endDate },
      },
      include: { rule: true },
      orderBy: { dueDate: 'asc' },
    });

    // Group by day
    const grouped: Record<number, any[]> = {};
    for (const instance of instances) {
      const day = instance.dueDate.getDate();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(this.formatInstance(instance));
    }

    return { year, month, deadlines: grouped };
  }

  private async updateComplianceScore(businessId: string): Promise<void> {
    const instances = await this.prisma.deadlineInstance.findMany({
      where: { businessId },
      include: { rule: true },
    });

    const past = instances.filter((i) => isBefore(i.dueDate, new Date()));
    const filed = past.filter((i) => i.status === 'FILED');
    const missed = past.filter((i) => i.status === 'OVERDUE');
    const onTimeRate = past.length > 0 ? filed.length / past.length : 1;

    const byCategory = (cat: string) => {
      const catInstances = past.filter((i) => (i as any).rule.category === cat);
      if (!catInstances.length) return 100;
      const catFiled = catInstances.filter((i) => i.status === 'FILED');
      return Math.round((catFiled.length / catInstances.length) * 100);
    };

    const penaltySaved = this.penaltyCalc.calculatePenaltySaved(instances as any);

    await this.prisma.complianceScore.upsert({
      where: { businessId },
      create: {
        businessId,
        overallScore: Math.round(onTimeRate * 100),
        gstScore:     byCategory('GST'),
        tdsScore:     byCategory('TDS'),
        pfEsiScore:   byCategory('PF'),
        mcaScore:     byCategory('MCA'),
        industryScore: byCategory('INDUSTRY'),
        totalFiled:   filed.length,
        totalMissed:  missed.length,
        penaltySaved: Math.round(penaltySaved),
      },
      update: {
        overallScore: Math.round(onTimeRate * 100),
        gstScore:     byCategory('GST'),
        tdsScore:     byCategory('TDS'),
        pfEsiScore:   byCategory('PF'),
        mcaScore:     byCategory('MCA'),
        industryScore: byCategory('INDUSTRY'),
        totalFiled:   filed.length,
        totalMissed:  missed.length,
        penaltySaved: Math.round(penaltySaved),
        calculatedAt: new Date(),
      },
    });
  }

  private formatInstance(instance: any) {
    const daysLeft = Math.ceil(
      (instance.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return {
      id:          instance.id,
      title:       instance.rule.title,
      formNumber:  instance.rule.formNumber,
      category:    instance.rule.category,
      dueDate:     instance.dueDate,
      periodLabel: instance.periodLabel,
      status:      instance.status,
      daysLeft,
      isOverdue:   daysLeft < 0,
      filedAt:     instance.filedAt,
      penalty:     instance.rule.penaltyFormula,
      penaltyPerDay: instance.rule.penaltyPerDay,
      portalUrl:   instance.rule.portalUrl,
    };
  }

  private async getBusinessOrThrow(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('Business profile not found. Complete onboarding first.');
    return business;
  }
}
