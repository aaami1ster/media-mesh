import { IsString, IsEnum, IsUrl, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Source Type Enum
 */
export enum SourceType {
  YOUTUBE = 'YOUTUBE',
  RSS = 'RSS',
  API = 'API',
}

/**
 * Create Ingest Job DTO
 */
export class CreateIngestJobDto {
  @ApiProperty({
    name: 'sourceType',
    description: 'Type of content source',
    enum: SourceType,
    example: SourceType.YOUTUBE,
  })
  @IsEnum(SourceType)
  sourceType: SourceType;

  @ApiProperty({
    name: 'sourceUrl',
    description: 'URL of the content source',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: String,
  })
  @IsUrl()
  sourceUrl: string;

  @ApiPropertyOptional({
    name: 'metadata',
    description: 'Additional metadata for the ingest job',
    example: {
      channel: 'example-channel',
      tags: ['music', 'video', 'entertainment'],
      category: 'Music',
      language: 'en',
    },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Ingest Job Response DTO
 */
export class IngestJobResponseDto {
  @ApiProperty({
    name: 'id',
    description: 'Unique ingest job identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
  })
  id: string;

  @ApiProperty({
    name: 'sourceType',
    description: 'Type of content source',
    enum: SourceType,
    example: SourceType.YOUTUBE,
  })
  sourceType: SourceType;

  @ApiProperty({
    name: 'sourceUrl',
    description: 'URL of the content source',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: String,
  })
  sourceUrl: string;

  @ApiProperty({
    name: 'status',
    description: 'Ingest job status',
    example: 'PENDING',
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  status: string;

  @ApiPropertyOptional({
    name: 'metadata',
    description: 'Additional metadata',
    example: {
      channel: 'example-channel',
      tags: ['music', 'video'],
    },
    type: Object,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    name: 'createdAt',
    description: 'Job creation timestamp (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  createdAt: string;

  @ApiProperty({
    name: 'updatedAt',
    description: 'Job last update timestamp (ISO 8601)',
    example: '2024-01-16T14:20:00.000Z',
    type: String,
  })
  updatedAt: string;

  @ApiPropertyOptional({
    name: 'completedAt',
    description: 'Job completion timestamp (ISO 8601)',
    example: '2024-01-16T14:25:00.000Z',
    type: String,
  })
  completedAt?: string;

  @ApiPropertyOptional({
    name: 'error',
    description: 'Error message if job failed',
    example: 'Failed to download video: Network timeout',
    type: String,
  })
  error?: string;
}
