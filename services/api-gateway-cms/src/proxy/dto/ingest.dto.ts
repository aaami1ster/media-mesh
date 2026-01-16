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
    description: 'Source type',
    enum: SourceType,
    example: SourceType.YOUTUBE,
  })
  @IsEnum(SourceType)
  sourceType: SourceType;

  @ApiProperty({
    description: 'Source URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl()
  sourceUrl: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { channel: 'example-channel', tags: ['music', 'video'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
