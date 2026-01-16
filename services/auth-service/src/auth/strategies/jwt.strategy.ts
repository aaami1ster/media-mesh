import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';
import { JWT_CONFIG } from '../../config/env.constants';
import { RequestUser } from '@mediamesh/shared';

/**
 * JWT Strategy
 * 
 * Validates JWT tokens from Authorization header.
 * Used by JwtAuthGuard for protected routes.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_CONFIG.SECRET,
    });
  }

  /**
   * Validate JWT payload
   * This method is called after the token is verified
   */
  async validate(payload: any): Promise<RequestUser> {
    // Payload already contains user info from token
    // We can optionally verify user still exists in database
    // For performance, we'll trust the token if it's valid
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
    } as RequestUser;
  }
}
