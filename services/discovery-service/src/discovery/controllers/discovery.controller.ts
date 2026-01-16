import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DiscoveryService } from '../services/discovery.service';
import {
  SearchQueryDto,
  ProgramsQueryDto,
  TrendingQueryDto,
  PopularQueryDto,
} from '../dto/discovery.dto';
import { Public } from '@mediamesh/shared';
import { REDIS_CONFIG } from '../../config/env.constants';

/**
 * Discovery Controller
 * 
 * Handles content discovery endpoints:
 * - GET /discovery/search - Search programs/episodes
 * - GET /discovery/programs - List programs
 * - GET /discovery/programs/:id - Get program details
 * - GET /discovery/programs/:id/episodes - Get episodes for program
 * - GET /discovery/trending - Get trending content
 * - GET /discovery/popular - Get popular content
 */
@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  private readonly logger = new Logger(DiscoveryController.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * Search programs and episodes
   * GET /discovery/search
   */
  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search programs and episodes' })
  @ApiQuery({ name: 'q', type: String, description: 'Search query' })
  @ApiQuery({ name: 'contentType', required: false, enum: ['PROGRAM', 'EPISODE'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  @Header('Cache-Control', `public, max-age=${REDIS_CONFIG.TTL.SEARCH}`)
  async search(@Query() query: SearchQueryDto) {
    const result = await this.discoveryService.search(
      query.q,
      query.contentType,
      query.page,
      query.limit,
    );
    return result;
  }

  /**
   * Get programs with pagination
   * GET /discovery/programs
   */
  @Get('programs')
  @Public()
  @ApiOperation({ summary: 'Get programs with pagination' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of programs',
  })
  @Header('Cache-Control', `public, max-age=${REDIS_CONFIG.TTL.PROGRAMS}`)
  async getPrograms(@Query() query: ProgramsQueryDto) {
    const result = await this.discoveryService.getPrograms(
      query.status,
      query.page,
      query.limit,
    );
    return result;
  }

  /**
   * Get program by ID
   * GET /discovery/programs/:id
   */
  @Get('programs/:id')
  @Public()
  @ApiOperation({ summary: 'Get program by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Program ID' })
  @ApiResponse({
    status: 200,
    description: 'Program details',
  })
  @ApiResponse({
    status: 404,
    description: 'Program not found',
  })
  @Header('Cache-Control', `public, max-age=${REDIS_CONFIG.TTL.PROGRAMS}`)
  async getProgram(@Param('id') id: string) {
    const program = await this.discoveryService.getProgram(id);
    if (!program) {
      return { statusCode: 404, message: 'Program not found' };
    }
    return program;
  }

  /**
   * Get episodes for a program
   * GET /discovery/programs/:id/episodes
   */
  @Get('programs/:id/episodes')
  @Public()
  @ApiOperation({ summary: 'Get episodes for a program' })
  @ApiParam({ name: 'id', type: String, description: 'Program ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of episodes',
  })
  @Header('Cache-Control', `public, max-age=${REDIS_CONFIG.TTL.EPISODES}`)
  async getEpisodes(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.discoveryService.getEpisodes(
      id,
      page || 1,
      limit || 20,
    );
    return result;
  }

  /**
   * Get trending content
   * GET /discovery/trending
   */
  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending content' })
  @ApiQuery({ name: 'contentType', required: false, enum: ['PROGRAM', 'EPISODE'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trending content',
  })
  @Header('Cache-Control', `public, max-age=${REDIS_CONFIG.TTL.TRENDING}`)
  async getTrending(@Query() query: TrendingQueryDto) {
    const result = await this.discoveryService.getTrending(
      query.contentType,
      query.limit,
    );
    return result;
  }

  /**
   * Get popular content
   * GET /discovery/popular
   */
  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get popular content' })
  @ApiQuery({ name: 'contentType', required: false, enum: ['PROGRAM', 'EPISODE'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Popular content',
  })
  @Header('Cache-Control', `public, max-age=${REDIS_CONFIG.TTL.POPULAR}`)
  async getPopular(@Query() query: PopularQueryDto) {
    const result = await this.discoveryService.getPopular(
      query.contentType,
      query.limit,
    );
    return result;
  }
}
