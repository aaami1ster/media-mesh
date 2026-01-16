import { Module } from '@nestjs/common';
import { MetadataController } from './controllers/metadata.controller';
import { MetadataService } from './services/metadata.service';
import { MetadataRepository } from './repositories/metadata.repository';

/**
 * Metadata Module
 * 
 * Module for metadata management functionality.
 */
@Module({
  imports: [],
  controllers: [MetadataController],
  providers: [MetadataService, MetadataRepository],
  exports: [MetadataService],
})
export class MetadataModule {}
