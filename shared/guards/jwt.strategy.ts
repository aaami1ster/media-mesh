import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestUser } from '../decorators/current-user.decorator';

/**
 * JWT Strategy
 * 
 * This strategy validates JWT payload and returns user object.
 * Used by JwtAuthGuard after token verification.
 * 
 * Note: For full Passport integration, install @nestjs/passport and passport-jwt,
 * then extend PassportStrategy(Strategy) instead.
 */
@Injectable()
export class JwtStrategy {
  /**
   * Validate JWT payload and return user object
   * This method is called by JwtAuthGuard after token verification
   */
  async validate(payload: any): Promise<RequestUser> {
    if (!payload.sub && !payload.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub || payload.userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    } as RequestUser;
  }
}
