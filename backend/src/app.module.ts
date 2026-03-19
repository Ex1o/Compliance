import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { DeadlinesModule } from './deadlines/deadlines.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { CaModule } from './ca/ca.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueuesModule } from './queues/queues.module';
import { envValidation } from './config/env.validation';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Logger (Pino) ────────────────────────────────────────────────────────
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport: config.get('NODE_ENV') !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          serializers: {
            req: (req) => ({
              id: req.id,
              method: req.method,
              url: req.url,
              userId: req.raw?.user?.id,
            }),
          },
        },
      }),
    }),

    // ── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,  limit: 5  },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long',   ttl: 60000, limit: 60 },
    ]),

    // ── Task scheduling ──────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Bull queues (Redis) ──────────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 1000 },
        },
      }),
    }),

    // ── Feature modules ──────────────────────────────────────────────────────
    PrismaModule,
    AuthModule,
    BusinessModule,
    DeadlinesModule,
    NotificationsModule,
    PaymentsModule,
    CaModule,
    HealthModule,
    QueuesModule,
  ],
})
export class AppModule {}
