import { Injectable, Logger, HttpException } from '@nestjs/common';
import { RetryConfig, DEFAULT_RETRY_CONFIG } from './resilience.config';

/**
 * HTTP Retry Service
 * 
 * Utility service for retrying HTTP requests with exponential backoff.
 * Can be used with axios or fetch.
 */
@Injectable()
export class HttpRetryService {
  private readonly logger = new Logger(HttpRetryService.name);

  /**
   * Retry an async function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
  ): Promise<T> {
    let lastError: any;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;

        if (!this.isRetryable(error, attempt, config)) {
          this.logger.error(
            `Request failed with non-retryable error: ${error.message}`,
          );
          throw error;
        }

        if (attempt >= config.maxAttempts) {
          this.logger.error(
            `Request failed after ${attempt} attempts: ${error.message}`,
          );
          throw error;
        }

        const delay = this.calculateDelay(attempt, config);
        this.logger.warn(
          `Request failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms: ${error.message}`,
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(
    error: any,
    attempt: number,
    config: RetryConfig,
  ): boolean {
    if (attempt >= config.maxAttempts) {
      return false;
    }

    // Check HTTP status codes
    if (error instanceof HttpException) {
      const status = error.getStatus();
      return config.retryableStatusCodes.includes(status);
    }

    // Check response status
    if (error.response?.status) {
      return config.retryableStatusCodes.includes(error.response.status);
    }

    // Check error codes
    if (error.code && config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check error message
    if (error.message) {
      const message = error.message.toLowerCase();
      if (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('etimedout')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.multiplier, attempt - 1),
      config.maxDelay,
    );

    // Add jitter (random variation) to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay; // Up to 30% jitter
    return Math.floor(delay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
