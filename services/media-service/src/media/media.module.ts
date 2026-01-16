import { Module } from '@nestjs/common';
import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';
import { MediaRepository } from './repositories/media.repository';
import { StorageService } from './services/storage.service';

/**
 * Media Module
 * 
 * Module for media management functionality.
 */
@Module({
  imports: [],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository, StorageService],
  exports: [MediaService],
})
export class MediaModule {}
