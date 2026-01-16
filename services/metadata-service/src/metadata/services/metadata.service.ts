import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MetadataRepository } from '../repositories/metadata.repository';
import { Metadata, MetadataVersion } from '../entities/metadata.entity';
import { CreateMetadataDto, UpdateMetadataDto, MetadataCategory } from '../dto/metadata.dto';
import { ContentType } from '@mediamesh/shared';
import { throwIfNotFound } from '@mediamesh/shared';

/**
 * Metadata validation schema
 */
interface MetadataSchema {
  title: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  description?: {
    maxLength: number;
  };
  duration?: {
    min: number;
    max: number;
  };
  contentType: {
    allowedValues: ContentType[];
  };
}

/**
 * Content type specific schemas
 */
const METADATA_SCHEMAS: Record<ContentType, MetadataSchema> = {
  [ContentType.PROGRAM]: {
    title: { required: true, minLength: 1, maxLength: 200 },
    description: { maxLength: 2000 },
    duration: { min: 0, max: 86400 * 24 }, // 24 hours max
    contentType: { allowedValues: [ContentType.PROGRAM] },
  },
  [ContentType.EPISODE]: {
    title: { required: true, minLength: 1, maxLength: 200 },
    description: { maxLength: 2000 },
    duration: { min: 0, max: 86400 * 2 }, // 2 hours max
    contentType: { allowedValues: [ContentType.EPISODE] },
  },
  [ContentType.MOVIE]: {
    title: { required: true, minLength: 1, maxLength: 200 },
    description: { maxLength: 2000 },
    duration: { min: 0, max: 86400 * 4 }, // 4 hours max
    contentType: { allowedValues: [ContentType.MOVIE] },
  },
  [ContentType.SERIES]: {
    title: { required: true, minLength: 1, maxLength: 200 },
    description: { maxLength: 2000 },
    duration: { min: 0, max: 86400 * 24 }, // 24 hours max
    contentType: { allowedValues: [ContentType.SERIES] },
  },
};

/**
 * Metadata Service
 * 
 * Business logic layer for metadata operations.
 * Handles validation, versioning, and business rules.
 */
