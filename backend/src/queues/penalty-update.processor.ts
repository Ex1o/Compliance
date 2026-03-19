import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { PenaltyCalculatorService } from '../deadlines/engine/penalty-calculator.service';

@Processor('penalty-update')
export class PenaltyUpdateProcessor {
  private readonly logger = new Logger(PenaltyUpdateProcessor.name);

  constructor(
    private prisma: PrismaService,
    private penaltyCalc: PenaltyCalculatorService,
    @InjectQueue('penalty-update') private penaltyQueue: Queue,
  ) {}

  // Run at midnight IST every day
  @Cron('30 18 * * *', { timeZone: 'UTC' })
  async schedulePenaltyUpdate() {
    await this.penaltyQueue.add('update-all-penalties', {}, { attempts: 2 });
  }

  @Process('update-all-penalties')
  async handlePenaltyUpdate(job: Job) {
    // Mark all past-due PENDING instances as OVERDUE
    const updated = await this.prisma.deadlineInstance.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });

    this.logger.log(`Updated ${updated.count} instances to OVERDUE status`);

    // Update accrued penalty for all overdue instances
    const overdueInstances = await this.prisma.deadlineInstance.findMany({
      where: { status: 'OVERDUE' },
      include: { rule: true },
      take: 5000,
    });

    let penaltyUpdated = 0;
    for (const instance of overdueInstances) {
      const accrued = this.penaltyCalc.calculateAccruedPenalty(instance as any);
      await this.prisma.deadlineInstance.update({
        where: { id: instance.id },
        data: { penaltyAccrued: accrued },
      });
      penaltyUpdated++;
    }

    this.logger.log(`Updated penalty amounts for ${penaltyUpdated} overdue instances`);
    return { updated: updated.count, penaltyUpdated };
  }
}
