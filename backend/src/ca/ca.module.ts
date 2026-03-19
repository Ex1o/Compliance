import { Module } from '@nestjs/common';
import { CaController } from './ca.controller';
import { CaService } from './ca.service';
import { DeadlinesModule } from '../deadlines/deadlines.module';
@Module({ imports: [DeadlinesModule], controllers: [CaController], providers: [CaService], exports: [CaService] })
export class CaModule {}
