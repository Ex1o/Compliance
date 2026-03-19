import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Business, DeadlineRule, DeadlineFrequency,
  EntityType, GstStatus, Industry, EmployeeRange,
} from '@prisma/client';
import {
  startOfMonth, endOfMonth, addMonths, addDays,
  setDate, getMonth, getYear, format,
} from 'date-fns';

type BusinessWithRules = Business & { deadlineRules?: DeadlineRule[] };

@Injectable()
export class DeadlineEngineService {
  private readonly logger = new Logger(DeadlineEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Main entry point: generate 12 months of deadline instances for a business
   */
  async generateDeadlinesForBusiness(businessId: string): Promise<number> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error(`Business ${businessId} not found`);

    // Get all applicable rules
    const applicableRules = await this.getApplicableRules(business);
    this.logger.log(`Business ${businessId}: ${applicableRules.length} applicable rules found`);

    // Delete existing future instances (regeneration on profile change)
    await this.prisma.deadlineInstance.deleteMany({
      where: {
        businessId,
        dueDate: { gte: new Date() },
        status: 'PENDING',
      },
    });

    // Generate instances for next 12 months
    const instances: any[] = [];
    const now = new Date();
    const horizon = addMonths(now, 12);

    for (const rule of applicableRules) {
      const ruleDates = this.computeDueDates(rule, now, horizon);
      for (const { dueDate, periodLabel } of ruleDates) {
        instances.push({
          businessId,
          ruleId: rule.id,
          dueDate,
          periodLabel,
          status: dueDate < now ? 'OVERDUE' : 'PENDING',
        });
      }
    }

    // Upsert all instances (idempotent)
    let created = 0;
    for (const instance of instances) {
      await this.prisma.deadlineInstance.upsert({
        where: {
          businessId_ruleId_dueDate: {
            businessId: instance.businessId,
            ruleId: instance.ruleId,
            dueDate: instance.dueDate,
          },
        },
        create: instance,
        update: { status: instance.status },
      });
      created++;
    }

    this.logger.log(`Business ${businessId}: ${created} deadline instances generated`);
    return created;
  }

  /**
   * Filter the master rules list to only those applicable to this business
   */
  async getApplicableRules(business: Business): Promise<DeadlineRule[]> {
    const allRules = await this.prisma.deadlineRule.findMany({
      where: { isActive: true },
    });

    return allRules.filter((rule) => this.ruleApplies(rule, business));
  }

  private ruleApplies(rule: DeadlineRule, b: Business): boolean {
    // Entity type filter
    if (rule.applicableEntityTypes.length > 0 &&
        !rule.applicableEntityTypes.includes(b.entityType)) return false;

    // GST status filter
    if (rule.applicableGstStatuses.length > 0 &&
        !rule.applicableGstStatuses.includes(b.gstStatus)) return false;

    // Industry filter
    if (rule.applicableIndustries.length > 0 &&
        !rule.applicableIndustries.includes(b.industry)) return false;

    // State filter
    if (rule.applicableStates.length > 0 &&
        !rule.applicableStates.some((s) => b.states.includes(s))) return false;

    // Employee count filter
    if (rule.minEmployees !== null) {
      const counts: Record<EmployeeRange, number> = {
        SOLO: 1, SMALL: 5, GROWING: 15, MID: 50, LARGE: 200,
      };
      if (counts[b.employeeRange] < rule.minEmployees) return false;
    }

    return true;
  }

  /**
   * Compute actual due dates from a rule's formula
   */
  private computeDueDates(
    rule: DeadlineRule,
    from: Date,
    to: Date,
  ): { dueDate: Date; periodLabel: string }[] {
    const results: { dueDate: Date; periodLabel: string }[] = [];

    switch (rule.frequency) {
      case DeadlineFrequency.MONTHLY: {
        let cursor = new Date(from);
        while (cursor < to) {
          const dueDate = this.evaluateFormula(rule.dueDateFormula, cursor);
          if (dueDate && dueDate >= from && dueDate < to) {
            results.push({
              dueDate,
              periodLabel: format(cursor, 'MMMM yyyy'),
            });
          }
          cursor = addMonths(cursor, 1);
        }
        break;
      }
      case DeadlineFrequency.QUARTERLY: {
        const quarters = [
          { start: new Date(getYear(from), 3, 1), label: 'Q1 Apr–Jun' },
          { start: new Date(getYear(from), 6, 1), label: 'Q2 Jul–Sep' },
          { start: new Date(getYear(from), 9, 1), label: 'Q3 Oct–Dec' },
          { start: new Date(getYear(from), 0, 1), label: 'Q4 Jan–Mar' },
          { start: new Date(getYear(from) + 1, 3, 1), label: 'Q1 Apr–Jun' },
        ];
        for (const q of quarters) {
          const dueDate = this.evaluateFormula(rule.dueDateFormula, q.start);
          if (dueDate && dueDate >= from && dueDate < to) {
            results.push({ dueDate, periodLabel: q.label });
          }
        }
        break;
      }
      case DeadlineFrequency.ANNUAL: {
        for (let year = getYear(from); year <= getYear(to); year++) {
          const dueDate = this.evaluateFormulaAnnual(rule.dueDateFormula, year);
          if (dueDate && dueDate >= from && dueDate < to) {
            results.push({ dueDate, periodLabel: `FY ${year}–${year + 1}` });
          }
        }
        break;
      }
      case DeadlineFrequency.HALF_YEARLY: {
        const periods = [
          { start: new Date(getYear(from), 3, 1), label: 'Apr–Sep' },
          { start: new Date(getYear(from), 9, 1), label: 'Oct–Mar' },
          { start: new Date(getYear(from) + 1, 3, 1), label: 'Apr–Sep' },
        ];
        for (const p of periods) {
          const dueDate = this.evaluateFormula(rule.dueDateFormula, p.start);
          if (dueDate && dueDate >= from && dueDate < to) {
            results.push({ dueDate, periodLabel: p.label });
          }
        }
        break;
      }
    }

    return results;
  }

  /**
   * Evaluate a formula like "day:20:next_month" relative to a period start date
   */
  private evaluateFormula(formula: string, periodStart: Date): Date | null {
    try {
      // Format: "day:{N}:same_month" | "day:{N}:next_month" | "day:{N}:next_month+{X}"
      const parts = formula.split(':');
      if (parts[0] === 'day') {
        const dayNum = parseInt(parts[1], 10);
        let base = new Date(periodStart);
        if (parts[2] === 'next_month') base = addMonths(base, 1);
        if (parts[2]?.startsWith('next_month+')) {
          base = addMonths(base, parseInt(parts[2].split('+')[1], 10));
        }
        return setDate(base, dayNum);
      }
      return null;
    } catch {
      return null;
    }
  }

  private evaluateFormulaAnnual(formula: string, year: number): Date | null {
    try {
      // Format: "annual:{month}:{day}" e.g. "annual:10:30" = October 30
      const parts = formula.split(':');
      if (parts[0] === 'annual') {
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day   = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return null;
    } catch {
      return null;
    }
  }
}
