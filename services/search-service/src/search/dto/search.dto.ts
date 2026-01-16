import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '@mediamesh/shared';

/**
 * Search Query DTO
 */
export class SearchQueryDto {
  @ApiProperty({ description: 'Search query', example: 'adventure' })
  @IsString()
  q: string;

  @ApiPropertyOptional({ description: 'Content type filter', enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({ description: 'Category filter', example: 'MOVIE' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Language filter', example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Tags filter', example: ['action', 'drama'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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

/**
 * Index Content DTO
 */
export class IndexContentDto {
  @ApiProperty({ description: 'Content ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID('4', { message: 'Content ID must be a valid UUID' })
  contentId: string;

  @ApiProperty({ description: 'Content type', enum: ContentType })
  @IsEnum(ContentType, { message: 'Content type must be PROGRAM, EPISODE, MOVIE, or SERIES' })
  contentType: ContentType;

  @ApiProperty({ description: 'Title', example: 'The Great Adventure' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description', example: 'An epic adventure story' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category', example: 'MOVIE' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Language', example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Tags', example: ['action', 'adventure'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * Search Result DTO
 */
export class SearchResultDto {
  @ApiProperty()
  results: any[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

/**
 * Index Status DTO
 */
export class IndexStatusDto {
  @ApiProperty()
  totalIndexed: number;

  @ApiPropertyOptional()
  lastIndexedAt: string | null;

  @ApiProperty()
  indexingInProgress: boolean;
}
