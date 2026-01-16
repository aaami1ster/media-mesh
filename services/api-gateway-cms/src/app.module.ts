import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule, RedisToken } from '@nestjs-redis/client';
import { RedisThrottlerStorage } from '@nestjs-redis/throttler-storage';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { REDIS_CONFIG, RATE_LIMIT_CONFIG } from './config/env.constants';

@Module({
  imports: [
    // Redis client for throttler storage
    RedisModule.forRoot({
      isGlobal: true,
      options: {
        url: REDIS_CONFIG.PASSWORD
          ? `redis://:${REDIS_CONFIG.PASSWORD}@${REDIS_CONFIG.HOST}:${REDIS_CONFIG.PORT}/${REDIS_CONFIG.DB}`
          : `redis://${REDIS_CONFIG.HOST}:${REDIS_CONFIG.PORT}/${REDIS_CONFIG.DB}`,
      },
    }),
    // Rate limiting with Redis storage
    ThrottlerModule.forRootAsync({
      inject: [RedisToken()],
      useFactory: (redisClient) => {
        if (!redisClient) {
          throw new Error('Redis client is not available. Please ensure Redis is running and configured.');
        }
        return {
          throttlers: [
            {
              name: 'default',
              ttl: RATE_LIMIT_CONFIG.DEFAULT_TTL * 1000, // milliseconds (matching discovery gateway)
              limit: RATE_LIMIT_CONFIG.DEFAULT_LIMIT,
            },
          ],
          storage: new RedisThrottlerStorage(redisClient) as any, // Type assertion for compatibility
        };
      },
    }),
    AuthModule,
    ProxyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
