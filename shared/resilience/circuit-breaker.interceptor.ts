import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CircuitBreakerState } from './resilience.config';

/**
 * Circuit Breaker Interceptor
 * 
 * Implements circuit breaker pattern to prevent cascading failures.
 * 
 * Usage:
 * ```typescript
 * @UseInterceptors(CircuitBreakerInterceptor)
 * @Get('external-service')
 * callExternalService() {
 *   return this.httpService.get('...');
 * }
 * ```
 */
@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CircuitBreakerInterceptor.name);

  constructor(
    private circuitBreakerService: CircuitBreakerService,
    private serviceName?: string,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const serviceName = this.serviceName || this.extractServiceName(request);

    // Check if circuit allows execution
    if (!this.circuitBreakerService.canExecute(serviceName)) {
      const state = this.circuitBreakerService.getState(serviceName);
      this.logger.warn(
        `Circuit breaker OPEN for ${serviceName}, rejecting request`,
      );
      throw new ServiceUnavailableException(
        `Service ${serviceName} is temporarily unavailable (circuit breaker ${state})`,
      );
    }

    return next.handle().pipe(
      tap({
        next: () => {
          // Record success
          this.circuitBreakerService.recordSuccess(serviceName);
        },
      }),
      catchError((error) => {
        // Record failure
        this.circuitBreakerService.recordFailure(serviceName);
        const state = this.circuitBreakerService.getState(serviceName);

        if (state === CircuitBreakerState.OPEN) {
          this.logger.error(
            `Circuit breaker opened for ${serviceName} after failure: ${error.message}`,
          );
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * Extract service name from request
   */
  private extractServiceName(request: any): string {
    // Try to extract from URL or headers
    const url = request.url || '';
    const host = request.headers?.host || 'unknown';
    
    // Extract service name from URL pattern or use host
    const match = url.match(/\/api\/([^\/]+)/);
    return match ? match[1] : host;
  }
}
