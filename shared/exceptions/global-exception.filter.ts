import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ErrorResponse, BusinessException } from './exception-types';

/**
 * Global exception filter that catches all exceptions and formats them consistently
 * 
 * Features:
 * - Consistent error response format
 * - Logging of errors
 * - Correlation ID support
 * - Validation error formatting
 * - Security: hides internal error details in production
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Extract correlation ID from request headers or generate one
    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let status: number;
    let message: string | string[];
    let error: string;
    let details: any;

    if (exception instanceof BusinessException) {
      // Handle custom business exceptions
      status = exception.statusCode;
      message = exception.message;
      error = exception.code || 'BUSINESS_ERROR';
      details = exception.details;

      this.logger.warn(
        `Business Exception: ${message} [${error}] - Correlation ID: ${correlationId}`,
      );
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;

        // Handle validation errors
        if (Array.isArray(message)) {
          details = {
            validationErrors: message,
          };
        }
      } else {
        message = exception.message;
        error = exception.name;
      }

      // Log based on status code
      if (status >= 500) {
        this.logger.error(
          `HTTP Exception: ${message} [${status}] - Correlation ID: ${correlationId}`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `HTTP Exception: ${message} [${status}] - Correlation ID: ${correlationId}`,
        );
      }
    } else if (exception instanceof Error) {
      // Handle generic errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
      error = 'INTERNAL_SERVER_ERROR';
      details =
        process.env.NODE_ENV === 'production' ? undefined : { stack: exception.stack };

      this.logger.error(
        `Unhandled Error: ${exception.message} - Correlation ID: ${correlationId}`,
        exception.stack,
      );
    } else {
      // Handle unknown exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'UNKNOWN_ERROR';

      this.logger.error(
        `Unknown Exception - Correlation ID: ${correlationId}`,
        JSON.stringify(exception),
      );
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId: correlationId as string,
      ...(details && { details }),
    };

    // Send response
    response.code(status).send(errorResponse);
  }
}
