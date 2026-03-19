import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    req.id = uuid();
    const start = Date.now();
    return next.handle().pipe(tap(() => {
      const res = ctx.switchToHttp().getResponse();
      this.logger.log(`[${req.id}] ${req.method} ${req.url} → ${res.statusCode} (${Date.now()-start}ms)`);
    }));
  }
}
