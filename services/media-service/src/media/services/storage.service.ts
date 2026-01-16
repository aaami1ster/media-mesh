import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STORAGE_CONFIG } from '../../config/env.constants';

/**
 * Storage Service
 * 
 * Handles object storage operations for multiple providers:
 * - AWS S3
 * - DigitalOcean Spaces (S3-compatible)
 * - MinIO (S3-compatible)
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string;

  constructor() {
    this.bucket = STORAGE_CONFIG.BUCKET;
    this.cdnBaseUrl = STORAGE_CONFIG.CDN_BASE_URL || '';

    // Configure S3 client based on provider
    const config: any = {
      region: STORAGE_CONFIG.REGION,
      credentials: {
        accessKeyId: STORAGE_CONFIG.ACCESS_KEY_ID,
        secretAccessKey: STORAGE_CONFIG.SECRET_ACCESS_KEY,
      },
    };

    // Set endpoint for Spaces or MinIO
    if (STORAGE_CONFIG.PROVIDER === 'SPACES' || STORAGE_CONFIG.PROVIDER === 'MINIO') {
      config.endpoint = STORAGE_CONFIG.ENDPOINT || 
        (STORAGE_CONFIG.PROVIDER === 'MINIO' 
          ? `http${STORAGE_CONFIG.MINIO_USE_SSL ? 's' : ''}://${STORAGE_CONFIG.MINIO_ENDPOINT}`
          : `https://${STORAGE_CONFIG.REGION}.digitaloceanspaces.com`);
      
      // MinIO and Spaces use path-style addressing
      config.forcePathStyle = true;
    }

    this.s3Client = new S3Client(config);
    this.logger.log(`Storage service initialized with provider: ${STORAGE_CONFIG.PROVIDER}`);
  }

  /**
   * Upload file to object storage
   */
  async uploadFile(
    key: string,
    file: Buffer,
    mimeType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      this.logger.log(`File uploaded successfully: ${key}`);

      return this.getCDNUrl(key);
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete file from object storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for upload
   */
  async generatePresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger.log(`Presigned upload URL generated: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${key}`, error);
      throw new BadRequestException(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for download
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger.log(`Presigned download URL generated: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned download URL: ${key}`, error);
      throw new BadRequestException(`Failed to generate presigned download URL: ${error.message}`);
    }
  }

  /**
   * Get CDN URL for a storage key
   */
  getCDNUrl(key: string): string {
    if (this.cdnBaseUrl) {
      // Remove leading slash from key if present
      const cleanKey = key.startsWith('/') ? key.slice(1) : key;
      return `${this.cdnBaseUrl}/${cleanKey}`;
    }

    // Fallback to direct S3 URL if no CDN configured
    const endpoint = STORAGE_CONFIG.ENDPOINT || 
      (STORAGE_CONFIG.PROVIDER === 'MINIO' 
        ? `http${STORAGE_CONFIG.MINIO_USE_SSL ? 's' : ''}://${STORAGE_CONFIG.MINIO_ENDPOINT}`
        : `https://${this.bucket}.s3.${STORAGE_CONFIG.REGION}.amazonaws.com`);
    
    return `${endpoint}/${key}`;
  }

  /**
   * Generate storage key from content ID and filename
   */
  generateStorageKey(contentId: string, contentType: string, filename: string): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop() || '';
    return `${contentType.toLowerCase()}/${contentId}/${timestamp}-${filename}`;
  }

  /**
   * Generate thumbnail storage key
   */
  generateThumbnailKey(originalKey: string): string {
    const parts = originalKey.split('.');
    const extension = parts.pop() || 'jpg';
    return `${parts.join('.')}-thumb.${extension}`;
  }
}
