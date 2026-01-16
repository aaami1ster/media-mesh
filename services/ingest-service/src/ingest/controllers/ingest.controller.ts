import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
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
import { IngestService } from '../services/ingest.service';
import { IngestJob } from '../entities/ingest-job.entity';
import {
  CreateIngestJobDto,
  IngestJobDto,
  IngestJobsQueryDto,
} from '../dto/ingest.dto';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';

/**
 * Ingest Controller
 * 
 * Handles content ingestion endpoints:
 * - POST /ingest/jobs - Create ingest job
 * - GET /ingest/jobs - List ingest jobs
 * - GET /ingest/jobs/:id - Get job status
 * - POST /ingest/jobs/:id/retry - Retry failed job
 * - DELETE /ingest/jobs/:id - Delete job
 */
@ApiTags('Ingest')
@Controller('ingest')
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  constructor(private readonly ingestService: IngestService) {}

  /**
   * Create ingest job
   * POST /ingest/jobs
   */
  @Post('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create ingest job' })
  @ApiBody({ type: CreateIngestJobDto })
  @ApiResponse({
    status: 201,
    description: 'Ingest job successfully created',
    type: IngestJobDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
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
  async createJob(@Body() createDto: CreateIngestJobDto): Promise<IngestJobDto> {
    this.logger.log(`Creating ingest job: ${createDto.sourceType} - ${createDto.sourceUrl}`);
    const job = await this.ingestService.createJob(
      createDto.sourceType,
      createDto.sourceUrl,
      createDto.metadata,
    );
    return this.toDto(job);
  }

  /**
   * Get all ingest jobs
   * GET /ingest/jobs
   */
  @Get('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List ingest jobs' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'sourceType', required: false, enum: ['YOUTUBE', 'RSS', 'API'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of ingest jobs',
  })
  async getJobs(@Query() query: IngestJobsQueryDto) {
    const result = await this.ingestService.findAll(
      query.status,
      query.sourceType,
      query.page,
      query.limit,
    );
    return {
      ...result,
      jobs: result.jobs.map((job) => this.toDto(job)),
    };
  }

  /**
   * Get ingest job by ID
   * GET /ingest/jobs/:id
   */
  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get ingest job status' })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job details',
    type: IngestJobDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJob(@Param('id') id: string): Promise<IngestJobDto> {
    const job = await this.ingestService.findOne(id);
    return this.toDto(job);
  }

  /**
   * Retry failed job
   * POST /ingest/jobs/:id/retry
   */
  @Post('jobs/:id/retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retry failed ingest job' })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job retried successfully',
    type: IngestJobDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Job cannot be retried',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  @HttpCode(HttpStatus.OK)
  async retryJob(@Param('id') id: string): Promise<IngestJobDto> {
    this.logger.log(`Retrying ingest job: ${id}`);
    const job = await this.ingestService.retryJob(id);
    return this.toDto(job);
  }

  /**
   * Delete ingest job
   * DELETE /ingest/jobs/:id
   */
  @Delete('jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete ingest job' })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiResponse({
    status: 204,
    description: 'Job successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJob(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting ingest job: ${id}`);
    await this.ingestService.delete(id);
  }

  /**
   * Convert IngestJob entity to DTO
   */
  private toDto(job: IngestJob): IngestJobDto {
    return {
      id: job.id,
      sourceType: job.sourceType,
      sourceUrl: job.sourceUrl,
      status: job.status,
      contentId: job.contentId,
      metadata: job.metadata,
      errorMessage: job.errorMessage,
      retryCount: job.retryCount,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    } as IngestJobDto;
  }
}
