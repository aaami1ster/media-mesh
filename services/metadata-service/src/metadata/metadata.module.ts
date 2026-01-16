import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MetadataController } from './controllers/metadata.controller';
import { MetadataService } from './services/metadata.service';
import { MetadataRepository } from './repositories/metadata.repository';
import { JWT_CONFIG } from '../config/env.constants';

/**
 * Metadata Module
 * 
 * Module for metadata management functionality.
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
  controllers: [MetadataController],
  providers: [MetadataService, MetadataRepository],
  exports: [MetadataService],
})
export class MetadataModule {}
