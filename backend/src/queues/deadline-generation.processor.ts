import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DeadlineEngineService } from '../deadlines/engine/deadline-engine.service';

@Processor('deadline-generation')
export class DeadlineGenerationProcessor {
  private readonly logger = new Logger(DeadlineGenerationProcessor.name);

  constructor(private deadlineEngine: DeadlineEngineService) {}

  @Process('generate-deadlines')
  async handleGenerate(job: Job<{ businessId: string }>) {
    this.logger.log(`Generating deadlines for business ${job.data.businessId}`);
    const count = await this.deadlineEngine.generateDeadlinesForBusiness(job.data.businessId);
    this.logger.log(`Generated ${count} deadline instances for ${job.data.businessId}`);
    return { count };
  }

  @Process('regenerate-deadlines')
  async handleRegenerate(job: Job<{ businessId: string }>) {
    this.logger.log(`Regenerating deadlines for business ${job.data.businessId}`);
    const count = await this.deadlineEngine.generateDeadlinesForBusiness(job.data.businessId);
    return { count };
  }

  @OnQueueFailed()
  handleFailed(job: Job, err: Error) {
    this.logger.error(`Deadline generation failed for job ${job.id}: ${err.message}`);
  }
}
