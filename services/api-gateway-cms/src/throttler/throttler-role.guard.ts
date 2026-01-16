import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_CONFIG } from '../config/env.constants';
import { UserRole } from '@mediamesh/shared';

/**
 * Role-based Throttler Guard
 * 
 * Applies different rate limits based on user role.
 */
@Injectable()
export class ThrottlerRoleGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID for rate limiting if available
    const userId = req.user?.id || req.ip;
    return userId;
  }

  protected async getLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Apply role-based limits
    if (user?.role === UserRole.ADMIN) {
      return RATE_LIMIT_CONFIG.ADMIN_LIMIT;
    } else if (user?.role === UserRole.EDITOR) {
      return RATE_LIMIT_CONFIG.EDITOR_LIMIT;
    }

    return RATE_LIMIT_CONFIG.DEFAULT_LIMIT;
  }

  protected async getTtl(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Apply role-based TTL
    if (user?.role === UserRole.ADMIN) {
      return RATE_LIMIT_CONFIG.ADMIN_TTL * 1000; // milliseconds
    } else if (user?.role === UserRole.EDITOR) {
      return RATE_LIMIT_CONFIG.EDITOR_TTL * 1000;
    }

    return RATE_LIMIT_CONFIG.DEFAULT_TTL * 1000;
  }
}
