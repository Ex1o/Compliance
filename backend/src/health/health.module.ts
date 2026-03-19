import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DeadlinesModule } from '../deadlines/deadlines.module';
@Module({ imports: [DeadlinesModule], controllers: [HealthController], providers: [HealthService] })
export class HealthModule {}
