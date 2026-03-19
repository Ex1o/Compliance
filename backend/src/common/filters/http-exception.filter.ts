import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code    = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();
      message = typeof exRes === 'string' ? exRes : (exRes as any).message ?? message;
      code    = (exRes as any).error ?? exception.constructor.name;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if      (exception.code === 'P2002') { status = HttpStatus.CONFLICT;   message = 'Record already exists';      code = 'DUPLICATE'; }
      else if (exception.code === 'P2025') { status = HttpStatus.NOT_FOUND;  message = 'Record not found';           code = 'NOT_FOUND'; }
      else                                 { status = HttpStatus.BAD_REQUEST; message = 'Database constraint error';  code = 'DB_ERROR';  }
    }

    if (status >= 500) {
      Sentry.captureException(exception);
      this.logger.error(`[${req.method}] ${req.url} → ${status}`, exception instanceof Error ? exception.stack : exception);
    }

    res.status(status).json({
      success:    false,
      statusCode: status,
      code,
      message:    Array.isArray(message) ? message : [message],
      path:       req.url,
      timestamp:  new Date().toISOString(),
    });
  }
}
