import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { TimeoutConfig, DEFAULT_TIMEOUT_CONFIG } from './resilience.config';

/**
 * Timeout Interceptor
 * 
 * Adds timeout to requests to prevent hanging requests.
 * 
 * Usage:
 * ```typescript
 * @UseInterceptors(TimeoutInterceptor)
 * @Get('slow-endpoint')
 * slowEndpoint() {
 *   return this.slowService.getData();
 * }
 * 
 * // With custom timeout
 * @UseInterceptors(new TimeoutInterceptor({ timeout: 60000 }))
 * ```
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);

  constructor(private config: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const url = request.url || 'unknown';

    return next.handle().pipe(
      timeout(this.config.timeout),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          this.logger.warn(
            `Request to ${url} timed out after ${this.config.timeout}ms`,
          );
          return throwError(
            () =>
              new RequestTimeoutException(
                this.config.timeoutMessage ||
                  `Request timeout after ${this.config.timeout}ms`,
              ),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
