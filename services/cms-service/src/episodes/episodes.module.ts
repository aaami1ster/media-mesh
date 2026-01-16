import { Module } from '@nestjs/common';
import { EpisodeRepository } from './repositories/episode.repository';
import { EpisodeService } from './services/episode.service';
import { EpisodesController } from './controllers/episodes.controller';
import { ProgramsModule } from '../programs/programs.module';

/**
 * Episodes Module
 * 
 * Provides episode management functionality.
 */
@Module({
  imports: [ProgramsModule],
  controllers: [EpisodesController],
  providers: [EpisodeRepository, EpisodeService],
  exports: [EpisodeRepository, EpisodeService],
})
export class EpisodesModule {}
