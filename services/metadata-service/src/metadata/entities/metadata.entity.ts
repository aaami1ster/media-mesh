import { ContentType } from '@mediamesh/shared';
import { MetadataCategory } from '../dto/metadata.dto';

/**
 * Metadata Entity
 * 
 * Represents metadata associated with content (programs/episodes).
 */
export class Metadata {
  id: string;
  title: string;
  description?: string;
  category?: MetadataCategory;
  language?: string;
  duration?: number; // in seconds
  publishDate?: Date;
  contentId: string; // FK to content (program/episode)
  contentType: ContentType; // PROGRAM or EPISODE
  version: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Metadata>) {
    Object.assign(this, partial);
  }

  /**
   * Create Metadata entity from Prisma model
   */
  static fromPrisma(prismaMetadata: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    language: string | null;
    duration: number | null;
    publishDate: Date | null;
    contentId: string;
    contentType: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Metadata {
    return new Metadata({
      id: prismaMetadata.id,
      title: prismaMetadata.title,
      description: prismaMetadata.description || undefined,
      category: (prismaMetadata.category as MetadataCategory) || undefined,
      language: prismaMetadata.language || undefined,
      duration: prismaMetadata.duration || undefined,
      publishDate: prismaMetadata.publishDate || undefined,
      contentId: prismaMetadata.contentId,
      contentType: prismaMetadata.contentType as ContentType,
      version: prismaMetadata.version,
      createdAt: prismaMetadata.createdAt,
      updatedAt: prismaMetadata.updatedAt,
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

/**
 * Metadata Version Entity
 */
export class MetadataVersion {
  id: string;
  metadataId: string;
  title: string;
  description?: string;
  category?: MetadataCategory;
  language?: string;
  duration?: number;
  publishDate?: Date;
  contentId: string;
  contentType: ContentType;
  version: number;
  createdAt: Date;

  constructor(partial: Partial<MetadataVersion>) {
    Object.assign(this, partial);
  }

  /**
   * Create MetadataVersion entity from Prisma model
   */
  static fromPrisma(prismaVersion: {
    id: string;
    metadataId: string;
    title: string;
    description: string | null;
    category: string | null;
    language: string | null;
    duration: number | null;
    publishDate: Date | null;
    contentId: string;
    contentType: string;
    version: number;
    createdAt: Date;
  }): MetadataVersion {
    return new MetadataVersion({
      id: prismaVersion.id,
      metadataId: prismaVersion.metadataId,
      title: prismaVersion.title,
      description: prismaVersion.description || undefined,
      category: (prismaVersion.category as MetadataCategory) || undefined,
      language: prismaVersion.language || undefined,
      duration: prismaVersion.duration || undefined,
      publishDate: prismaVersion.publishDate || undefined,
      contentId: prismaVersion.contentId,
      contentType: prismaVersion.contentType as ContentType,
      version: prismaVersion.version,
      createdAt: prismaVersion.createdAt,
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
