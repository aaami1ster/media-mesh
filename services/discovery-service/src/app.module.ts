import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { REDIS_CONFIG } from './config/env.constants';
import { DiscoveryModule } from './discovery/discovery.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: REDIS_CONFIG.HOST,
            port: REDIS_CONFIG.PORT,
          },
          password: REDIS_CONFIG.PASSWORD,
          database: REDIS_CONFIG.DB,
        });
        return {
          store: () => store,
          ttl: REDIS_CONFIG.TTL.PROGRAMS * 1000,
        };
      },
    }),
    DiscoveryModule,
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
