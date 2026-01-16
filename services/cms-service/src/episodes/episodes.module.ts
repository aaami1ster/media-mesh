import { Module } from '@nestjs/common';
import { EpisodeRepository } from './repositories/episode.repository';
import { EpisodeService } from './services/episode.service';
import { ProgramsModule } from '../programs/programs.module';

/**
 * Episodes Module
 * 
 * Provides episode management functionality.
 */
@Module({
  imports: [ProgramsModule],
  providers: [EpisodeRepository, EpisodeService],
  exports: [EpisodeRepository, EpisodeService],
})
export class EpisodesModule {}
