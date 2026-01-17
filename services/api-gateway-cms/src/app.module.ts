import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { REDIS_CONFIG, RATE_LIMIT_CONFIG } from './config/env.constants';
import { ThrottlerDefaultGuard } from './throttler/throttler-default.guard';

@Module({
  imports: [
    // Rate limiting with Redis storage
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: RATE_LIMIT_CONFIG.DEFAULT_TTL * 1000, // milliseconds
          limit: RATE_LIMIT_CONFIG.DEFAULT_LIMIT,
        },
      ],
      storage: new ThrottlerStorageRedisService(
        new Redis({
          host: REDIS_CONFIG.HOST,
          port: REDIS_CONFIG.PORT,
          password: REDIS_CONFIG.PASSWORD || undefined,
          db: REDIS_CONFIG.DB,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        })
      ) as any,
    }),
    AuthModule,
    ProxyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerDefaultGuard,
    },
  ],
})
export class AppModule {}
