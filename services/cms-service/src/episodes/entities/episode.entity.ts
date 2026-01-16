import { ContentStatus } from '@mediamesh/shared';

/**
 * Episode Entity
 * 
 * Represents an episode of a program.
 */
export class Episode {
  id: string;
  programId: string;
  title: string;
  description?: string;
  episodeNumber: number;
  duration?: number; // in seconds
  status: ContentStatus;
  metadataId?: string; // Optional FK to metadata service
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Episode>) {
    Object.assign(this, partial);
  }

  /**
   * Create Episode entity from Prisma model
   */
  static fromPrisma(prismaEpisode: {
    id: string;
    programId: string;
    title: string;
    description: string | null;
    episodeNumber: number;
    duration: number | null;
    status: string;
    metadataId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Episode {
    return new Episode({
      id: prismaEpisode.id,
      programId: prismaEpisode.programId,
      title: prismaEpisode.title,
      description: prismaEpisode.description || undefined,
      episodeNumber: prismaEpisode.episodeNumber,
      duration: prismaEpisode.duration || undefined,
      status: prismaEpisode.status as ContentStatus,
      metadataId: prismaEpisode.metadataId || undefined,
      createdAt: prismaEpisode.createdAt,
      updatedAt: prismaEpisode.updatedAt,
    });
  }

  /**
   * Convert to DTO
   */
  toDto() {
    const { ...dto } = this;
    return dto;
  }
}
