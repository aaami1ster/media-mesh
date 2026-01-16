import { ContentType } from '@mediamesh/shared';

/**
 * Storage Type Enum
 */
export enum StorageType {
  S3 = 'S3',
  SPACES = 'SPACES',
  MINIO = 'MINIO',
}

/**
 * Media Entity
 * 
 * Represents media files associated with content.
 */
export class Media {
  id: string;
  contentId: string;
  contentType: ContentType;
  url: string; // CDN URL
  thumbnailUrl?: string;
  storageType: StorageType;
  storageKey: string; // Key in object storage
  fileSize: bigint; // File size in bytes
  mimeType: string;
  createdAt: Date;

  constructor(partial: Partial<Media>) {
    Object.assign(this, partial);
  }

  /**
   * Create Media entity from Prisma model
   */
  static fromPrisma(prismaMedia: {
    id: string;
    contentId: string;
    contentType: string;
    url: string;
    thumbnailUrl: string | null;
    storageType: string;
    storageKey: string;
    fileSize: bigint;
    mimeType: string;
    createdAt: Date;
  }): Media {
    return new Media({
      id: prismaMedia.id,
      contentId: prismaMedia.contentId,
      contentType: prismaMedia.contentType as ContentType,
      url: prismaMedia.url,
      thumbnailUrl: prismaMedia.thumbnailUrl || undefined,
      storageType: prismaMedia.storageType as StorageType,
      storageKey: prismaMedia.storageKey,
      fileSize: prismaMedia.fileSize,
      mimeType: prismaMedia.mimeType,
      createdAt: prismaMedia.createdAt,
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
