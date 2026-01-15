import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../decorators';
import { RequestUser } from '../decorators/current-user.decorator';

/**
 * JWT Authentication Guard
 * 
 * Validates JWT tokens from Authorization header.
 * Skips authentication for routes marked with @Public() decorator.
 * 
 * Usage:
 * ```typescript
 * // In app.module.ts
 * APP_GUARD: JwtAuthGuard
 * 
 * // Or on specific controller/route
 * @UseGuards(JwtAuthGuard)
 * ```
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Attach user to request
      request.user = {
        id: payload.sub || payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      } as RequestUser;
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  /**
   * Extract JWT token from Authorization header
   */
  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
