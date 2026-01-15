import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsUrl,
  IsInt,
  Min,
  IsMimeType,
} from 'class-validator';

/**
 * Media type enum
 */
export enum MediaType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  SUBTITLE = 'SUBTITLE',
}

/**
 * Media status enum
 */
export enum MediaStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

/**
 * Media DTO
 */
export class MediaDto {
  @IsUUID()
  id: string;

  @IsUUID()
  contentId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  filename: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  originalFilename: string;

  @IsEnum(MediaType)
  type: MediaType;

  @IsEnum(MediaStatus)
  status: MediaStatus;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsString()
  @MaxLength(100)
  mimeType: string;

  @IsInt()
  @Min(0)
  size: number; // in bytes

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number; // in seconds (for video/audio)

  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number; // for images/video

  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number; // for images/video

  @IsOptional()
  @IsInt()
  @Min(0)
  bitrate?: number; // for video/audio

  @IsOptional()
  @IsString()
  @MaxLength(50)
  encoding?: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

/**
 * Upload Media DTO
 */
export class UploadMediaDto {
  @IsUUID()
  contentId: string;

  @IsString()
  @MinLength(1, { message: 'Filename is required' })
  @MaxLength(200, { message: 'Filename must not exceed 200 characters' })
  filename: string;

  @IsEnum(MediaType)
  type: MediaType;

  @IsString()
  @IsMimeType()
  mimeType: string;

  @IsInt()
  @Min(1)
  size: number; // in bytes

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

/**
 * Media upload response DTO
 */
export class MediaUploadResponseDto {
  @IsUUID()
  mediaId: string;

  @IsUrl()
  uploadUrl: string;

  @IsString()
  uploadMethod: string = 'PUT';

  @IsOptional()
  uploadHeaders?: Record<string, string>;

  @IsInt()
  expiresIn: number; // seconds until upload URL expires
}
