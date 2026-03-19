import { Injectable } from '@nestjs/common';
import { DeadlineInstance, DeadlineRule } from '@prisma/client';
import { differenceInDays } from 'date-fns';

type InstanceWithRule = DeadlineInstance & { rule: DeadlineRule };

@Injectable()
export class PenaltyCalculatorService {
  /**
   * Calculate accumulated penalty for a single overdue deadline instance
   */
  calculateAccruedPenalty(instance: InstanceWithRule): number {
    if (instance.status === 'FILED') return 0;

    const daysOverdue = Math.max(0, differenceInDays(new Date(), instance.dueDate));
    if (daysOverdue === 0) return 0;

    const rule = instance.rule;

    // Fixed penalty (e.g., DIR-3 KYC = ₹5,000 flat)
    if (rule.penaltyFixed !== null && rule.penaltyFixed > 0) {
      return rule.penaltyFixed;
    }

    // Per-day penalty (e.g., GST = ₹50/day)
    if (rule.penaltyPerDay !== null && rule.penaltyPerDay > 0) {
      return rule.penaltyPerDay * daysOverdue;
    }

    // Rate-based penalty (e.g., TDS = 1.5%/month of tax due)
    if (rule.penaltyRate !== null && rule.penaltyRate > 0) {
      // Rate-based: return rate per month as a percentage display
      const monthsOverdue = daysOverdue / 30;
      return rule.penaltyRate * monthsOverdue;
    }

    return 0;
  }

  /**
   * Calculate total penalty across all overdue instances
   */
  calculateTotalPenalty(instances: InstanceWithRule[]): number {
    return instances
      .filter((i) => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + this.calculateAccruedPenalty(i), 0);
  }

  /**
   * Calculate penalties saved (filed deadlines that would have been expensive)
   */
  calculatePenaltySaved(instances: InstanceWithRule[]): number {
    return instances
      .filter((i) => i.status === 'FILED' && i.filedAt)
      .reduce((sum, i) => {
        const daysLate = Math.max(0, differenceInDays(i.filedAt!, i.dueDate));
        if (daysLate > 0) return sum; // Was actually late — no saving
        // Filed on time — calculate what penalty would have been if missed (7 days)
        const hypothetical = this.hypotheticalPenalty(i.rule, 7);
        return sum + hypothetical;
      }, 0);
  }

  private hypotheticalPenalty(rule: DeadlineRule, days: number): number {
    if (rule.penaltyFixed) return rule.penaltyFixed;
    if (rule.penaltyPerDay) return rule.penaltyPerDay * days;
    return 0;
  }

  getDaysOverdue(dueDate: Date): number {
    return Math.max(0, differenceInDays(new Date(), dueDate));
  }

  getPenaltyDescription(rule: DeadlineRule): string {
    if (rule.penaltyFixed) return `₹${rule.penaltyFixed.toLocaleString('en-IN')} fixed`;
    if (rule.penaltyPerDay) return `₹${rule.penaltyPerDay}/day`;
    if (rule.penaltyRate) return `${rule.penaltyRate}% p.a.`;
    return rule.penaltyFormula;
  }
}
