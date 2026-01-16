import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MediaRepository } from '../repositories/media.repository';
import { StorageService } from './storage.service';
import { Media, StorageType } from '../entities/media.entity';
import { ContentType } from '@mediamesh/shared';
import { throwIfNotFound } from '@mediamesh/shared';
import sharp from 'sharp';
import { STORAGE_CONFIG } from '../../config/env.constants';

/**
 * Media Service
 * 
 * Business logic layer for media operations.
 * Handles file uploads, CDN URL generation, and thumbnail creation.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload media file
   */
  async upload(
    contentId: string,
    contentType: ContentType,
    file: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<Media> {
    this.logger.log(`Uploading media for content: ${contentId} (${contentType})`);

    // Validate file size (max 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.length > maxSize) {
      throw new BadRequestException('File size exceeds maximum limit of 5GB');
    }

    // Generate storage key
    const storageKey = this.storageService.generateStorageKey(
      contentId,
      contentType,
      filename,
    );

    // Upload to object storage
    const url = await this.storageService.uploadFile(
      storageKey,
      file,
      mimeType,
      {
        contentId,
        contentType,
        originalFilename: filename,
      },
    );

    // Create media record
    const media = await this.mediaRepository.create({
      contentId,
      contentType,
      url,
      storageType: STORAGE_CONFIG.PROVIDER as StorageType,
      storageKey,
      fileSize: BigInt(file.length),
      mimeType,
    });

    this.logger.log(`Media uploaded successfully: ${media.id}`);
    return media;
  }

  /**
   * Find media by ID
   */
  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findById(id);
    throwIfNotFound(media, 'Media', id);
    return media!;
  }

  /**
   * Find media by content ID
   */
  async findByContentId(contentId: string): Promise<Media[]> {
    return await this.mediaRepository.findByContentId(contentId);
  }

  /**
   * Delete media
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting media: ${id}`);

    const media = await this.findOne(id);

    // Delete from object storage
    try {
      await this.storageService.deleteFile(media.storageKey);
      
      // Delete thumbnail if exists
      if (media.thumbnailUrl) {
        const thumbnailKey = this.storageService.generateThumbnailKey(media.storageKey);
        await this.storageService.deleteFile(thumbnailKey);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file from storage: ${error.message}`);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await this.mediaRepository.delete(id);
    this.logger.log(`Media deleted: ${id}`);
  }

  /**
   * Generate thumbnail for media
   */
  async generateThumbnail(
    id: string,
    width: number = 320,
    height: number = 240,
  ): Promise<Media> {
    this.logger.log(`Generating thumbnail for media: ${id}`);

    const media = await this.findOne(id);

    // Check if media is an image or video
    if (!media.mimeType.startsWith('image/') && !media.mimeType.startsWith('video/')) {
      throw new BadRequestException('Thumbnail generation only supported for images and videos');
    }

    // Generate thumbnail key
    const thumbnailKey = this.storageService.generateThumbnailKey(media.storageKey);

    let thumbnailBuffer: Buffer;
    
    if (media.mimeType.startsWith('image/')) {
      // For images, download from storage and generate thumbnail
      // Note: In production, you might want to use a CDN that generates thumbnails on-the-fly
      // For now, we'll create a placeholder since we don't have direct file access
      // In a real implementation, you'd download the file from storage first
      thumbnailBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 100, g: 100, b: 100 },
        },
      })
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      // For videos, we'd need to extract a frame using ffmpeg
      // For now, create a placeholder
      thumbnailBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 0, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();
    }

    // Upload thumbnail to storage
    const thumbnailUrl = await this.storageService.uploadFile(
      thumbnailKey,
      thumbnailBuffer,
      'image/jpeg',
      {
        mediaId: media.id,
        type: 'thumbnail',
      },
    );

    // Update media record with thumbnail URL
    const updated = await this.mediaRepository.update(media.id, {
      thumbnailUrl,
    });

    this.logger.log(`Thumbnail generated: ${id}`);
    return updated;
  }

  /**
   * Get CDN URL for media
   */
  getCDNUrl(media: Media): string {
    return this.storageService.getCDNUrl(media.storageKey);
  }

  /**
   * Generate presigned upload URL
   */
  async generatePresignedUploadUrl(
    contentId: string,
    contentType: ContentType,
    filename: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    const storageKey = this.storageService.generateStorageKey(
      contentId,
      contentType,
      filename,
    );

    const uploadUrl = await this.storageService.generatePresignedUploadUrl(
      storageKey,
      mimeType,
    );

    return { uploadUrl, storageKey };
  }
}
