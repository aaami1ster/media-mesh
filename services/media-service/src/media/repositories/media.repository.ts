import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Media } from '../entities/media.entity';
import { ContentType } from '@mediamesh/shared';
import { StorageType } from '../entities/media.entity';

/**
 * Media Repository
 * 
 * Data access layer for Media entities.
 */
@Injectable()
export class MediaRepository {
  private readonly logger = new Logger(MediaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new media entry
   */
  async create(data: {
    contentId: string;
    contentType: ContentType;
    url: string;
    thumbnailUrl?: string;
    storageType: StorageType;
    storageKey: string;
    fileSize: bigint;
    mimeType: string;
  }): Promise<Media> {
    const prismaMedia = await this.prisma.media.create({
      data: {
        contentId: data.contentId,
        contentType: data.contentType,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        storageType: data.storageType,
        storageKey: data.storageKey,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      },
    });

    return Media.fromPrisma(prismaMedia);
  }

  /**
   * Find media by ID
   */
  async findById(id: string): Promise<Media | null> {
    const prismaMedia = await this.prisma.media.findUnique({
      where: { id },
    });

    return prismaMedia ? Media.fromPrisma(prismaMedia) : null;
  }

  /**
   * Find media by content ID
   */
  async findByContentId(contentId: string): Promise<Media[]> {
    const prismaMediaList = await this.prisma.media.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });

    return prismaMediaList.map(Media.fromPrisma);
  }

  /**
   * Find all media with pagination
   */
  async findAll(skip: number = 0, take: number = 20): Promise<Media[]> {
    const prismaMediaList = await this.prisma.media.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return prismaMediaList.map(Media.fromPrisma);
  }

  /**
   * Update media
   */
  async update(
    id: string,
    data: {
      url?: string;
      thumbnailUrl?: string;
    },
  ): Promise<Media> {
    const prismaMedia = await this.prisma.media.update({
      where: { id },
      data: {
        ...(data.url !== undefined && { url: data.url }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
      },
    });

    return Media.fromPrisma(prismaMedia);
  }

  /**
   * Delete media
   */
  async delete(id: string): Promise<void> {
    await this.prisma.media.delete({
      where: { id },
    });
  }

  /**
   * Count media entries
   */
  async count(): Promise<number> {
    return await this.prisma.media.count();
  }

  /**
   * Count media by content type
   */
  async countByContentType(contentType: ContentType): Promise<number> {
    return await this.prisma.media.count({
      where: { contentType },
    });
  }
}
