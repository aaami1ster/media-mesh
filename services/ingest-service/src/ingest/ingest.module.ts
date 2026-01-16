import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IngestController } from './controllers/ingest.controller';
import { IngestService } from './services/ingest.service';
import { IngestProcessor } from './services/ingest.processor';
import { IngestRepository } from './repositories/ingest.repository';
import { YouTubeParser } from './parsers/youtube.parser';
import { RSSParser } from './parsers/rss.parser';
import { APIParser } from './parsers/api.parser';
import { JWT_CONFIG } from '../config/env.constants';

/**
 * Ingest Module
 * 
 * Module for content ingestion functionality.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_CONFIG.SECRET,
      signOptions: {
        expiresIn: JWT_CONFIG.EXPIRATION_STRING,
      },
    }),
  ],
  controllers: [IngestController],
  providers: [
    IngestService,
    IngestProcessor,
    IngestRepository,
    YouTubeParser,
    RSSParser,
    APIParser,
  ],
  exports: [IngestService],
})
export class IngestModule {}
