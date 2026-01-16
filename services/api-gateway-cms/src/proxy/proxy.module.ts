import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { CmsController } from './controllers/cms.controller';
import { MetadataController } from './controllers/metadata.controller';
import { MediaController } from './controllers/media.controller';
import { IngestController } from './controllers/ingest.controller';
import {
  CircuitBreakerService,
  HttpRetryService,
} from '@mediamesh/shared';
import { RESILIENCE_CONFIG } from '../config/env.constants';
import { AuthModule } from '../auth/auth.module';

/**
 * Proxy Module
 * 
 * Provides HTTP client for proxying requests to microservices.
 * Includes resilience patterns: retry, circuit breaker, timeout.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: RESILIENCE_CONFIG.REQUEST_TIMEOUT,
      maxRedirects: 5,
    }),
    AuthModule, // Import AuthModule to access JwtService for JwtAuthGuard
  ],
  controllers: [
    CmsController,
    MetadataController,
    MediaController,
    IngestController,
  ],
  providers: [
    ProxyService,
    CircuitBreakerService,
    HttpRetryService,
  ],
  exports: [ProxyService],
})
export class ProxyModule {}
