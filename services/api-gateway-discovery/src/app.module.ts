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
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import { ThrottlerIPGuard } from './throttler/throttler-ip.guard';
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
    // GraphQL setup with code-first approach
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), GRAPHQL_CONFIG.AUTO_SCHEMA_FILE),
      playground: GRAPHQL_CONFIG.PLAYGROUND,
      // autoSchemaFile: join(process.cwd(), 'schema.gql'),
      // playground: false, // Apollo v4 uses Explorer by default
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
      useClass: ThrottlerDefaultGuard,
    },
  ],
})
export class AppModule {}
