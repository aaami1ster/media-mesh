import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  IsUrl,
  IsBoolean,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Content status enum
 */
export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Content type enum
 */
export enum ContentType {
  PROGRAM = 'PROGRAM',
  EPISODE = 'EPISODE',
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

/**
 * Program DTO
 */
export class ProgramDto {
  @IsUUID()
  id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsEnum(ContentStatus)
  status: ContentStatus;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number; // in seconds

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rating?: string; // e.g., "PG-13", "R"

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

/**
 * Episode DTO
 */
export class EpisodeDto {
  @IsUUID()
  id: string;

  @IsUUID()
  programId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(1)
  episodeNumber: number;

  @IsInt()
  @Min(1)
  seasonNumber: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number; // in seconds

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsEnum(ContentStatus)
  status: ContentStatus;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

/**
 * Create Program DTO
 */
export class CreateProgramDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus = ContentStatus.DRAFT;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rating?: string;
}

/**
 * Update Program DTO
 */
export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rating?: string;
}
