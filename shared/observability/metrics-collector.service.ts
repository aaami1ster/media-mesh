import { Injectable, Logger } from '@nestjs/common';

/**
 * Metric types
 */
export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  requestsByStatus: Record<number, number>;
  requestsByMethod: Record<string, number>;
}

/**
 * Metrics Collector Service
 * 
 * Collects basic metrics for observability:
 * - Request count
 * - Latency (average, min, max)
 * - Error count
 * - Status code distribution
 * 
 * Usage:
 * ```typescript
 * constructor(private metrics: MetricsCollectorService) {}
 * 
 * this.metrics.recordRequest('GET', '/api/users', 200, 150);
 * ```
 */
@Injectable()
export class MetricsCollectorService {
  private readonly logger = new Logger(MetricsCollectorService.name);
  private metrics: Map<string, RequestMetrics> = new Map();
  private latencies: Map<string, number[]> = new Map();

  /**
   * Record a request metric
   */
  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    tags?: Record<string, string>,
  ): void {
    const key = this.getKey(method, path);
    const metrics = this.getOrCreateMetrics(key);

    // Update counters
    metrics.totalRequests++;
    if (statusCode >= 200 && statusCode < 400) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update status code distribution
    metrics.requestsByStatus[statusCode] = (metrics.requestsByStatus[statusCode] || 0) + 1;

    // Update method distribution
    metrics.requestsByMethod[method] = (metrics.requestsByMethod[method] || 0) + 1;

    // Update latency
    if (!this.latencies.has(key)) {
      this.latencies.set(key, []);
    }
    const latencies = this.latencies.get(key)!;
    latencies.push(duration);

    // Keep only last 1000 latencies for memory efficiency
    if (latencies.length > 1000) {
      latencies.shift();
    }

    // Update latency stats
    this.updateLatencyStats(key, metrics);
  }

  /**
   * Record an error
   */
  recordError(
    method: string,
    path: string,
    error: Error,
    tags?: Record<string, string>,
  ): void {
    const key = this.getKey(method, path);
    const metrics = this.getOrCreateMetrics(key);
    metrics.failedRequests++;

    this.logger.warn(`Error recorded for ${key}: ${error.message}`, {
      method,
      path,
      error: error.message,
      tags,
    });
  }

  /**
   * Get metrics for a specific endpoint
   */
  getMetrics(method: string, path: string): RequestMetrics | undefined {
    const key = this.getKey(method, path);
    return this.metrics.get(key);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, RequestMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get aggregated metrics across all endpoints
   */
  getAggregatedMetrics(): RequestMetrics {
    const aggregated: RequestMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      requestsByStatus: {},
      requestsByMethod: {},
    };

    let totalLatency = 0;
    let latencyCount = 0;

    for (const metrics of this.metrics.values()) {
      aggregated.totalRequests += metrics.totalRequests;
      aggregated.successfulRequests += metrics.successfulRequests;
      aggregated.failedRequests += metrics.failedRequests;

      // Aggregate status codes
      for (const [status, count] of Object.entries(metrics.requestsByStatus)) {
        aggregated.requestsByStatus[parseInt(status)] =
          (aggregated.requestsByStatus[parseInt(status)] || 0) + count;
      }

      // Aggregate methods
      for (const [method, count] of Object.entries(metrics.requestsByMethod)) {
        aggregated.requestsByMethod[method] =
          (aggregated.requestsByMethod[method] || 0) + count;
      }

      // Aggregate latency
      if (metrics.averageLatency > 0) {
        totalLatency += metrics.averageLatency;
        latencyCount++;
      }

      if (metrics.minLatency < aggregated.minLatency) {
        aggregated.minLatency = metrics.minLatency;
      }
      if (metrics.maxLatency > aggregated.maxLatency) {
        aggregated.maxLatency = metrics.maxLatency;
      }
    }

    if (latencyCount > 0) {
      aggregated.averageLatency = totalLatency / latencyCount;
    }

    if (aggregated.minLatency === Infinity) {
      aggregated.minLatency = 0;
    }

    return aggregated;
  }

  /**
   * Reset metrics for an endpoint
   */
  resetMetrics(method: string, path: string): void {
    const key = this.getKey(method, path);
    this.metrics.delete(key);
    this.latencies.delete(key);
  }

  /**
   * Reset all metrics
   */
  resetAllMetrics(): void {
    this.metrics.clear();
    this.latencies.clear();
  }

  /**
   * Get or create metrics for a key
   */
  private getOrCreateMetrics(key: string): RequestMetrics {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        requestsByStatus: {},
        requestsByMethod: {},
      });
    }
    return this.metrics.get(key)!;
  }

  /**
   * Update latency statistics
   */
  private updateLatencyStats(key: string, metrics: RequestMetrics): void {
    const latencies = this.latencies.get(key);
    if (!latencies || latencies.length === 0) {
      return;
    }

    const sum = latencies.reduce((a, b) => a + b, 0);
    metrics.averageLatency = sum / latencies.length;
    metrics.minLatency = Math.min(...latencies);
    metrics.maxLatency = Math.max(...latencies);
  }

  /**
   * Generate key from method and path
   */
  private getKey(method: string, path: string): string {
    // Normalize path (remove IDs, etc.)
    const normalizedPath = path.replace(/\/[^\/]+\/[\w-]+/g, '/:id');
    return `${method}:${normalizedPath}`;
  }
}
