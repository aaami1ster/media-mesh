import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiProperty,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { MediaService } from '../services/media.service';
import { Media } from '../entities/media.entity';
import {
  MediaDto,
  UploadMediaDto,
  GenerateThumbnailDto,
} from '../dto/media.dto';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';
import { ContentType } from '@mediamesh/shared';

/**
 * File Upload DTO for Swagger
 */
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

/**
 * Media Controller
 * 
 * Handles media management endpoints:
 * - POST /media/upload - Upload media file
 * - GET /media/:id - Get media by ID
 * - GET /media/content/:contentId - Get media by content ID
 * - DELETE /media/:id - Delete media
 * - POST /media/:id/thumbnail - Generate thumbnail
 */
@ApiTags('Media')
@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload media file
   * POST /media/upload
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload media file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        contentId: {
          type: 'string',
          format: 'uuid',
        },
        contentType: {
          type: 'string',
          enum: ['PROGRAM', 'EPISODE', 'MOVIE', 'SERIES'],
        },
      },
      required: ['file', 'contentId', 'contentType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media successfully uploaded',
    type: MediaDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or file too large',
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
  async upload(@Req() request: FastifyRequest): Promise<MediaDto> {
    const data = await request.file();
    
    if (!data) {
      throw new Error('File is required');
    }

    // Parse form fields
    const contentId = (data.fields.contentId as any)?.value;
    const contentType = (data.fields.contentType as any)?.value;

    if (!contentId || !contentType) {
      throw new Error('contentId and contentType are required');
    }

    // Read file buffer
    const buffer = await data.toBuffer();
    const filename = data.filename || 'unknown';
    const mimeType = data.mimetype || 'application/octet-stream';

    this.logger.log(`Uploading file: ${filename} for content: ${contentId}`);

    const media = await this.mediaService.upload(
      contentId,
      contentType as ContentType,
      buffer,
      filename,
      mimeType,
    );

    return this.toDto(media);
  }

  /**
   * Get media by ID
   * GET /media/:id
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Media ID' })
  @ApiResponse({
    status: 200,
    description: 'Media details',
    type: MediaDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  async findOne(@Param('id') id: string): Promise<MediaDto> {
    const media = await this.mediaService.findOne(id);
    return this.toDto(media);
  }

  /**
   * Get media by content ID
   * GET /media/content/:contentId
   */
  @Get('content/:contentId')
  @Public()
  @ApiOperation({ summary: 'Get media by content ID' })
  @ApiParam({ name: 'contentId', type: String, description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'List of media for the content',
    type: [MediaDto],
  })
  async findByContentId(@Param('contentId') contentId: string): Promise<MediaDto[]> {
    const mediaList = await this.mediaService.findByContentId(contentId);
    return mediaList.map((media) => this.toDto(media));
  }

  /**
   * Delete media
   * DELETE /media/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete media' })
  @ApiParam({ name: 'id', type: String, description: 'Media ID' })
  @ApiResponse({
    status: 204,
    description: 'Media successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting media: ${id}`);
    await this.mediaService.delete(id);
  }

  /**
   * Generate thumbnail for media
   * POST /media/:id/thumbnail
   */
  @Post(':id/thumbnail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate thumbnail for media' })
  @ApiParam({ name: 'id', type: String, description: 'Media ID' })
  @ApiBody({ type: GenerateThumbnailDto })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail successfully generated',
    type: MediaDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Thumbnail generation not supported for this media type',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async generateThumbnail(
    @Param('id') id: string,
    @Body() thumbnailDto: GenerateThumbnailDto,
  ): Promise<MediaDto> {
    this.logger.log(`Generating thumbnail for media: ${id}`);
    const media = await this.mediaService.generateThumbnail(
      id,
      thumbnailDto.width,
      thumbnailDto.height,
    );
    return this.toDto(media);
  }

  /**
   * Convert Media entity to DTO
   */
  private toDto(media: Media): MediaDto {
    return {
      id: media.id,
      contentId: media.contentId,
      contentType: media.contentType,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      storageType: media.storageType,
      storageKey: media.storageKey,
      fileSize: Number(media.fileSize),
      mimeType: media.mimeType,
      createdAt: media.createdAt.toISOString(),
    } as MediaDto;
  }
}
