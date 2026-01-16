import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Metadata, MetadataVersion } from '../entities/metadata.entity';
import { MetadataCategory } from '../dto/metadata.dto';
import { ContentType } from '@mediamesh/shared';

/**
 * Metadata Repository
 * 
 * Data access layer for Metadata entities.
 */
@Injectable()
export class MetadataRepository {
  private readonly logger = new Logger(MetadataRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new metadata entry
   */
  async create(data: {
    title: string;
    description?: string;
    category?: MetadataCategory;
    language?: string;
    duration?: number;
    publishDate?: Date;
    contentId: string;
    contentType: ContentType;
  }): Promise<Metadata> {
    const prismaMetadata = await this.prisma.metadata.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        language: data.language,
        duration: data.duration,
        publishDate: data.publishDate,
        contentId: data.contentId,
        contentType: data.contentType,
        version: 1,
      },
    });

    return Metadata.fromPrisma(prismaMetadata);
  }

  /**
   * Find metadata by ID
   */
  async findById(id: string): Promise<Metadata | null> {
    const prismaMetadata = await this.prisma.metadata.findUnique({
      where: { id },
    });

    return prismaMetadata ? Metadata.fromPrisma(prismaMetadata) : null;
  }

  /**
   * Find metadata by content ID
   */
  async findByContentId(contentId: string): Promise<Metadata | null> {
    const prismaMetadata = await this.prisma.metadata.findFirst({
      where: { contentId },
      orderBy: { version: 'desc' },
    });

    return prismaMetadata ? Metadata.fromPrisma(prismaMetadata) : null;
  }

  /**
   * Find all metadata with pagination
   */
  async findAll(skip: number = 0, take: number = 20): Promise<Metadata[]> {
    const prismaMetadataList = await this.prisma.metadata.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return prismaMetadataList.map(Metadata.fromPrisma);
  }

  /**
   * Update metadata (creates new version)
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: MetadataCategory;
      language?: string;
      duration?: number;
      publishDate?: Date;
    },
  ): Promise<Metadata> {
    // Get current metadata
    const current = await this.findById(id);
    if (!current) {
      throw new Error('Metadata not found');
    }

    // Create version history entry
    await this.prisma.metadataVersion.create({
      data: {
        metadataId: current.id,
        title: current.title,
        description: current.description,
        category: current.category,
        language: current.language,
        duration: current.duration,
        publishDate: current.publishDate,
        contentId: current.contentId,
        contentType: current.contentType,
        version: current.version,
      },
    });

    // Update metadata with new version
    const prismaMetadata = await this.prisma.metadata.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.publishDate !== undefined && { publishDate: data.publishDate }),
        version: current.version + 1,
      },
    });

    return Metadata.fromPrisma(prismaMetadata);
  }

  /**
   * Get version history for metadata
   */
  async getVersionHistory(metadataId: string): Promise<MetadataVersion[]> {
    const versions = await this.prisma.metadataVersion.findMany({
      where: { metadataId },
      orderBy: { version: 'desc' },
    });

    return versions.map(MetadataVersion.fromPrisma);
  }

  /**
   * Get specific version of metadata
   */
  async getVersion(metadataId: string, version: number): Promise<MetadataVersion | null> {
    const versionRecord = await this.prisma.metadataVersion.findFirst({
      where: {
        metadataId,
        version,
      },
    });

    return versionRecord ? MetadataVersion.fromPrisma(versionRecord) : null;
  }

  /**
   * Delete metadata
   */
  async delete(id: string): Promise<void> {
    await this.prisma.metadata.delete({
      where: { id },
    });
  }

  /**
   * Count metadata entries
   */
  async count(): Promise<number> {
    return await this.prisma.metadata.count();
  }

  /**
   * Count metadata by content type
   */
  async countByContentType(contentType: ContentType): Promise<number> {
    return await this.prisma.metadata.count({
      where: { contentType },
    });
  }
}
