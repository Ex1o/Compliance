import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Business, DeadlineRule, EntityType, GstStatus,
  EmployeeRange, Industry, DeadlineCategory,
} from '@prisma/client';
import {
  addMonths, addDays, addYears, startOfMonth, endOfMonth,
  setDate, getYear, getMonth, format, isAfter, isBefore,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

@Injectable()
export class DeadlineRulesEngine {
  private readonly logger = new Logger(DeadlineRulesEngine.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Main entry: given a business profile, return all applicable deadlines
   * for the next 12 months
   */
  async generateDeadlinesForBusiness(business: Business): Promise<{
    ruleId: string;
    dueDate: Date;
    periodLabel: string;
  }[]> {
    const rules = await this.getApplicableRules(business);
    this.logger.log(`Found ${rules.length} applicable rules for business ${business.id}`);

    const instances: { ruleId: string; dueDate: Date; periodLabel: string }[] = [];
    const now = toZonedTime(new Date(), IST);
    const endDate = addYears(now, 1);

    for (const rule of rules) {
      const dates = this.computeDueDates(rule, now, endDate);
      instances.push(...dates.map((d) => ({
        ruleId: rule.id,
        dueDate: d.date,
        periodLabel: d.label,
      })));
    }

    return instances;
  }

  /**
   * Filter the full rules database to only those applicable to this business
   */
  async getApplicableRules(business: Business): Promise<DeadlineRule[]> {
    const allRules = await this.prisma.deadlineRule.findMany({
      where: { isActive: true },
    });

    return allRules.filter((rule) => this.ruleApplies(rule, business));
  }

  private ruleApplies(rule: DeadlineRule, business: Business): boolean {
    // Entity type filter
    if (rule.applicableEntityTypes.length > 0 &&
        !rule.applicableEntityTypes.includes(business.entityType)) {
      return false;
    }

    // GST status filter
    if (rule.applicableGstStatuses.length > 0 &&
        !rule.applicableGstStatuses.includes(business.gstStatus)) {
      return false;
    }

    // Employee threshold
    if (rule.minEmployees !== null) {
      const empNumber = this.employeeRangeToNumber(business.employeeRange);
      if (empNumber < rule.minEmployees) return false;
    }

    // Industry filter
    if (rule.applicableIndustries.length > 0 &&
        !rule.applicableIndustries.includes(business.industry)) {
      return false;
    }

    // State filter (empty = all India)
    if (rule.applicableStates.length > 0 &&
        !rule.applicableStates.some((s) => business.states.includes(s))) {
      return false;
    }

    // Special flags
    if (rule.category === 'INDUSTRY') {
      // FEMA/LUT only for exporters
      if (rule.formNumber.includes('LUT') && !business.isExporter) return false;
      // POSH only if hasPoshObligation
      if (rule.formNumber.includes('POSH') && !business.hasPoshObligation) return false;
    }

    return true;
  }

  private computeDueDates(
    rule: DeadlineRule,
    from: Date,
    to: Date,
  ): { date: Date; label: string }[] {
    const results: { date: Date; label: string }[] = [];

    switch (rule.frequency) {
      case 'MONTHLY':
        results.push(...this.monthlyDates(rule.dueDateFormula, from, to));
        break;
      case 'QUARTERLY':
        results.push(...this.quarterlyDates(rule.dueDateFormula, from, to));
        break;
      case 'HALF_YEARLY':
        results.push(...this.halfYearlyDates(rule.dueDateFormula, from, to));
        break;
      case 'ANNUAL':
        results.push(...this.annualDates(rule.dueDateFormula, from, to));
        break;
      default:
        break;
    }

    return results.filter((r) => isAfter(r.date, from) && isBefore(r.date, to));
  }

  /**
   * Monthly: formula = "day:20" means 20th of each month
   * Special: "day:7:march:30" means 7th monthly except March → 30th April
   */
  private monthlyDates(formula: string, from: Date, to: Date): { date: Date; label: string }[] {
    const parts = formula.split(':');
    const dayNum = parseInt(parts[1], 10);
    const results: { date: Date; label: string }[] = [];
    let cursor = new Date(from);

    while (isBefore(cursor, to)) {
      const month = getMonth(cursor);
      const year = getYear(cursor);
      let dueDate = setDate(new Date(year, month, 1), dayNum);

      // Handle March exception (TDS: due 30 April instead of 7 April)
      if (parts[2] === 'march' && month === 2) {
        dueDate = setDate(new Date(year, 3, 1), parseInt(parts[3], 10));
      }

      const label = format(new Date(year, month, 1), 'MMM yyyy');
      results.push({ date: dueDate, label });
      cursor = addMonths(cursor, 1);
    }
    return results;
  }

  /**
   * Quarterly: formula = "31:jan,may,jul,oct" = 31st of those months
   */
  private quarterlyDates(formula: string, from: Date, to: Date): { date: Date; label: string }[] {
    const [day, monthsStr] = formula.split(':');
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const targetMonths = monthsStr.split(',').map((m) => monthNames.indexOf(m.trim().toLowerCase()));
    const dayNum = parseInt(day, 10);
    const results: { date: Date; label: string }[] = [];

    let year = getYear(from);
    while (year <= getYear(to) + 1) {
      for (const month of targetMonths) {
        const dueDate = setDate(new Date(year, month, 1), dayNum);
        if (isAfter(dueDate, from) && isBefore(dueDate, to)) {
          // Label: quarter this covers
          const prevMonths = [month - 1, month - 2, month - 3].map((m) => (m + 12) % 12);
          const label = `Q ending ${format(new Date(year, prevMonths[0], 1), 'MMM yyyy')}`;
          results.push({ date: dueDate, label });
        }
      }
      year++;
    }
    return results;
  }

  /**
   * Half-yearly: formula = "11:may,nov"
   */
  private halfYearlyDates(formula: string, from: Date, to: Date): { date: Date; label: string }[] {
    const [day, monthsStr] = formula.split(':');
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const targetMonths = monthsStr.split(',').map((m) => monthNames.indexOf(m.trim().toLowerCase()));
    const dayNum = parseInt(day, 10);
    const results: { date: Date; label: string }[] = [];

    let year = getYear(from);
    while (year <= getYear(to) + 1) {
      for (const month of targetMonths) {
        const dueDate = setDate(new Date(year, month, 1), dayNum);
        if (isAfter(dueDate, from) && isBefore(dueDate, to)) {
          results.push({ date: dueDate, label: format(dueDate, 'MMM yyyy') });
        }
      }
      year++;
    }
    return results;
  }

  /**
   * Annual: formula = "30:sep" = 30th September every year
   */
  private annualDates(formula: string, from: Date, to: Date): { date: Date; label: string }[] {
    const [day, monthStr] = formula.split(':');
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const month = monthNames.indexOf(monthStr.trim().toLowerCase());
    const dayNum = parseInt(day, 10);
    const results: { date: Date; label: string }[] = [];

    let year = getYear(from);
    while (year <= getYear(to) + 1) {
      const dueDate = setDate(new Date(year, month, 1), dayNum);
      if (isAfter(dueDate, from) && isBefore(dueDate, to)) {
        results.push({ date: dueDate, label: `FY ${year}-${(year + 1).toString().slice(2)}` });
      }
      year++;
    }
    return results;
  }

  private employeeRangeToNumber(range: EmployeeRange): number {
    const map: Record<EmployeeRange, number> = {
      SOLO: 1,
      SMALL: 5,
      GROWING: 15,
      MID: 50,
      LARGE: 200,
    };
    return map[range] ?? 0;
  }

  /**
   * Calculate penalty accrued for an overdue deadline
   */
  calculatePenalty(rule: DeadlineRule, dueDate: Date, asOf: Date = new Date()): number {
    if (isBefore(asOf, dueDate)) return 0;

    const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (rule.penaltyFixed) return rule.penaltyFixed;
    if (rule.penaltyPerDay) return daysOverdue * rule.penaltyPerDay;
    if (rule.penaltyRate) {
      // Rate-based (e.g. 1.5% per month on tax amount) — return per-day equivalent
      return (rule.penaltyRate / 30) * daysOverdue;
    }
    return 0;
  }
}
