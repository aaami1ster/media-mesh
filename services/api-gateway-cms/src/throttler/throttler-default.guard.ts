import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

/**
 * Default Throttler Guard with safe tracker handling
 * 
 * Extends ThrottlerGuard to ensure getTracker always returns a valid string.
 * This prevents errors when IP address or user ID is undefined.
 */
@Injectable()
export class ThrottlerDefaultGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated
    const userId = req.user?.id;
    
    // Try multiple sources for IP address
    const ip = 
      req.ip || 
      req.connection?.remoteAddress || 
      req.socket?.remoteAddress ||
      req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers?.['x-real-ip'] ||
      'unknown';
    
    // Always return a string - prefix with user: or ip: for clarity
    const tracker = userId ? `user:${userId}` : `ip:${ip}`;
    
    // Ensure we never return undefined or null
    return tracker || 'unknown';
  }
}