@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(private readonly metadataRepository: MetadataRepository) {}

  /**
   * Validate metadata against schema
   */
  validate(data: CreateMetadataDto | UpdateMetadataDto, contentType: ContentType): void {
    const schema = METADATA_SCHEMAS[contentType];
    if (!schema) {
      throw new BadRequestException(`Unsupported content type: ${contentType}`);
    }

    // Validate title
    if ('title' in data && data.title !== undefined) {
      if (schema.title.required && !data.title) {
        throw new BadRequestException('Title is required');
      }
      if (data.title.length < schema.title.minLength) {
        throw new BadRequestException(
          `Title must be at least ${schema.title.minLength} characters`,
        );
      }
      if (data.title.length > schema.title.maxLength) {
        throw new BadRequestException(
          `Title must not exceed ${schema.title.maxLength} characters`,
        );
      }
    }

    // Validate description
    if ('description' in data && data.description !== undefined && schema.description) {
      if (data.description.length > schema.description.maxLength) {
        throw new BadRequestException(
          `Description must not exceed ${schema.description.maxLength} characters`,
        );
      }
    }

    // Validate duration
    if ('duration' in data && data.duration !== undefined && schema.duration) {
      if (data.duration < schema.duration.min) {
        throw new BadRequestException(
          `Duration must be at least ${schema.duration.min} seconds`,
        );
      }
      if (data.duration > schema.duration.max) {
        throw new BadRequestException(
          `Duration must not exceed ${schema.duration.max} seconds`,
        );
      }
    }

    // Validate content type consistency
    if ('contentType' in data && data.contentType !== contentType) {
      throw new BadRequestException(
        `Content type mismatch: expected ${contentType}, got ${data.contentType}`,
      );
    }
  }

  /**
   * Create new metadata
   */
  async create(createDto: CreateMetadataDto): Promise<Metadata> {
    this.logger.log(`Creating metadata for content: ${createDto.contentId}`);

    // Validate metadata
    this.validate(createDto, createDto.contentType);

    // Check if metadata already exists for this content
    const existing = await this.metadataRepository.findByContentId(createDto.contentId);
    if (existing) {
      throw new ConflictException(
        `Metadata already exists for content ID: ${createDto.contentId}`,
      );
    }

    // Create metadata
    const metadata = await this.metadataRepository.create({
      title: createDto.title,
      description: createDto.description,
      category: createDto.category,
      language: createDto.language,
      duration: createDto.duration,
      publishDate: createDto.publishDate ? new Date(createDto.publishDate) : undefined,
      contentId: createDto.contentId,
      contentType: createDto.contentType,
    });

    this.logger.log(`Metadata created: ${metadata.id} (version ${metadata.version})`);
    return metadata;
  }

  /**
   * Find metadata by ID
   */
  async findOne(id: string): Promise<Metadata> {
    const metadata = await this.metadataRepository.findById(id);
    throwIfNotFound(metadata, 'Metadata', id);
    return metadata!;
  }

  /**
   * Find metadata by content ID
   */
  async findByContentId(contentId: string): Promise<Metadata> {
    const metadata = await this.metadataRepository.findByContentId(contentId);
    throwIfNotFound(metadata, 'Metadata', contentId);
    return metadata!;
  }

  /**
   * Update metadata (creates new version)
   */
  async update(id: string, updateDto: UpdateMetadataDto): Promise<Metadata> {
    this.logger.log(`Updating metadata: ${id}`);

    // Get existing metadata
    const existing = await this.findOne(id);

    // Validate update data
    this.validate(updateDto, existing.contentType);

    // Check if there are any changes
    const hasChanges =
      (updateDto.title !== undefined && updateDto.title !== existing.title) ||
      (updateDto.description !== undefined && updateDto.description !== existing.description) ||
      (updateDto.category !== undefined && updateDto.category !== existing.category) ||
      (updateDto.language !== undefined && updateDto.language !== existing.language) ||
      (updateDto.duration !== undefined && updateDto.duration !== existing.duration) ||
      (updateDto.publishDate !== undefined &&
        new Date(updateDto.publishDate).getTime() !== existing.publishDate?.getTime());

    if (!hasChanges) {
      this.logger.warn(`No changes detected for metadata: ${id}`);
      return existing;
    }

    // Update metadata (creates new version)
    const updated = await this.metadataRepository.update(id, {
      title: updateDto.title,
      description: updateDto.description,
      category: updateDto.category,
      language: updateDto.language,
      duration: updateDto.duration,
      publishDate: updateDto.publishDate ? new Date(updateDto.publishDate) : undefined,
    });

    this.logger.log(
      `Metadata updated: ${id} (version ${updated.version}, was ${existing.version})`,
    );
    return updated;
  }

  /**
   * Get version history for metadata
   */
  async getVersionHistory(metadataId: string): Promise<MetadataVersion[]> {
    // Verify metadata exists
    await this.findOne(metadataId);

    const versions = await this.metadataRepository.getVersionHistory(metadataId);
    return versions;
  }

  /**
   * Get specific version of metadata
   */
  async getVersion(metadataId: string, version: number): Promise<MetadataVersion> {
    const versionRecord = await this.metadataRepository.getVersion(metadataId, version);
    throwIfNotFound(versionRecord, 'Metadata version', `${metadataId}:${version}`);
    return versionRecord!;
  }

  /**
   * Validate metadata schema (public method for external validation)
   */
  async validateMetadata(data: CreateMetadataDto | UpdateMetadataDto): Promise<boolean> {
    const contentType = 'contentType' in data ? data.contentType : undefined;
    if (!contentType) {
      throw new BadRequestException('Content type is required for validation');
    }

    try {
      this.validate(data, contentType);
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
