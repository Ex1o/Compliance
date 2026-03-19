// ─── interceptors/response.interceptor.ts ────────────────────────────────────
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode,
        message: data?.message ?? 'Success',
        data: data?.data !== undefined ? data.data : data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// ─── interceptors/logging.interceptor.ts ─────────────────────────────────────
import {
  Injectable as Inj2, NestInterceptor as NI2,
  ExecutionContext as EC2, CallHandler as CH2, Logger as Log2,
} from '@nestjs/common';
import { Observable as Obs2 } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Inj2()
export class LoggingInterceptor implements NI2 {
  private readonly logger = new Log2('HTTP');

  intercept(context: EC2, next: CH2): Obs2<any> {
    const req = context.switchToHttp().getRequest();
    const requestId = uuidv4();
    req.requestId = requestId;
    req.headers['x-request-id'] = requestId;

    const { method, url, ip } = req;
    const userAgent = req.headers['user-agent'] || '';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${url} ${res.statusCode} ${duration}ms — ${ip} — ${userAgent.substring(0, 50)}`,
          );
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.error(
            `${method} ${url} ERROR ${duration}ms — ${err.message}`,
          );
        },
      }),
    );
  }
}
