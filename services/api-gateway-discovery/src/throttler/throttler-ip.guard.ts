import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_CONFIG } from '../config/env.constants';

/**
 * IP-based Throttler Guard
 * 
 * Applies rate limiting based on IP address for public endpoints.
 * Falls back to user ID if authenticated.
 */
@Injectable()
export class ThrottlerIPGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated, otherwise use IP address
    const userId = req.user?.id;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  protected async getLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Authenticated users get higher limits
    if (user?.id) {
      return RATE_LIMIT_CONFIG.AUTHENTICATED_LIMIT;
    }

    // Public (IP-based) get standard limits
    return RATE_LIMIT_CONFIG.DEFAULT_LIMIT;
  }

  protected async getTtl(context: ExecutionContext): Promise<number> {
    return RATE_LIMIT_CONFIG.DEFAULT_TTL * 1000; // milliseconds
  }
}
