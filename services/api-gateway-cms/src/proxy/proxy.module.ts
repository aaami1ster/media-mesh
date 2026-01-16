import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { CmsController } from './controllers/cms.controller';
import { MetadataController } from './controllers/metadata.controller';
import { MediaController } from './controllers/media.controller';
import { IngestController } from './controllers/ingest.controller';

/**
 * Proxy Module
 * 
 * Provides HTTP client for proxying requests to microservices.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    CmsController,
    MetadataController,
    MediaController,
    IngestController,
  ],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
