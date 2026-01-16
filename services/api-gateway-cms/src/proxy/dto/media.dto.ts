import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Generate Thumbnail DTO
 */
export class GenerateThumbnailDto {
  @ApiPropertyOptional({
    name: 'width',
    description: 'Thumbnail width in pixels',
    example: 320,
    type: Number,
    minimum: 1,
    maximum: 4096,
    default: 320,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number = 320;

  @ApiPropertyOptional({
    name: 'height',
    description: 'Thumbnail height in pixels',
    example: 240,
    type: Number,
    minimum: 1,
    maximum: 4096,
    default: 240,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number = 240;
}

/**
 * Media Response DTO
 */
export class MediaResponseDto {
  @ApiProperty({
    name: 'id',
    description: 'Unique media identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
  })
  id: string;

  @ApiProperty({
    name: 'contentId',
    description: 'Associated content identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    type: String,
  })
  contentId: string;

  @ApiProperty({
    name: 'url',
    description: 'Media file URL',
    example: 'https://cdn.mediamesh.com/media/videos/550e8400-e29b-41d4-a716-446655440001.mp4',
    type: String,
  })
  url: string;

  @ApiPropertyOptional({
    name: 'thumbnailUrl',
    description: 'Thumbnail image URL',
    example: 'https://cdn.mediamesh.com/media/thumbnails/550e8400-e29b-41d4-a716-446655440001.jpg',
    type: String,
  })
  thumbnailUrl?: string;

  @ApiProperty({
    name: 'type',
    description: 'Media type',
    example: 'video',
    type: String,
  })
  type: string;

  @ApiProperty({
    name: 'size',
    description: 'File size in bytes',
    example: 104857600,
    type: Number,
  })
  size: number;

  @ApiProperty({
    name: 'createdAt',
    description: 'Media creation timestamp (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  createdAt: string;

  @ApiProperty({
    name: 'updatedAt',
    description: 'Media last update timestamp (ISO 8601)',
    example: '2024-01-16T14:20:00.000Z',
    type: String,
  })
  updatedAt: string;
}
