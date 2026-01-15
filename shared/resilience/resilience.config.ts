/**
 * Resilience configuration interfaces and defaults
 */

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  multiplier: number; // exponential backoff multiplier
  retryableStatusCodes: number[]; // HTTP status codes to retry
  retryableErrors: string[]; // Error types to retry
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  multiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
};

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time in ms before attempting to close (half-open state)
  resetTimeout: number; // Time in ms before resetting failure count
  monitoringPeriod: number; // Time window in ms for counting failures
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  resetTimeout: 300000, // 5 minutes
  monitoringPeriod: 60000, // 1 minute
};

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  timeout: number; // milliseconds
  timeoutMessage?: string;
}

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  timeout: 30000, // 30 seconds
  timeoutMessage: 'Request timeout',
};

/**
 * Circuit breaker state
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}
