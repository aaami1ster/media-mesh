import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EpisodeRepository } from '../repositories/episode.repository';
import { ProgramRepository } from '../../programs/repositories/program.repository';
import { Episode } from '../entities/episode.entity';
import { ContentStatus } from '@mediamesh/shared';
import { throwIfNotFound } from '@mediamesh/shared';

/**
 * Episode Service
 * 
 * Business logic layer for episode operations.
 * Handles validation and business rules.
 */
@Injectable()
export class EpisodeService {
  private readonly logger = new Logger(EpisodeService.name);

  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly programRepository: ProgramRepository,
  ) {}

  /**
   * Create a new episode
   */
  async create(data: {
    programId: string;
    title: string;
    description?: string;
    episodeNumber: number;
    duration?: number;
    status?: ContentStatus;
    metadataId?: string;
  }): Promise<Episode> {
    this.logger.log(`Creating new episode: ${data.title} for program ${data.programId}`);

    // Validate program exists
    const program = await this.programRepository.findById(data.programId);
    if (!program) {
      throw new NotFoundException(`Program with ID ${data.programId} not found`);
    }

    // Validate episode number is unique for this program
    const existingEpisodes = await this.episodeRepository.findByProgramId(data.programId, 0, 1000);
    const episodeNumberExists = existingEpisodes.some(
      (ep) => ep.episodeNumber === data.episodeNumber,
    );

    if (episodeNumberExists) {
      throw new ConflictException(
        `Episode number ${data.episodeNumber} already exists for program ${data.programId}`,
      );
    }

    // Validate duration if provided
    if (data.duration !== undefined && data.duration < 0) {
      throw new BadRequestException('Episode duration must be non-negative');
    }

    // Validate episode number
    if (data.episodeNumber < 1) {
      throw new BadRequestException('Episode number must be at least 1');
    }

    // Create episode
    const episode = await this.episodeRepository.create({
      programId: data.programId,
      title: data.title,
      description: data.description,
      episodeNumber: data.episodeNumber,
      duration: data.duration,
      status: data.status || ContentStatus.DRAFT,
      metadataId: data.metadataId,
    });

    this.logger.log(`Episode created: ${episode.id} (${episode.title})`);
    return episode;
  }

  /**
   * Find all episodes by program ID
   */
  async findAllByProgram(programId: string, skip: number = 0, take: number = 20): Promise<Episode[]> {
    // Validate program exists
    const program = await this.programRepository.findById(programId);
    if (!program) {
      throw new NotFoundException(`Program with ID ${programId} not found`);
    }

    return await this.episodeRepository.findByProgramId(programId, skip, take);
  }

  /**
   * Find all episodes with pagination
   */
  async findAll(skip: number = 0, take: number = 20): Promise<Episode[]> {
    return await this.episodeRepository.findAll(skip, take);
  }

  /**
   * Find episode by ID
   */
  async findOne(id: string): Promise<Episode> {
    const episode = await this.episodeRepository.findById(id);
    throwIfNotFound(episode, 'Episode', id);
    return episode!;
  }

  /**
   * Find episodes by status
   */
  async findByStatus(status: ContentStatus, skip: number = 0, take: number = 20): Promise<Episode[]> {
    return await this.episodeRepository.findByStatus(status, skip, take);
  }

  /**
   * Update episode
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      episodeNumber?: number;
      duration?: number;
      status?: ContentStatus;
      metadataId?: string;
    },
  ): Promise<Episode> {
    this.logger.log(`Updating episode: ${id}`);

    // Check if episode exists
    const existingEpisode = await this.findOne(id);

    // Validate episode number uniqueness if being changed
    if (data.episodeNumber !== undefined && data.episodeNumber !== existingEpisode.episodeNumber) {
      const existingEpisodes = await this.episodeRepository.findByProgramId(
        existingEpisode.programId,
        0,
        1000,
      );
      const episodeNumberExists = existingEpisodes.some(
        (ep) => ep.id !== id && ep.episodeNumber === data.episodeNumber,
      );

      if (episodeNumberExists) {
        throw new ConflictException(
          `Episode number ${data.episodeNumber} already exists for this program`,
        );
      }

      // Validate episode number
      if (data.episodeNumber < 1) {
        throw new BadRequestException('Episode number must be at least 1');
      }
    }

    // Validate duration if provided
    if (data.duration !== undefined && data.duration < 0) {
      throw new BadRequestException('Episode duration must be non-negative');
    }

    // Validate status transition
    if (data.status !== undefined) {
      this.validateStatusTransition(existingEpisode.status, data.status);
    }

    // Update episode
    const episode = await this.episodeRepository.update(id, {
      title: data.title,
      description: data.description,
      episodeNumber: data.episodeNumber,
      duration: data.duration,
      status: data.status,
      metadataId: data.metadataId,
    });

    this.logger.log(`Episode updated: ${id}`);
    return episode;
  }

  /**
   * Delete episode
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting episode: ${id}`);

    // Check if episode exists
    await this.findOne(id);

    // Delete episode
    await this.episodeRepository.delete(id);

    this.logger.log(`Episode deleted: ${id}`);
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: ContentStatus, newStatus: ContentStatus): void {
    // Allow same status
    if (currentStatus === newStatus) {
      return;
    }

    // Valid transitions: DRAFT <-> PUBLISHED
    const validTransitions = [
      { from: ContentStatus.DRAFT, to: ContentStatus.PUBLISHED },
      { from: ContentStatus.PUBLISHED, to: ContentStatus.DRAFT },
    ];

    const isValid = validTransitions.some(
      (transition) => transition.from === currentStatus && transition.to === newStatus,
    );

    if (!isValid) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Count episodes
   */
  async count(): Promise<number> {
    return await this.episodeRepository.count();
  }

  /**
   * Count episodes by program ID
   */
  async countByProgramId(programId: string): Promise<number> {
    // Validate program exists
    const program = await this.programRepository.findById(programId);
    if (!program) {
      throw new NotFoundException(`Program with ID ${programId} not found`);
    }

    return await this.episodeRepository.countByProgramId(programId);
  }
}
