import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EpisodeRepository } from './repositories/episode.repository';
import { EpisodeService } from './services/episode.service';
import { EpisodesController } from './controllers/episodes.controller';
import { ProgramsModule } from '../programs/programs.module';
import { JWT_CONFIG } from '../config/env.constants';

/**
 * Episodes Module
 * 
 * Provides episode management functionality.
 */
@Module({
  imports: [
    ProgramsModule,
    JwtModule.register({
      secret: JWT_CONFIG.SECRET,
      signOptions: {
        expiresIn: JWT_CONFIG.EXPIRATION_STRING,
      },
    }),
  ],
  controllers: [EpisodesController],
  providers: [EpisodeRepository, EpisodeService],
  exports: [EpisodeRepository, EpisodeService],
})
export class EpisodesModule {}
