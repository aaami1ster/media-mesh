import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { SERVICE_CONFIG, RESILIENCE_CONFIG } from '../config/env.constants';
import { HttpRetryService } from '@mediamesh/shared';
import { CircuitBreakerService } from '@mediamesh/shared';
import { RetryConfig } from '@mediamesh/shared';

/**
 * Proxy Service
 * 
 * Handles HTTP requests to backend microservices with resilience patterns:
 * - Retry with exponential backoff
 * - Circuit breaker for service protection
 * - Timeout configuration
 * - Graceful error handling
 */
@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly retryConfig: RetryConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly httpRetryService: HttpRetryService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {
    // Configure retry with exponential backoff
    this.retryConfig = {
      maxAttempts: RESILIENCE_CONFIG.RETRY_MAX_ATTEMPTS,
      initialDelay: RESILIENCE_CONFIG.RETRY_INITIAL_DELAY,
      maxDelay: RESILIENCE_CONFIG.RETRY_MAX_DELAY,
      multiplier: RESILIENCE_CONFIG.RETRY_MULTIPLIER,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
    };
  }

  /**
   * Proxy request to CMS service
   */
  async proxyToCms(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(
      SERVICE_CONFIG.CMS_SERVICE,
      'cms-service',
      method,
      path,
      data,
      headers,
    );
  }

  /**
   * Proxy request to Metadata service
   */
  async proxyToMetadata(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(
      SERVICE_CONFIG.METADATA_SERVICE,
      'metadata-service',
      method,
      path,
      data,
      headers,
    );
  }

  /**
   * Proxy request to Media service
   */
  async proxyToMedia(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(
      SERVICE_CONFIG.MEDIA_SERVICE,
      'media-service',
      method,
      path,
      data,
      headers,
    );
  }

  /**
   * Proxy request to Ingest service
   */
  async proxyToIngest(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(
      SERVICE_CONFIG.INGEST_SERVICE,
      'ingest-service',
      method,
      path,
      data,
      headers,
    );
  }

  /**
   * Generic proxy request method with resilience patterns
   */
  private async proxyRequest(
    baseUrl: string,
    serviceName: string,
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const url = `${baseUrl}${path}`;

    // Check circuit breaker before making request
    if (!this.circuitBreakerService.canExecute(serviceName)) {
      const state = this.circuitBreakerService.getState(serviceName);
      this.logger.warn(
        `Circuit breaker ${state} for ${serviceName}, rejecting request to ${url}`,
      );
      throw new HttpException(
        `Service ${serviceName} is temporarily unavailable (circuit breaker ${state})`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const config: AxiosRequestConfig = {
      method: method.toUpperCase() as any,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(data && { data }),
      timeout: RESILIENCE_CONFIG.REQUEST_TIMEOUT,
      validateStatus: () => true, // Don't throw on any status
    };

    try {
      this.logger.debug(`Proxying ${method.toUpperCase()} ${url} to ${serviceName}`);

      // Use retry service with exponential backoff
      const response: AxiosResponse = await this.httpRetryService.retry(
        async () => {
          return await firstValueFrom(this.httpService.request(config));
        },
        this.retryConfig,
      );

      // Record success in circuit breaker
      this.circuitBreakerService.recordSuccess(serviceName);

      // Forward the status code and response
      if (response.status >= 400) {
        // Record failure for 4xx/5xx errors
        this.circuitBreakerService.recordFailure(serviceName);
        throw new HttpException(
          response.data || 'Service error',
          response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      // Record failure in circuit breaker
      this.circuitBreakerService.recordFailure(serviceName);

      this.logger.error(
        `Proxy error for ${method.toUpperCase()} ${url} (${serviceName}):`,
        error,
      );

      // Handle specific error types gracefully
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle connection errors
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND'
      ) {
        throw new HttpException(
          {
            message: `Service ${serviceName} is unavailable`,
            service: serviceName,
            error: 'Service unavailable',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new HttpException(
          {
            message: `Request to ${serviceName} timed out`,
            service: serviceName,
            error: 'Request timeout',
          },
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      // Generic error handling
      throw new HttpException(
        {
          message: error.response?.data?.message || 'Internal server error',
          service: serviceName,
          error: error.response?.data || 'Service error',
        },
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
