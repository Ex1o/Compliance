import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PenaltyCalculatorService } from '../../deadlines/engine/penalty-calculator.service';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Processor('penalty-update')
export class PenaltyUpdateProcessor {
  private readonly logger = new Logger(PenaltyUpdateProcessor.name);

  constructor(
    private prisma: PrismaService,
    private penaltyCalc: PenaltyCalculatorService,
    @InjectQueue('penalty-update') private queue: Queue,
  ) {}

  // Run daily at midnight IST (18:30 UTC previous day)
  @Cron('30 18 * * *', { timeZone: 'UTC' })
  async schedulePenaltyUpdate() {
    await this.queue.add('update-all-penalties', {}, { priority: 3 });
    // Also mark newly overdue deadlines
    await this.queue.add('mark-overdue', {}, { priority: 2 });
  }

  @Process('mark-overdue')
  async handleMarkOverdue(_job: Job) {
    const now = new Date();
    const result = await this.prisma.deadlineInstance.updateMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      data:  { status: 'OVERDUE' },
    });
    this.logger.log(`Marked ${result.count} instances as OVERDUE`);
    return { count: result.count };
  }

  @Process('update-all-penalties')
  async handleUpdatePenalties(_job: Job) {
    const overdueInstances = await this.prisma.deadlineInstance.findMany({
      where: { status: 'OVERDUE' },
      include: { rule: true },
    });

    let updated = 0;
    for (const instance of overdueInstances) {
      const penalty = this.penaltyCalc.calculateAccruedPenalty(instance as any);
      await this.prisma.deadlineInstance.update({
        where: { id: instance.id },
        data:  { penaltyAccrued: penalty },
      });
      updated++;
    }
    this.logger.log(`Updated penalties for ${updated} overdue instances`);
    return { updated };
  }
}
