import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { DiscoveryController } from './controllers/discovery.controller';
import { SearchController } from './controllers/search.controller';
import {
  CircuitBreakerService,
  HttpRetryService,
} from '@mediamesh/shared';

/**
 * Proxy Module
 * 
 * Provides HTTP client for proxying requests to microservices.
 * Includes resilience patterns: retry, circuit breaker, timeout.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [DiscoveryController, SearchController],
  providers: [
    ProxyService,
    CircuitBreakerService,
    HttpRetryService,
  ],
  exports: [ProxyService],
})
export class ProxyModule {}
