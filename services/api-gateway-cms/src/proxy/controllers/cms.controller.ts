import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Public,
  CurrentUser,
  TimeoutInterceptor,
} from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';
import { ProxyService } from '../proxy.service';
import { Request } from 'express';
import { RESILIENCE_CONFIG } from '../../config/env.constants';
import {
  CreateProgramDto,
  UpdateProgramDto,
  CreateEpisodeDto,
  UpdateEpisodeDto,
  PaginationQueryDto,
  ProgramResponseDto,
  EpisodeResponseDto,
} from '../dto/cms.dto';

/**
 * CMS Controller
 * 
 * Routes requests to CMS Service.
 * Base path: /api/v1/cms
 * 
 * Resilience patterns applied:
 * - Timeout: Prevents hanging requests
 * - Circuit Breaker: Protects against cascading failures
 * - Retry: Exponential backoff for transient failures
 */
@ApiTags('CMS')
@Controller({ path: 'cms', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new TimeoutInterceptor({
    timeout: RESILIENCE_CONFIG.REQUEST_TIMEOUT,
    timeoutMessage: 'Request to CMS service timed out',
  }),
)
@ApiBearerAuth('JWT-auth')
export class CmsController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * GET /api/v1/cms/programs
   */
  @Get('programs')
  @Public()
  @ApiOperation({
    summary: 'List programs',
    description: 'Retrieve a paginated list of programs. Public endpoint, no authentication required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of programs retrieved successfully',
    type: [ProgramResponseDto],
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPrograms(@Query() query: PaginationQueryDto, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('GET', '/programs', null, headers);
  }

  /**
   * GET /api/v1/cms/programs/:id
   */
  @Get('programs/:id')
  @Public()
  @ApiOperation({
    summary: 'Get program by ID',
    description: 'Retrieve detailed information about a specific program by its ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Program UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Program details retrieved successfully',
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async getProgram(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('GET', `/programs/${id}`, null, headers);
  }

  /**
   * POST /api/v1/cms/programs
   */
  @Post('programs')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for admins
  @ApiOperation({
    summary: 'Create program',
    description: 'Create a new program. Requires ADMIN or EDITOR role. Rate limited to 100 requests/minute.',
  })
  @ApiBody({
    type: CreateProgramDto,
    description: 'Program data',
    examples: {
      example1: {
        summary: 'Create a draft program',
        value: {
          title: 'The Great Adventure',
          description: 'An epic adventure story',
          status: 'DRAFT',
        },
      },
      example2: {
        summary: 'Create a published program',
        value: {
          title: 'The Great Adventure',
          description: 'An epic adventure story',
          status: 'PUBLISHED',
          metadataId: '550e8400-e29b-41d4-a716-446655440001',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Program created successfully',
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 429, description: 'Too many requests - Rate limit exceeded' })
  async createProgram(
    @Body() body: CreateProgramDto,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('POST', '/programs', body, headers);
  }

  /**
   * PUT /api/v1/cms/programs/:id
   */
  @Put('programs/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Update program',
    description: 'Update an existing program. Requires ADMIN or EDITOR role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Program UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({
    type: UpdateProgramDto,
    description: 'Updated program data',
  })
  @ApiResponse({
    status: 200,
    description: 'Program updated successfully',
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async updateProgram(
    @Param('id') id: string,
    @Body() body: UpdateProgramDto,
    @Req() req: Request,
  ) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('PUT', `/programs/${id}`, body, headers);
  }

  /**
   * DELETE /api/v1/cms/programs/:id
   */
  @Delete('programs/:id')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Delete program',
    description: 'Delete a program. Requires ADMIN role. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Program UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 200, description: 'Program deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async deleteProgram(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('DELETE', `/programs/${id}`, null, headers);
  }

  /**
   * GET /api/v1/cms/episodes
   */
  @Get('episodes')
  @Public()
  @ApiOperation({
    summary: 'List episodes',
    description: 'Retrieve a list of episodes. Can be filtered by programId. Public endpoint.',
  })
  @ApiQuery({
    name: 'programId',
    required: false,
    type: String,
    description: 'Filter episodes by program ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of episodes retrieved successfully',
    type: [EpisodeResponseDto],
  })
  async getEpisodes(@Query() query: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/episodes?${queryString}` : '/episodes';
    return this.proxyService.proxyToCms('GET', path, null, headers);
  }

  /**
   * GET /api/v1/cms/episodes/:id
   */
  @Get('episodes/:id')
  @Public()
  @ApiOperation({
    summary: 'Get episode by ID',
    description: 'Retrieve detailed information about a specific episode by its ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Episode UUID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @ApiResponse({
    status: 200,
    description: 'Episode details retrieved successfully',
    type: EpisodeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async getEpisode(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('GET', `/episodes/${id}`, null, headers);
  }

  /**
   * POST /api/v1/cms/episodes
   */
  @Post('episodes')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create episode',
    description: 'Create a new episode for a program. Requires ADMIN or EDITOR role.',
  })
  @ApiBody({
    type: CreateEpisodeDto,
    description: 'Episode data',
    examples: {
      example1: {
        summary: 'Create a basic episode',
        value: {
          programId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Episode 1: The Beginning',
          episodeNumber: 1,
          duration: 3600,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Episode created successfully',
    type: EpisodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createEpisode(@Body() body: CreateEpisodeDto, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('POST', '/episodes', body, headers);
  }

  /**
   * PUT /api/v1/cms/episodes/:id
   */
  @Put('episodes/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Update episode',
    description: 'Update an existing episode. Requires ADMIN or EDITOR role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Episode UUID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @ApiBody({ type: UpdateEpisodeDto, description: 'Updated episode data' })
  @ApiResponse({
    status: 200,
    description: 'Episode updated successfully',
    type: EpisodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async updateEpisode(
    @Param('id') id: string,
    @Body() body: UpdateEpisodeDto,
    @Req() req: Request,
  ) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('PUT', `/episodes/${id}`, body, headers);
  }

  /**
   * DELETE /api/v1/cms/episodes/:id
   */
  @Delete('episodes/:id')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Delete episode',
    description: 'Delete an episode. Requires ADMIN role. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Episode UUID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @ApiResponse({ status: 200, description: 'Episode deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async deleteEpisode(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('DELETE', `/episodes/${id}`, null, headers);
  }

  /**
   * Extract authorization headers from request
   */
  private getAuthHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    return headers;
  }
}
