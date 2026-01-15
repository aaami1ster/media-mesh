import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID Middleware
 * 
 * Generates or propagates correlation IDs across requests.
 * Adds correlation ID to request headers and response headers.
 * 
 * Usage:
 * ```typescript
 * // In app.module.ts
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(CorrelationIdMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);
  private readonly correlationIdHeader = 'x-correlation-id';
  private readonly requestIdHeader = 'x-request-id';

  use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
    // Extract or generate correlation ID
    const correlationId =
      (req.headers[this.correlationIdHeader] as string) ||
      (req.headers[this.requestIdHeader] as string) ||
      this.generateCorrelationId();

    // Attach to request for use in controllers/services
    (req as any).correlationId = correlationId;

    // Add to response headers
    res.header(this.correlationIdHeader, correlationId);

    // Log correlation ID (optional)
    this.logger.debug(`Correlation ID: ${correlationId} for ${req.method} ${req.url}`);

    next();
  }

  /**
   * Generate a new correlation ID
   */
  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${uuidv4().substring(0, 8)}`;
  }
}
