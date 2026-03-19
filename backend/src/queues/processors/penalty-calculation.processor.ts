import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('penalty-calculation')
export class PenaltyCalculationProcessor {
  private readonly logger = new Logger(PenaltyCalculationProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process({ name: 'update-overdue-status', concurrency: 1 })
  async handleUpdateOverdue(_job: Job) {
    const updated = await this.prisma.deadlineInstance.updateMany({
      where: {
        dueDate: { lt: new Date() },
        status: 'PENDING',
      },
      data: { status: 'OVERDUE' },
    });
    this.logger.log(`Marked ${updated.count} instances as OVERDUE`);
    return { updated: updated.count };
  }
}
