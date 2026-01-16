import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentStatus, ContentType } from '@mediamesh/shared';

/**
 * Discovery Repository
 * 
 * Data access layer for discovery operations.
 * Reads from read-only database replica.
 */
@Injectable()
export class DiscoveryRepository {
  private readonly logger = new Logger(DiscoveryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search programs and episodes
   */
  async search(
    query: string,
    contentType?: ContentType,
    skip: number = 0,
    take: number = 20,
  ): Promise<{ programs: any[]; episodes: any[]; total: number }> {
    const searchTerm = `%${query}%`;

    const wherePrograms: any = {
      OR: [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ],
      status: ContentStatus.PUBLISHED,
    };

    const whereEpisodes: any = {
      OR: [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ],
      status: ContentStatus.PUBLISHED,
    };

    const [programs, episodes, programCount, episodeCount] = await Promise.all([
      this.prisma.program.findMany({
        where: wherePrograms,
        skip,
        take: Math.ceil(take / 2),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.episode.findMany({
        where: whereEpisodes,
        skip,
        take: Math.ceil(take / 2),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.program.count({ where: wherePrograms }),
      this.prisma.episode.count({ where: whereEpisodes }),
    ]);

    return {
      programs,
      episodes,
      total: programCount + episodeCount,
    };
  }

  /**
   * Find all programs with pagination
   */
  async findPrograms(
    status?: ContentStatus,
    skip: number = 0,
    take: number = 20,
  ): Promise<{ programs: any[]; total: number }> {
    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = ContentStatus.PUBLISHED;
    }

    const [programs, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.program.count({ where }),
    ]);

    return { programs, total };
  }

  /**
   * Find program by ID
   */
  async findProgramById(id: string): Promise<any | null> {
    return await this.prisma.program.findUnique({
      where: { id },
    });
  }

  /**
   * Find episodes for a program
   */
  async findEpisodesByProgramId(
    programId: string,
    skip: number = 0,
    take: number = 20,
  ): Promise<{ episodes: any[]; total: number }> {
    const where = {
      programId,
      status: ContentStatus.PUBLISHED,
    };

    const [episodes, total] = await Promise.all([
      this.prisma.episode.findMany({
        where,
        skip,
        take,
        orderBy: { episodeNumber: 'asc' },
      }),
      this.prisma.episode.count({ where }),
    ]);

    return { episodes, total };
  }

  /**
   * Find trending programs
   */
  async findTrending(
    contentType?: ContentType,
    limit: number = 10,
  ): Promise<any[]> {
    // In a real implementation, this would use view counts, ratings, etc.
    // For now, we'll use recently published content
    const where: any = {
      status: ContentStatus.PUBLISHED,
    };

    return await this.prisma.program.findMany({
      where,
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Find popular programs
   */
  async findPopular(
    contentType?: ContentType,
    limit: number = 10,
  ): Promise<any[]> {
    // In a real implementation, this would use view counts, ratings, etc.
    // For now, we'll use programs with most episodes
    const where: any = {
      status: ContentStatus.PUBLISHED,
    };

    return await this.prisma.program.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
