import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { StructuredLoggerService } from './structured-logger.service';

/**
 * Logging Interceptor
 * 
 * Logs all HTTP requests and responses with metadata including:
 * - Method, URL, status code
 * - Request/response body (optional)
 * - Correlation ID, Trace ID
 * - Duration
 * - User information
 * 
 * Usage:
 * ```typescript
 * @UseInterceptors(LoggingInterceptor)
 * @Get('data')
 * getData() {
 *   return this.service.getData();
 * }
 * ```
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private structuredLogger?: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const { method, url, headers, ip } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    // Extract IDs
    const correlationId = (request as any).correlationId || headers['x-correlation-id'];
    const traceId = (request as any).traceId || headers['x-trace-id'];
    const userId = (request as any).user?.id;

    // Log request
    const requestLog = {
      type: 'request',
      method,
      url,
      ip,
      userAgent,
      correlationId,
      traceId,
      userId,
      timestamp: new Date().toISOString(),
    };

    if (this.structuredLogger) {
      this.structuredLogger.logWithMeta('info', 'Incoming request', requestLog, correlationId, traceId);
    } else {
      this.logger.log(
        `${method} ${url} - Correlation ID: ${correlationId || 'none'}, Trace ID: ${traceId || 'none'}`,
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          const responseLog = {
            type: 'response',
            method,
            url,
            statusCode,
            duration,
            correlationId,
            traceId,
            userId,
            timestamp: new Date().toISOString(),
          };

          if (this.structuredLogger) {
            const level = statusCode >= 400 ? 'warn' : 'info';
            this.structuredLogger.logWithMeta(
              level,
              'Request completed',
              responseLog,
              correlationId,
              traceId,
            );
          } else {
            this.logger.log(
              `${method} ${url} ${statusCode} - ${duration}ms - Correlation ID: ${correlationId || 'none'}`,
            );
          }
        },
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        const errorLog = {
          type: 'error',
          method,
          url,
          statusCode,
          duration,
          error: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
          correlationId,
          traceId,
          userId,
          timestamp: new Date().toISOString(),
        };

        if (this.structuredLogger) {
          this.structuredLogger.logWithMeta(
            'error',
            'Request failed',
            errorLog,
            correlationId,
            traceId,
          );
        } else {
          this.logger.error(
            `${method} ${url} ${statusCode} - ${duration}ms - Error: ${error.message} - Correlation ID: ${correlationId || 'none'}`,
            error.stack,
          );
        }

        throw error;
      }),
    );
  }
}
