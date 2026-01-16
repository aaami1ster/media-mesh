import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsInt,
  IsUrl,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType, IngestStatus } from '../entities/ingest-job.entity';

/**
 * Create Ingest Job DTO
 */
export class CreateIngestJobDto {
  @ApiProperty({ description: 'Source type', enum: SourceType })
  @IsEnum(SourceType, { message: 'Source type must be YOUTUBE, RSS, or API' })
  sourceType: SourceType;

  @ApiProperty({ description: 'Source URL', example: 'https://www.youtube.com/channel/UC...' })
  @IsUrl({}, { message: 'Source URL must be a valid URL' })
  sourceUrl: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Ingest Job DTO
 */
export class IngestJobDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty({ enum: SourceType })
  @IsEnum(SourceType)
  sourceType: SourceType;

  @ApiProperty()
  @IsUrl()
  sourceUrl: string;

  @ApiProperty({ enum: IngestStatus })
  @IsEnum(IngestStatus)
  status: IngestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  retryCount: number;

  @ApiProperty()
  @IsString()
  createdAt: string;

  @ApiProperty()
  @IsString()
  updatedAt: string;
}

/**
 * Ingest Jobs Query DTO
 */
export class IngestJobsQueryDto {
  @ApiPropertyOptional({ description: 'Status filter', enum: IngestStatus })
  @IsOptional()
  @IsEnum(IngestStatus)
  status?: IngestStatus;

  @ApiPropertyOptional({ description: 'Source type filter', enum: SourceType })
  @IsOptional()
  @IsEnum(SourceType)
  sourceType?: SourceType;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
