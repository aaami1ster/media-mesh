import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EpisodeService } from '../services/episode.service';
import { Episode } from '../entities/episode.entity';
import {
  ContentStatus,
  EpisodeDto,
  PaginationDto,
} from '@mediamesh/shared';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';

/**
 * Create Episode DTO (for request body)
 */
import { IsString, IsUUID, IsInt, Min, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class CreateEpisodeDto {
  @IsUUID()
  programId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  episodeNumber: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsUUID()
  metadataId?: string;
}

/**
 * Update Episode DTO (for request body)
 */
class UpdateEpisodeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsUUID()
  metadataId?: string;
}

/**
 * Episodes Controller
 * 
 * Handles episode management endpoints:
 * - GET /programs/:programId/episodes - List episodes for a program
 * - GET /episodes/:id - Get episode by ID
 * - POST /episodes - Create new episode
 * - PUT /episodes/:id - Update episode
 * - DELETE /episodes/:id - Delete episode
 */
@ApiTags('Episodes')
@Controller()
export class EpisodesController {
  private readonly logger = new Logger(EpisodesController.name);

  constructor(private readonly episodeService: EpisodeService) {}

  /**
   * Get all episodes for a program
   * GET /programs/:programId/episodes
   */
  @Get('programs/:programId/episodes')
  @Public()
  @ApiOperation({ summary: 'Get all episodes for a program' })
  @ApiParam({ name: 'programId', type: String, description: 'Program ID' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take' })
  @ApiResponse({
    status: 200,
    description: 'List of episodes for the program',
    type: [EpisodeDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
  })
  async findAllByProgram(
    @Param('programId') programId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<EpisodeDto[]> {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;

    const episodes = await this.episodeService.findAllByProgram(programId, skipNum, takeNum);
    return episodes.map((episode) => this.toDto(episode));
  }

  /**
   * Get all episodes with pagination
   * GET /episodes
   */
  @Get('episodes')
  @Public()
  @ApiOperation({ summary: 'Get all episodes' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take' })
  @ApiQuery({ name: 'status', required: false, enum: ContentStatus, description: 'Filter by status' })
  @ApiResponse({
    status: 200,
    description: 'List of episodes',
    type: [EpisodeDto],
  })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: ContentStatus,
  ): Promise<EpisodeDto[]> {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;

    const episodes = status
      ? await this.episodeService.findByStatus(status, skipNum, takeNum)
      : await this.episodeService.findAll(skipNum, takeNum);

    return episodes.map((episode) => this.toDto(episode));
  }

  /**
   * Get episode by ID
   * GET /episodes/:id
   */
  @Get('episodes/:id')
  @Public()
  @ApiOperation({ summary: 'Get episode by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Episode ID' })
  @ApiResponse({
    status: 200,
    description: 'Episode details',
    type: EpisodeDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Episode not found',
  })
  async findOne(@Param('id') id: string): Promise<EpisodeDto> {
    const episode = await this.episodeService.findOne(id);
    return this.toDto(episode);
  }

  /**
   * Create a new episode
   * POST /episodes
   */
  @Post('episodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new episode' })
  @ApiBody({ type: CreateEpisodeDto })
  @ApiResponse({
    status: 201,
    description: 'Episode successfully created',
    type: EpisodeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Episode number already exists for this program',
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
  async create(@Body() createEpisodeDto: CreateEpisodeDto): Promise<EpisodeDto> {
    this.logger.log(`Creating episode: ${createEpisodeDto.title} for program ${createEpisodeDto.programId}`);
    const episode = await this.episodeService.create({
      programId: createEpisodeDto.programId,
      title: createEpisodeDto.title,
      description: createEpisodeDto.description,
      episodeNumber: createEpisodeDto.episodeNumber,
      duration: createEpisodeDto.duration,
      status: createEpisodeDto.status,
      metadataId: createEpisodeDto.metadataId,
    });
    return this.toDto(episode);
  }

  /**
   * Update episode
   * PUT /episodes/:id
   */
  @Put('episodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update episode' })
  @ApiParam({ name: 'id', type: String, description: 'Episode ID' })
  @ApiBody({ type: UpdateEpisodeDto })
  @ApiResponse({
    status: 200,
    description: 'Episode successfully updated',
    type: EpisodeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Episode not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Episode number already exists for this program',
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
    @Body() updateEpisodeDto: UpdateEpisodeDto,
  ): Promise<EpisodeDto> {
    this.logger.log(`Updating episode: ${id}`);
    const episode = await this.episodeService.update(id, {
      title: updateEpisodeDto.title,
      description: updateEpisodeDto.description,
      episodeNumber: updateEpisodeDto.episodeNumber,
      duration: updateEpisodeDto.duration,
      status: updateEpisodeDto.status,
      metadataId: updateEpisodeDto.metadataId,
    });
    return this.toDto(episode);
  }

  /**
   * Delete episode
   * DELETE /episodes/:id
   */
  @Delete('episodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete episode' })
  @ApiParam({ name: 'id', type: String, description: 'Episode ID' })
  @ApiResponse({
    status: 204,
    description: 'Episode successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Episode not found',
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
    this.logger.log(`Deleting episode: ${id}`);
    await this.episodeService.delete(id);
  }

  /**
   * Convert Episode entity to DTO
   */
  private toDto(episode: Episode): EpisodeDto {
    return {
      id: episode.id,
      programId: episode.programId,
      title: episode.title,
      description: episode.description,
      episodeNumber: episode.episodeNumber,
      seasonNumber: 1, // Default season number (can be extended later)
      duration: episode.duration,
      status: episode.status as any,
      createdAt: episode.createdAt.toISOString(),
      updatedAt: episode.updatedAt.toISOString(),
    } as EpisodeDto;
  }
}
