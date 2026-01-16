import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MetadataService } from '../services/metadata.service';
import { Metadata, MetadataVersion } from '../entities/metadata.entity';
import {
  MetadataDto,
  CreateMetadataDto,
  UpdateMetadataDto,
  MetadataVersionDto,
} from '../dto/metadata.dto';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';

/**
 * Metadata Controller
 * 
 * Handles metadata management endpoints:
 * - POST /metadata - Create new metadata
 * - GET /metadata/:id - Get metadata by ID
 * - GET /metadata/content/:contentId - Get metadata by content ID
 * - PUT /metadata/:id - Update metadata
 * - GET /metadata/:id/versions - Get version history
 */
@ApiTags('Metadata')
@Controller('metadata')
export class MetadataController {
  private readonly logger = new Logger(MetadataController.name);

  constructor(private readonly metadataService: MetadataService) {}

  /**
   * Create new metadata
   * POST /metadata
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new metadata' })
  @ApiBody({ type: CreateMetadataDto })
  @ApiResponse({
    status: 201,
    description: 'Metadata successfully created',
    type: MetadataDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Metadata already exists for this content',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateMetadataDto): Promise<MetadataDto> {
    this.logger.log(
      `Creating metadata for content: ${createDto.contentId} (${createDto.contentType})`,
    );
    const metadata = await this.metadataService.create(createDto);
    return this.toDto(metadata);
  }

  /**
   * Get metadata by ID
   * GET /metadata/:id
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get metadata by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Metadata ID' })
  @ApiResponse({
    status: 200,
    description: 'Metadata details',
    type: MetadataDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Metadata not found',
  })
  async findOne(@Param('id') id: string): Promise<MetadataDto> {
    const metadata = await this.metadataService.findOne(id);
    return this.toDto(metadata);
  }

  /**
   * Get metadata by content ID
   * GET /metadata/content/:contentId
   */
  @Get('content/:contentId')
  @Public()
  @ApiOperation({ summary: 'Get metadata by content ID' })
  @ApiParam({ name: 'contentId', type: String, description: 'Content ID (program/episode)' })
  @ApiResponse({
    status: 200,
    description: 'Metadata details',
    type: MetadataDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Metadata not found for this content',
  })
  async findByContentId(@Param('contentId') contentId: string): Promise<MetadataDto> {
    const metadata = await this.metadataService.findByContentId(contentId);
    return this.toDto(metadata);
  }

  /**
   * Update metadata
   * PUT /metadata/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update metadata' })
  @ApiParam({ name: 'id', type: String, description: 'Metadata ID' })
  @ApiBody({ type: UpdateMetadataDto })
  @ApiResponse({
    status: 200,
    description: 'Metadata successfully updated',
    type: MetadataDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Metadata not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMetadataDto,
  ): Promise<MetadataDto> {
    this.logger.log(`Updating metadata: ${id}`);
    const metadata = await this.metadataService.update(id, updateDto);
    return this.toDto(metadata);
  }

  /**
   * Get version history for metadata
   * GET /metadata/:id/versions
   */
  @Get(':id/versions')
  @Public()
  @ApiOperation({ summary: 'Get version history for metadata' })
  @ApiParam({ name: 'id', type: String, description: 'Metadata ID' })
  @ApiResponse({
    status: 200,
    description: 'Version history',
    type: [MetadataVersionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Metadata not found',
  })
  async getVersionHistory(@Param('id') id: string): Promise<MetadataVersionDto[]> {
    const versions = await this.metadataService.getVersionHistory(id);
    return versions.map((v) => this.versionToDto(v));
  }

  /**
   * Convert Metadata entity to DTO
   */
  private toDto(metadata: Metadata): MetadataDto {
    return {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      language: metadata.language,
      duration: metadata.duration,
      publishDate: metadata.publishDate?.toISOString(),
      contentId: metadata.contentId,
      contentType: metadata.contentType,
      version: metadata.version,
      createdAt: metadata.createdAt.toISOString(),
      updatedAt: metadata.updatedAt.toISOString(),
    } as MetadataDto;
  }

  /**
   * Convert MetadataVersion entity to DTO
   */
  private versionToDto(version: MetadataVersion): MetadataVersionDto {
    return {
      id: version.id,
      metadataId: version.metadataId,
      title: version.title,
      description: version.description,
      category: version.category,
      language: version.language,
      duration: version.duration,
      publishDate: version.publishDate?.toISOString(),
      contentId: version.contentId,
      contentType: version.contentType,
      version: version.version,
      createdAt: version.createdAt.toISOString(),
    } as MetadataVersionDto;
  }
}
