import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from '@mediamesh/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Metadata Category Enum
 */
export enum MetadataCategory {
  MOVIE = 'MOVIE',
  TV_SHOW = 'TV_SHOW',
  DOCUMENTARY = 'DOCUMENTARY',
  SPORTS = 'SPORTS',
  NEWS = 'NEWS',
  ENTERTAINMENT = 'ENTERTAINMENT',
  EDUCATIONAL = 'EDUCATIONAL',
  MUSIC = 'MUSIC',
  PODCAST = 'PODCAST',
  OTHER = 'OTHER',
}

/**
 * Metadata DTO
 */
export class MetadataDto {
  @ApiProperty({ description: 'Metadata ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Metadata title', example: 'The Great Adventure', minLength: 1, maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Metadata description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Content category', enum: MetadataCategory })
  @IsOptional()
  @IsEnum(MetadataCategory)
  category?: MetadataCategory;

  @ApiPropertyOptional({ description: 'Language code (ISO 639-1)', example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds', example: 3600, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Publish date', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiProperty({ description: 'Content ID (program/episode)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  contentId: string;

  @ApiProperty({ description: 'Content type', enum: ContentType })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ description: 'Metadata version', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsDateString()
  updatedAt: string;
}

/**
 * Create Metadata DTO
 */
export class CreateMetadataDto {
  @ApiProperty({ description: 'Metadata title', example: 'The Great Adventure', minLength: 1, maxLength: 200 })
  @IsString()
  @MinLength(1, { message: 'Title is required and must be at least 1 character' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @ApiPropertyOptional({ description: 'Metadata description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description?: string;

  @ApiPropertyOptional({ description: 'Content category', enum: MetadataCategory })
  @IsOptional()
  @IsEnum(MetadataCategory, { message: 'Category must be a valid MetadataCategory value' })
  category?: MetadataCategory;

  @ApiPropertyOptional({ description: 'Language code (ISO 639-1)', example: 'en', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Language code must not exceed 10 characters' })
  language?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds', example: 3600, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Duration must be an integer' })
  @Min(0, { message: 'Duration must be a positive number or zero' })
  duration?: number;

  @ApiPropertyOptional({ description: 'Publish date', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Publish date must be a valid ISO 8601 date string' })
  publishDate?: string;

  @ApiProperty({ description: 'Content ID (program/episode)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID('4', { message: 'Content ID must be a valid UUID' })
  contentId: string;

  @ApiProperty({ description: 'Content type', enum: ContentType })
  @IsEnum(ContentType, { message: 'Content type must be PROGRAM or EPISODE' })
  contentType: ContentType;
}

/**
 * Update Metadata DTO
 */
export class UpdateMetadataDto {
  @ApiPropertyOptional({ description: 'Metadata title', example: 'The Great Adventure', minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @ApiPropertyOptional({ description: 'Metadata description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description?: string;

  @ApiPropertyOptional({ description: 'Content category', enum: MetadataCategory })
  @IsOptional()
  @IsEnum(MetadataCategory, { message: 'Category must be a valid MetadataCategory value' })
  category?: MetadataCategory;

  @ApiPropertyOptional({ description: 'Language code (ISO 639-1)', example: 'en', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Language code must not exceed 10 characters' })
  language?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds', example: 3600, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Duration must be an integer' })
  @Min(0, { message: 'Duration must be a positive number or zero' })
  duration?: number;

  @ApiPropertyOptional({ description: 'Publish date', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Publish date must be a valid ISO 8601 date string' })
  publishDate?: string;
}

/**
 * Metadata Version DTO
 */
export class MetadataVersionDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsUUID()
  metadataId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(MetadataCategory)
  category?: MetadataCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiProperty()
  @IsUUID()
  contentId: string;

  @ApiProperty()
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty()
  @IsInt()
  version: number;

  @ApiProperty()
  @IsDateString()
  createdAt: string;
}
