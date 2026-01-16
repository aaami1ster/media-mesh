import { Module } from '@nestjs/common';
import { IngestController } from './controllers/ingest.controller';
import { IngestService } from './services/ingest.service';
import { IngestProcessor } from './services/ingest.processor';
import { IngestRepository } from './repositories/ingest.repository';
import { YouTubeParser } from './parsers/youtube.parser';
import { RSSParser } from './parsers/rss.parser';
import { APIParser } from './parsers/api.parser';

/**
 * Ingest Module
 * 
 * Module for content ingestion functionality.
 */
@Module({
  imports: [],
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
