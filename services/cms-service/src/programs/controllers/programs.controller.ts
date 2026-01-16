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
import { ProgramService } from '../services/program.service';
import { Program } from '../entities/program.entity';
import {
  ContentStatus,
  ProgramDto,
  CreateProgramDto,
  UpdateProgramDto,
  PaginationDto,
  PaginatedResponseDto,
} from '@mediamesh/shared';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, Public } from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';

/**
 * Programs Controller
 * 
 * Handles program management endpoints:
 * - GET /programs - List all programs
 * - GET /programs/:id - Get program by ID
 * - POST /programs - Create new program
 * - PUT /programs/:id - Update program
 * - DELETE /programs/:id - Delete program
 * - POST /programs/:id/publish - Publish program
 * - POST /programs/:id/unpublish - Unpublish program
 */
@ApiTags('Programs')
@Controller('programs')
export class ProgramsController {
  private readonly logger = new Logger(ProgramsController.name);

  constructor(private readonly programService: ProgramService) {}

  /**
   * Get all programs with pagination
   * GET /programs
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all programs' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take' })
  @ApiQuery({ name: 'status', required: false, enum: ContentStatus, description: 'Filter by status' })
  @ApiResponse({
    status: 200,
    description: 'List of programs',
    type: [ProgramDto],
  })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: ContentStatus,
  ): Promise<ProgramDto[]> {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;

    const programs = status
      ? await this.programService.findByStatus(status, skipNum, takeNum)
      : await this.programService.findAll(skipNum, takeNum);

    return programs.map((program) => this.toDto(program));
  }

  /**
   * Get program by ID
   * GET /programs/:id
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get program by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Program ID' })
  @ApiResponse({
    status: 200,
    description: 'Program details',
    type: ProgramDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
  })
  async findOne(@Param('id') id: string): Promise<ProgramDto> {
    const program = await this.programService.findOne(id);
    return this.toDto(program);
  }

  /**
   * Create a new program
   * POST /programs
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new program' })
  @ApiBody({ type: CreateProgramDto })
  @ApiResponse({
    status: 201,
    description: 'Program successfully created',
    type: ProgramDto,
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
  async create(@Body() createProgramDto: CreateProgramDto): Promise<ProgramDto> {
    this.logger.log(`Creating program: ${createProgramDto.title}`);
    const program = await this.programService.create({
      title: createProgramDto.title,
      description: createProgramDto.description,
      status: createProgramDto.status || ContentStatus.DRAFT,
    });
    return this.toDto(program);
  }

  /**
   * Update program
   * PUT /programs/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update program' })
  @ApiParam({ name: 'id', type: String, description: 'Program ID' })
  @ApiBody({ type: UpdateProgramDto })
  @ApiResponse({
    status: 200,
    description: 'Program successfully updated',
    type: ProgramDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
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
    @Body() updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramDto> {
    this.logger.log(`Updating program: ${id}`);
    const program = await this.programService.update(id, {
      title: updateProgramDto.title,
      description: updateProgramDto.description,
      status: updateProgramDto.status,
    });
    return this.toDto(program);
  }

  /**
   * Delete program
   * DELETE /programs/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete program' })
  @ApiParam({ name: 'id', type: String, description: 'Program ID' })
  @ApiResponse({
    status: 204,
    description: 'Program successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
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
    this.logger.log(`Deleting program: ${id}`);
    await this.programService.delete(id);
  }

  /**
   * Publish program
   * POST /programs/:id/publish
   */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish program (DRAFT -> PUBLISHED)' })
  @ApiParam({ name: 'id', type: String, description: 'Program ID' })
  @ApiResponse({
    status: 200,
    description: 'Program successfully published',
    type: ProgramDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Program already published',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async publish(@Param('id') id: string): Promise<ProgramDto> {
    this.logger.log(`Publishing program: ${id}`);
    const program = await this.programService.publish(id);
    return this.toDto(program);
  }

  /**
   * Unpublish program
   * POST /programs/:id/unpublish
   */
  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish program (PUBLISHED -> DRAFT)' })
  @ApiParam({ name: 'id', type: String, description: 'Program ID' })
  @ApiResponse({
    status: 200,
    description: 'Program successfully unpublished',
    type: ProgramDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Program already in draft status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async unpublish(@Param('id') id: string): Promise<ProgramDto> {
    this.logger.log(`Unpublishing program: ${id}`);
    const program = await this.programService.unpublish(id);
    return this.toDto(program);
  }

  /**
   * Convert Program entity to DTO
   */
  private toDto(program: Program): ProgramDto {
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      contentType: 'PROGRAM' as any, // Default for CMS programs
      status: program.status as any,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    } as ProgramDto;
  }
}
