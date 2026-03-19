import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PenaltyCalculatorService } from '../deadlines/engine/penalty-calculator.service';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private penaltyCalc: PenaltyCalculatorService,
  ) {}

  async getScore(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('Business profile not found');

    const [score, instances] = await Promise.all([
      this.prisma.complianceScore.findUnique({ where: { businessId: business.id } }),
      this.prisma.deadlineInstance.findMany({
        where: { businessId: business.id },
        include: { rule: true },
        orderBy: { dueDate: 'desc' },
        take: 100,
      }),
    ]);

    const penaltySaved = this.penaltyCalc.calculatePenaltySaved(instances as any);
    const totalPenalty = this.penaltyCalc.calculateTotalPenalty(
      instances.filter((i) => i.status === 'OVERDUE') as any,
    );

    const tips = this.generateImprovementTips(instances as any, score);

    return {
      overall:    score?.overallScore    ?? 100,
      gst:        score?.gstScore        ?? 100,
      tds:        score?.tdsScore        ?? 100,
      pfEsi:      score?.pfEsiScore      ?? 100,
      mca:        score?.mcaScore        ?? 100,
      industry:   score?.industryScore   ?? 100,
      totalFiled: score?.totalFiled      ?? 0,
      totalMissed: score?.totalMissed    ?? 0,
      penaltySaved: Math.round(penaltySaved),
      totalPenaltyAtRisk: Math.round(totalPenalty),
      improvementTips: tips,
      calculatedAt: score?.calculatedAt ?? new Date(),
    };
  }

  private generateImprovementTips(instances: any[], score: any): string[] {
    const tips: string[] = [];

    if (!score) return ['Complete your business profile to start tracking compliance.'];

    if ((score.mcaScore ?? 100) < 80) {
      const nextMca = instances.find((i) => i.rule.category === 'MCA' && i.status === 'PENDING');
      if (nextMca) {
        const dueStr = nextMca.dueDate.toLocaleDateString('en-IN');
        tips.push(`File your ${nextMca.rule.formNumber} (due ${dueStr}) on time to improve your MCA score by up to 10 points.`);
      }
    }

    if ((score.tdsScore ?? 100) < 90) {
      tips.push('Set up auto-reminders 7 days before TDS deposit deadlines to avoid late deposits.');
    }

    if ((score.gstScore ?? 100) < 85) {
      tips.push('Your GST score can improve by filing GSTR-1 and GSTR-3B on or before the 11th and 20th each month.');
    }

    if (score.totalMissed > 0) {
      tips.push(`You have missed ${score.totalMissed} deadline(s) so far. Filing overdue returns now will stop penalty accrual.`);
    }

    if (tips.length === 0) {
      tips.push('Excellent compliance! Keep filing on time to maintain your score above 90.');
    }

    return tips;
  }
}
