import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';
import { MediaRepository } from './repositories/media.repository';
import { StorageService } from './services/storage.service';
import { JWT_CONFIG } from '../config/env.constants';

/**
 * Media Module
 * 
 * Module for media management functionality.
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
  controllers: [MediaController],
  providers: [MediaService, MediaRepository, StorageService],
  exports: [MediaService],
})
export class MediaModule {}
