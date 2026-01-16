import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '@mediamesh/shared';

/**
 * Create Metadata DTO
 */
export class CreateMetadataDto {
  @ApiProperty({
    name: 'contentId',
    description: 'Content identifier (UUID) that this metadata belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
  })
  @IsUUID()
  contentId: string;

  @ApiProperty({
    name: 'contentType',
    description: 'Type of content this metadata describes',
    enum: ContentType,
    example: ContentType.PROGRAM,
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({
    name: 'title',
    description: 'Metadata title',
    example: 'The Great Adventure',
    type: String,
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    name: 'description',
    description: 'Detailed metadata description',
    example: 'An epic adventure story about heroes and villains in a fantasy world',
    type: String,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    name: 'category',
    description: 'Content category',
    example: 'MOVIE',
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    name: 'language',
    description: 'Language code (ISO 639-1)',
    example: 'en',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    name: 'tags',
    description: 'Array of tags for categorization and search',
    example: ['action', 'adventure', 'fantasy', 'drama'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * Update Metadata DTO
 */
export class UpdateMetadataDto {
  @ApiPropertyOptional({
    name: 'title',
    description: 'Metadata title',
    example: 'The Great Adventure - Updated',
    type: String,
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    name: 'description',
    description: 'Detailed metadata description',
    example: 'Updated description with more details about the story and characters',
    type: String,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    name: 'category',
    description: 'Content category',
    example: 'MOVIE',
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    name: 'language',
    description: 'Language code (ISO 639-1)',
    example: 'en',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    name: 'tags',
    description: 'Array of tags for categorization and search',
    example: ['action', 'adventure', 'drama', 'fantasy'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * Metadata Response DTO
 */
export class MetadataResponseDto {
  @ApiProperty({
    name: 'id',
    description: 'Unique metadata identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
  })
  id: string;

  @ApiProperty({
    name: 'contentId',
    description: 'Content identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    type: String,
  })
  contentId: string;

  @ApiProperty({
    name: 'contentType',
    description: 'Type of content',
    enum: ContentType,
    example: ContentType.PROGRAM,
  })
  contentType: ContentType;

  @ApiProperty({
    name: 'title',
    description: 'Metadata title',
    example: 'The Great Adventure',
    type: String,
  })
  title: string;

  @ApiPropertyOptional({
    name: 'description',
    description: 'Metadata description',
    example: 'An epic adventure story about heroes and villains',
    type: String,
  })
  description?: string;

  @ApiPropertyOptional({
    name: 'category',
    description: 'Content category',
    example: 'MOVIE',
    type: String,
  })
  category?: string;

  @ApiPropertyOptional({
    name: 'language',
    description: 'Language code',
    example: 'en',
    type: String,
  })
  language?: string;

  @ApiPropertyOptional({
    name: 'tags',
    description: 'Array of tags',
    example: ['action', 'adventure', 'fantasy'],
    type: [String],
  })
  tags?: string[];

  @ApiProperty({
    name: 'createdAt',
    description: 'Metadata creation timestamp (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  createdAt: string;

  @ApiProperty({
    name: 'updatedAt',
    description: 'Metadata last update timestamp (ISO 8601)',
    example: '2024-01-16T14:20:00.000Z',
    type: String,
  })
  updatedAt: string;
}
