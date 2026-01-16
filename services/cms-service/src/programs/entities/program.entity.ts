import { ContentStatus } from '@mediamesh/shared';

/**
 * Program Entity
 * 
 * Represents a program (TV show, series, etc.) in the CMS.
 */
export class Program {
  id: string;
  title: string;
  description?: string;
  status: ContentStatus;
  metadataId?: string; // Optional FK to metadata service
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;

  constructor(partial: Partial<Program>) {
    Object.assign(this, partial);
  }

  /**
   * Create Program entity from Prisma model
   */
  static fromPrisma(prismaProgram: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    metadataId: string | null;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
  }): Program {
    return new Program({
      id: prismaProgram.id,
      title: prismaProgram.title,
      description: prismaProgram.description || undefined,
      status: prismaProgram.status as ContentStatus,
      metadataId: prismaProgram.metadataId || undefined,
      createdAt: prismaProgram.createdAt,
      updatedAt: prismaProgram.updatedAt,
      publishedAt: prismaProgram.publishedAt || undefined,
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
