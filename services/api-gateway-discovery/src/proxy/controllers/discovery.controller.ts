import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public, TimeoutInterceptor } from '@mediamesh/shared';
import { ProxyService } from '../proxy.service';
import { Request } from 'express';
import { RESILIENCE_CONFIG } from '../../config/env.constants';

/**
 * Discovery Controller
 * 
 * Routes requests to Discovery Service.
 * Base path: /api/v1/discovery
 * All endpoints are public by default.
 */
@ApiTags('Discovery')
@Controller({ path: 'discovery', version: '1' })
@UseInterceptors(
  new TimeoutInterceptor({
    timeout: RESILIENCE_CONFIG.REQUEST_TIMEOUT,
    timeoutMessage: 'Request to Discovery service timed out',
  }),
)
@Public()
export class DiscoveryController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * GET /api/v1/discovery/search
   */
  @Get('search')
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // Lower limit for search
  @ApiOperation({
    summary: 'Search content',
    description: 'Search for programs and episodes. Public endpoint.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query',
    example: 'adventure',
  })
  @ApiQuery({
    name: 'contentType',
    required: false,
    type: String,
    description: 'Filter by content type',
    example: 'PROGRAM',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    type: String,
    description: 'Filter by language',
    example: 'en',
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
    description: 'Search results',
  })
  async search(@Query() query: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/discovery/search?${queryString}` : '/discovery/search';
    return this.proxyService.proxyToDiscovery('GET', path, null, headers);
  }

  /**
   * GET /api/v1/discovery/programs
   */
  @Get('programs')
  @ApiOperation({
    summary: 'List programs',
    description: 'Retrieve a paginated list of programs. Public endpoint.',
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
    description: 'List of programs',
  })
  async getPrograms(@Query() query: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/discovery/programs?${queryString}` : '/discovery/programs';
    return this.proxyService.proxyToDiscovery('GET', path, null, headers);
  }

  /**
   * GET /api/v1/discovery/programs/:id
   */
  @Get('programs/:id')
  @ApiOperation({
    summary: 'Get program by ID',
    description: 'Retrieve detailed information about a specific program.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Program UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Program details',
  })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async getProgram(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToDiscovery('GET', `/discovery/programs/${id}`, null, headers);
  }

  /**
   * GET /api/v1/discovery/programs/:id/episodes
   */
  @Get('programs/:id/episodes')
  @ApiOperation({
    summary: 'Get episodes for program',
    description: 'Retrieve all episodes for a specific program.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Program UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of episodes',
  })
  async getEpisodes(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToDiscovery(
      'GET',
      `/discovery/programs/${id}/episodes`,
      null,
      headers,
    );
  }

  /**
   * GET /api/v1/discovery/trending
   */
  @Get('trending')
  @ApiOperation({
    summary: 'Get trending content',
    description: 'Retrieve trending programs and episodes.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Trending content',
  })
  async getTrending(@Query() query: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/discovery/trending?${queryString}` : '/discovery/trending';
    return this.proxyService.proxyToDiscovery('GET', path, null, headers);
  }

  /**
   * GET /api/v1/discovery/popular
   */
  @Get('popular')
  @ApiOperation({
    summary: 'Get popular content',
    description: 'Retrieve popular programs and episodes.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Popular content',
  })
  async getPopular(@Query() query: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/discovery/popular?${queryString}` : '/discovery/popular';
    return this.proxyService.proxyToDiscovery('GET', path, null, headers);
  }

  private getAuthHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    return headers;
  }
}
