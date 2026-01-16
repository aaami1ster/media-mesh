import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ContentType } from '@mediamesh/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageType } from '../entities/media.entity';

/**
 * Media DTO
 */
export class MediaDto {
  @ApiProperty({ description: 'Media ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Content ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  contentId: string;

  @ApiProperty({ description: 'Content type', enum: ContentType })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ description: 'CDN URL', example: 'https://cdn.example.com/media/video.mp4' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Thumbnail CDN URL', example: 'https://cdn.example.com/thumbnails/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Storage type', enum: StorageType })
  @IsEnum(StorageType)
  storageType: StorageType;

  @ApiProperty({ description: 'Storage key', example: 'media/video-123.mp4' })
  @IsString()
  storageKey: string;

  @ApiProperty({ description: 'File size in bytes', example: 1048576 })
  @IsInt()
  @Min(0)
  fileSize: number;

  @ApiProperty({ description: 'MIME type', example: 'video/mp4' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsString()
  createdAt: string;
}

/**
 * Upload Media DTO
 */
export class UploadMediaDto {
  @ApiProperty({ description: 'Content ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID('4', { message: 'Content ID must be a valid UUID' })
  contentId: string;

  @ApiProperty({ description: 'Content type', enum: ContentType })
  @IsEnum(ContentType, { message: 'Content type must be PROGRAM or EPISODE' })
  contentType: ContentType;
}

/**
 * Generate Thumbnail DTO
 */
export class GenerateThumbnailDto {
  @ApiPropertyOptional({ description: 'Thumbnail width in pixels', example: 320, minimum: 1, maximum: 4096 })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Thumbnail height in pixels', example: 240, minimum: 1, maximum: 4096 })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}
