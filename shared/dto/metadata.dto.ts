import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
  IsArray,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Metadata DTO
 */
export class MetadataDto {
  @IsUUID()
  id: string;

  @IsUUID()
  contentId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string; // e.g., "string", "number", "boolean", "json"

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

/**
 * Create Metadata DTO
 */
export class CreateMetadataDto {
  @IsUUID()
  contentId: string;

  @IsString()
  @MinLength(1, { message: 'Key is required' })
  @MaxLength(100, { message: 'Key must not exceed 100 characters' })
  key: string;

  @IsString()
  @MinLength(1, { message: 'Value is required' })
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

/**
 * Bulk create metadata DTO
 */
export class BulkCreateMetadataDto {
  @IsUUID()
  contentId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMetadataDto)
  metadata: CreateMetadataDto[];
}
