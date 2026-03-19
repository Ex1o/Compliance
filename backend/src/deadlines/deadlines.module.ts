import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DeadlinesController } from './deadlines.controller';
import { DeadlinesService } from './deadlines.service';
import { DeadlineEngineService } from './engine/deadline-engine.service';
import { PenaltyCalculatorService } from './engine/penalty-calculator.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'deadline-generation' }, { name: 'whatsapp-reminders' })],
  controllers: [DeadlinesController],
  providers: [DeadlinesService, DeadlineEngineService, PenaltyCalculatorService],
  exports: [DeadlinesService, DeadlineEngineService, PenaltyCalculatorService],
})
export class DeadlinesModule {}
