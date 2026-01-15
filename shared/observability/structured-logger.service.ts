import { Injectable, LoggerService, Logger } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Structured Logger Service
 * 
 * Provides JSON-structured logging with correlation IDs, trace IDs, and metadata.
 * Uses Winston for structured logging.
 * 
 * Usage:
 * ```typescript
 * constructor(private logger: StructuredLoggerService) {}
 * 
 * this.logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * ```
 */
@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly logger: winston.Logger;
  private context?: string;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'unknown',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        new winston.transports.Console({
          format: process.env.NODE_ENV === 'production'
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
              ),
        }),
      ],
    });
  }

  /**
   * Set context for logging
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log with correlation and trace IDs
   */
  private logWithContext(
    level: string,
    message: string,
    meta?: any,
    correlationId?: string,
    traceId?: string,
  ): void {
    const logData: any = {
      message,
      context: this.context,
      ...(correlationId && { correlationId }),
      ...(traceId && { traceId }),
      ...(meta && { meta }),
    };

    this.logger.log(level, logData);
  }

  /**
   * Log info message
   */
  log(message: string, context?: string, correlationId?: string, traceId?: string): void {
    this.logWithContext('info', message, { context }, correlationId, traceId);
  }

  /**
   * Log error message
   */
  error(
    message: string,
    trace?: string,
    context?: string,
    correlationId?: string,
    traceId?: string,
  ): void {
    this.logWithContext(
      'error',
      message,
      { context, trace },
      correlationId,
      traceId,
    );
  }

  /**
   * Log warning message
   */
  warn(
    message: string,
    context?: string,
    correlationId?: string,
    traceId?: string,
  ): void {
    this.logWithContext('warn', message, { context }, correlationId, traceId);
  }

  /**
   * Log debug message
   */
  debug(
    message: string,
    context?: string,
    correlationId?: string,
    traceId?: string,
  ): void {
    this.logWithContext('debug', message, { context }, correlationId, traceId);
  }

  /**
   * Log verbose message
   */
  verbose(
    message: string,
    context?: string,
    correlationId?: string,
    traceId?: string,
  ): void {
    this.logWithContext('verbose', message, { context }, correlationId, traceId);
  }

  /**
   * Log with custom metadata
   */
  logWithMeta(
    level: 'info' | 'warn' | 'error' | 'debug' | 'verbose',
    message: string,
    meta: Record<string, any>,
    correlationId?: string,
    traceId?: string,
  ): void {
    this.logWithContext(level, message, meta, correlationId, traceId);
  }

  /**
   * Create child logger with additional context
   */
  child(meta: Record<string, any>): winston.Logger {
    return this.logger.child(meta);
  }
}
