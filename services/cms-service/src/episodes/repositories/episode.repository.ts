import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Episode } from '../entities/episode.entity';
import { ContentStatus } from '@mediamesh/shared';

/**
 * Episode Repository
 * 
 * Data access layer for Episode entities.
 */
@Injectable()
export class EpisodeRepository {
  private readonly logger = new Logger(EpisodeRepository.name);

  constructor(private readonly prisma: PrismaService) {}

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
    const prismaEpisode = await this.prisma.episode.create({
      data: {
        programId: data.programId,
        title: data.title,
        description: data.description,
        episodeNumber: data.episodeNumber,
        duration: data.duration,
        status: data.status || ContentStatus.DRAFT,
        metadataId: data.metadataId,
      },
    });

    return Episode.fromPrisma(prismaEpisode);
  }

  /**
   * Find episode by ID
   */
  async findById(id: string): Promise<Episode | null> {
    const prismaEpisode = await this.prisma.episode.findUnique({
      where: { id },
    });

    return prismaEpisode ? Episode.fromPrisma(prismaEpisode) : null;
  }

  /**
   * Find episodes by program ID
   */
  async findByProgramId(programId: string, skip: number = 0, take: number = 20): Promise<Episode[]> {
    const prismaEpisodes = await this.prisma.episode.findMany({
      where: { programId },
      skip,
      take,
      orderBy: { episodeNumber: 'asc' },
    });

    return prismaEpisodes.map(Episode.fromPrisma);
  }

  /**
   * Find all episodes with pagination
   */
  async findAll(skip: number = 0, take: number = 20): Promise<Episode[]> {
    const prismaEpisodes = await this.prisma.episode.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return prismaEpisodes.map(Episode.fromPrisma);
  }

  /**
   * Find episodes by status
   */
  async findByStatus(status: ContentStatus, skip: number = 0, take: number = 20): Promise<Episode[]> {
    const prismaEpisodes = await this.prisma.episode.findMany({
      where: { status },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return prismaEpisodes.map(Episode.fromPrisma);
  }

  /**
   * Update episode
   */
  async update(id: string, data: {
    title?: string;
    description?: string;
    episodeNumber?: number;
    duration?: number;
    status?: ContentStatus;
    metadataId?: string;
  }): Promise<Episode> {
    const prismaEpisode = await this.prisma.episode.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.episodeNumber !== undefined && { episodeNumber: data.episodeNumber }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.metadataId !== undefined && { metadataId: data.metadataId }),
      },
    });

    return Episode.fromPrisma(prismaEpisode);
  }

  /**
   * Delete episode
   */
  async delete(id: string): Promise<void> {
    await this.prisma.episode.delete({
      where: { id },
    });
  }

  /**
   * Count episodes
   */
  async count(): Promise<number> {
    return await this.prisma.episode.count();
  }

  /**
   * Count episodes by program ID
   */
  async countByProgramId(programId: string): Promise<number> {
    return await this.prisma.episode.count({
      where: { programId },
    });
  }
}
