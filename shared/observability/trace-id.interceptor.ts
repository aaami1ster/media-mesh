import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

/**
 * Trace ID Interceptor
 * 
 * Adds trace IDs to requests for distributed tracing.
 * Trace IDs are different from correlation IDs - they're per-request.
 * 
 * Usage:
 * ```typescript
 * @UseInterceptors(TraceIdInterceptor)
 * @Get('data')
 * getData() {
 *   return this.service.getData();
 * }
 * ```
 */
@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TraceIdInterceptor.name);
  private readonly traceIdHeader = 'x-trace-id';
  private readonly spanIdHeader = 'x-span-id';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();

    // Generate or extract trace ID
    const traceId =
      (request.headers[this.traceIdHeader] as string) || this.generateTraceId();
    const spanId = this.generateSpanId();

    // Attach to request
    (request as any).traceId = traceId;
    (request as any).spanId = spanId;

    // Add to response headers
    response.header(this.traceIdHeader, traceId);
    response.header(this.spanIdHeader, spanId);

    // Add to logger context (if using structured logger)
    const originalLogger = this.logger;
    this.logger.debug(`Trace ID: ${traceId}, Span ID: ${spanId}`);

    return next.handle().pipe(
      tap({
        next: () => {
          // Trace ID is already in response headers
        },
        error: (error) => {
          this.logger.error(
            `Request failed - Trace ID: ${traceId}, Span ID: ${spanId}`,
            error.stack,
          );
        },
      }),
    );
  }

  /**
   * Generate a new trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${uuidv4().substring(0, 8)}`;
  }

  /**
   * Generate a new span ID
   */
  private generateSpanId(): string {
    return `span-${uuidv4().substring(0, 8)}`;
  }
}
