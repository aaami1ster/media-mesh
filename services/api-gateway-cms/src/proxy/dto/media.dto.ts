import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Generate Thumbnail DTO
 */
export class GenerateThumbnailDto {
  @ApiPropertyOptional({
    description: 'Thumbnail width in pixels',
    example: 320,
    minimum: 1,
    default: 320,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number = 320;

  @ApiPropertyOptional({
    description: 'Thumbnail height in pixels',
    example: 240,
    minimum: 1,
    default: 240,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number = 240;
}
