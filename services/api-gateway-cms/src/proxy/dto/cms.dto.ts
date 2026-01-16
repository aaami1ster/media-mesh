import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { ContentStatus } from '@mediamesh/shared';

/**
 * Create Program DTO
 */
export class CreateProgramDto {
  @ApiProperty({
    description: 'Program title',
    example: 'The Great Adventure',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Program description',
    example: 'An epic adventure story about heroes and villains',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Program status',
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'Metadata ID reference',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  metadataId?: string;
}

/**
 * Update Program DTO
 */
export class UpdateProgramDto {
  @ApiPropertyOptional({
    description: 'Program title',
    example: 'The Great Adventure - Updated',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Program description',
    example: 'An updated epic adventure story',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Program status',
    enum: ContentStatus,
    example: ContentStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'Metadata ID reference',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  metadataId?: string;
}

/**
 * Create Episode DTO
 */
export class CreateEpisodeDto {
  @ApiProperty({
    description: 'Program ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  programId: string;

  @ApiProperty({
    description: 'Episode title',
    example: 'Episode 1: The Beginning',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Episode description',
    example: 'The first episode of the series',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Episode number',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  episodeNumber: number;

  @ApiPropertyOptional({
    description: 'Episode duration in seconds',
    example: 3600,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Episode status',
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'Metadata ID reference',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  metadataId?: string;
}

/**
 * Update Episode DTO
 */
export class UpdateEpisodeDto {
  @ApiPropertyOptional({
    description: 'Episode title',
    example: 'Episode 1: The Beginning - Updated',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Episode description',
    example: 'Updated episode description',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Episode number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @ApiPropertyOptional({
    description: 'Episode duration in seconds',
    example: 3600,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Episode status',
    enum: ContentStatus,
    example: ContentStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'Metadata ID reference',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  metadataId?: string;
}

/**
 * Pagination Query DTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

/**
 * Program Response DTO
 */
export class ProgramResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: 'The Great Adventure' })
  title: string;

  @ApiPropertyOptional({ example: 'An epic adventure story' })
  description?: string;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.PUBLISHED })
  status: ContentStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  metadataId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  publishedAt?: string;
}

/**
 * Episode Response DTO
 */
export class EpisodeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  programId: string;

  @ApiProperty({ example: 'Episode 1: The Beginning' })
  title: string;

  @ApiPropertyOptional({ example: 'The first episode' })
  description?: string;

  @ApiProperty({ example: 1 })
  episodeNumber: number;

  @ApiPropertyOptional({ example: 3600 })
  duration?: number;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.PUBLISHED })
  status: ContentStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  metadataId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;
}
