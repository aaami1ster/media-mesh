import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWT_CONFIG } from '../config/env.constants';

/**
 * Auth Module
 * 
 * Provides authentication and authorization guards.
 * Uses shared guards from @mediamesh/shared.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_CONFIG.SECRET,
      signOptions: { expiresIn: JWT_CONFIG.EXPIRES_IN },
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
