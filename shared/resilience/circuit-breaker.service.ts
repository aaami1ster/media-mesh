import { Injectable, Logger } from '@nestjs/common';
import {
  CircuitBreakerConfig,
  CircuitBreakerState,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from './resilience.config';

/**
 * Circuit breaker service
 * Tracks failures and manages circuit state
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitState> = new Map();

  /**
   * Get or create circuit state for a service
   */
  getCircuitState(serviceName: string): CircuitState {
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, new CircuitState(serviceName, DEFAULT_CIRCUIT_BREAKER_CONFIG));
    }
    return this.circuits.get(serviceName)!;
  }

  /**
   * Record a success
   */
  recordSuccess(serviceName: string): void {
    const state = this.getCircuitState(serviceName);
    state.recordSuccess();
  }

  /**
   * Record a failure
   */
  recordFailure(serviceName: string): void {
    const state = this.getCircuitState(serviceName);
    state.recordFailure();
  }

  /**
   * Check if circuit allows request
   */
  canExecute(serviceName: string): boolean {
    const state = this.getCircuitState(serviceName);
    return state.canExecute();
  }

  /**
   * Get current state
   */
  getState(serviceName: string): CircuitBreakerState {
    const state = this.getCircuitState(serviceName);
    return state.getState();
  }
}

/**
 * Circuit state for a single service
 */
class CircuitState {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private failureTimestamps: number[] = [];

  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig,
  ) {}

  recordSuccess(): void {
    this.failureTimestamps = this.failureTimestamps.filter(
      (timestamp) => Date.now() - timestamp < this.config.monitoringPeriod,
    );

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failures = 0;
        this.successes = 0;
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureTimestamps.push(now);

    // Remove old failures outside monitoring period
    this.failureTimestamps = this.failureTimestamps.filter(
      (timestamp) => now - timestamp < this.config.monitoringPeriod,
    );

    // Count failures in monitoring period
    this.failures = this.failureTimestamps.length;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // If we fail in half-open, go back to open
      this.state = CircuitBreakerState.OPEN;
      this.successes = 0;
    } else if (this.state === CircuitBreakerState.CLOSED && this.failures >= this.config.failureThreshold) {
      // Too many failures, open the circuit
      this.state = CircuitBreakerState.OPEN;
    }
  }

  canExecute(): boolean {
    const now = Date.now();

    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === CircuitBreakerState.OPEN) {
      if (now - this.lastFailureTime >= this.config.timeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successes = 0;
        return true; // Allow one request to test
      }
      return false; // Circuit is open, reject requests
    }

    // CLOSED or HALF_OPEN states allow execution
    return true;
  }

  getState(): CircuitBreakerState {
    // Auto-transition from OPEN to HALF_OPEN if timeout passed
    if (this.state === CircuitBreakerState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.timeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successes = 0;
      }
    }

    return this.state;
  }
}
