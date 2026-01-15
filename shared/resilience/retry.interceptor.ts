import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError, timer } from 'rxjs';
import { retry, retryWhen, mergeMap, take, finalize } from 'rxjs/operators';
import { RetryConfig, DEFAULT_RETRY_CONFIG } from './resilience.config';

/**
 * Retry Interceptor
 * 
 * Retries failed requests with exponential backoff.
 * 
 * Usage:
 * ```typescript
 * @UseInterceptors(RetryInterceptor)
 * @Get('data')
 * getData() {
 *   return this.httpService.get('...');
 * }
 * 
 * // With custom config
 * @UseInterceptors(new RetryInterceptor({ maxAttempts: 5 }))
 * ```
 */
@Injectable()
export class RetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RetryInterceptor.name);

  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const url = request.url || 'unknown';

    return next.handle().pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const attempt = index + 1;

            // Check if error is retryable
            if (!this.isRetryable(error, attempt)) {
              this.logger.error(
                `Request to ${url} failed with non-retryable error: ${error.message}`,
              );
              return throwError(() => error);
            }

            // Calculate delay with exponential backoff
            const delay = this.calculateDelay(attempt);

            if (attempt >= this.config.maxAttempts) {
              this.logger.error(
                `Request to ${url} failed after ${attempt} attempts: ${error.message}`,
              );
              return throwError(() => error);
            }

            this.logger.warn(
              `Request to ${url} failed (attempt ${attempt}/${this.config.maxAttempts}), retrying in ${delay}ms: ${error.message}`,
            );

            return timer(delay);
          }),
          take(this.config.maxAttempts),
        ),
      ),
      finalize(() => {
        // Optional: log final state
      }),
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: any, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Check HTTP status codes
    if (error instanceof HttpException) {
      const status = error.getStatus();
      return this.config.retryableStatusCodes.includes(status);
    }

    // Check error codes
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check error message
    if (error.message) {
      const message = error.message.toLowerCase();
      if (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('connection')
      ) {
        return true;
      }
    }

    // Default: don't retry
    return false;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.multiplier, attempt - 1),
      this.config.maxDelay,
    );

    // Add jitter (random variation) to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay; // Up to 30% jitter
    return Math.floor(delay + jitter);
  }
}
