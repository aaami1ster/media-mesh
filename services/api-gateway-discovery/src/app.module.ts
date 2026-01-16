import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyModule } from './proxy/proxy.module';
import { GraphqlModule } from './graphql/graphql.module';
import { REDIS_CONFIG, RATE_LIMIT_CONFIG, GRAPHQL_CONFIG } from './config/env.constants';
import { RedisModule, RedisToken } from '@nestjs-redis/client';
import { RedisThrottlerStorage } from '@nestjs-redis/throttler-storage';
import { ThrottlerIPGuard } from './throttler/throttler-ip.guard';

@Module({
  imports: [
    // Redis client for throttler storage
    RedisModule.forRoot({
      options: {
        url: REDIS_CONFIG.PASSWORD
          ? `redis://:${REDIS_CONFIG.PASSWORD}@${REDIS_CONFIG.HOST}:${REDIS_CONFIG.PORT}/${REDIS_CONFIG.DB}`
          : `redis://${REDIS_CONFIG.HOST}:${REDIS_CONFIG.PORT}/${REDIS_CONFIG.DB}`,
      },
    }),
    // Rate limiting with Redis storage
    ThrottlerModule.forRootAsync({
      inject: [RedisToken()],
      useFactory: (redisClient) => ({
        throttlers: [
          {
            name: 'default',
            ttl: RATE_LIMIT_CONFIG.DEFAULT_TTL * 1000, // milliseconds
            limit: RATE_LIMIT_CONFIG.DEFAULT_LIMIT,
          },
        ],
        storage: new RedisThrottlerStorage(redisClient) as any,
      }),
    }),
    // GraphQL setup with code-first approach
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), GRAPHQL_CONFIG.AUTO_SCHEMA_FILE),
      playground: GRAPHQL_CONFIG.PLAYGROUND,
      introspection: GRAPHQL_CONFIG.INTROSPECTION,
      context: ({ request }) => ({ req: request }),
      formatError: (error) => {
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },
    }),
    ProxyModule,
    GraphqlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ThrottlerIPGuard,
    // Note: ThrottlerIPGuard is applied at controller level
    // Global guard is kept for fallback
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
