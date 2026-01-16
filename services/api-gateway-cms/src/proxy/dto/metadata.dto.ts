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
    description: 'Content ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  contentId: string;

  @ApiProperty({
    description: 'Content type',
    enum: ContentType,
    example: ContentType.PROGRAM,
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({
    description: 'Metadata title',
    example: 'The Great Adventure',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Metadata description',
    example: 'An epic adventure story',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category',
    example: 'MOVIE',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Tags',
    example: ['action', 'adventure'],
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
    description: 'Metadata title',
    example: 'The Great Adventure - Updated',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Metadata description',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category',
    example: 'MOVIE',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Tags',
    example: ['action', 'adventure', 'drama'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
