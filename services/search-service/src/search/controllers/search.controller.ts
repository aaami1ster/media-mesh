import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import {
  SearchQueryDto,
  IndexContentDto,
  SearchResultDto,
  IndexStatusDto,
} from '../dto/search.dto';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';

/**
 * Search Controller
 * 
 * Handles search and indexing endpoints:
 * - POST /search/index - Manually trigger indexing
 * - GET /search/status - Get indexing status
 * - POST /search/reindex - Reindex all content
 * - GET /search - Search content (public)
 */
@ApiTags('Search')
@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  /**
   * Search content
   * GET /search
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Search content' })
  @ApiQuery({ name: 'q', type: String, description: 'Search query' })
  @ApiQuery({ name: 'contentType', required: false, enum: ['PROGRAM', 'EPISODE', 'MOVIE', 'SERIES'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: SearchResultDto,
  })
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto> {
    const result = await this.searchService.search(
      query.q,
      query.contentType,
      query.category,
      query.language,
      query.tags,
      query.page,
      query.limit,
    );
    return result;
  }

  /**
   * Manually index content
   * POST /search/index
   */
  @Post('index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger content indexing' })
  @ApiBody({ type: IndexContentDto })
  @ApiResponse({
    status: 201,
    description: 'Content successfully indexed',
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
  async indexContent(@Body() indexDto: IndexContentDto) {
    this.logger.log(`Manually indexing content: ${indexDto.contentId}`);
    const index = await this.searchService.indexContent(indexDto);
    return index;
  }

  /**
   * Get indexing status
   * GET /search/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get indexing status' })
  @ApiResponse({
    status: 200,
    description: 'Indexing status',
    type: IndexStatusDto,
  })
  async getStatus(): Promise<IndexStatusDto> {
    const status = await this.searchService.getIndexingStatus();
    return {
      totalIndexed: status.totalIndexed,
      lastIndexedAt: status.lastIndexedAt?.toISOString() || null,
      indexingInProgress: status.indexingInProgress,
    };
  }

  /**
   * Reindex all content
   * POST /search/reindex
   */
  @Post('reindex')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reindex all content' })
  @ApiResponse({
    status: 200,
    description: 'Reindexing started',
  })
  @ApiResponse({
    status: 400,
    description: 'Reindexing already in progress',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  @HttpCode(HttpStatus.OK)
  async reindexAll() {
    this.logger.log('Starting full reindex...');
    const result = await this.searchService.reindexAll();
    return result;
  }
}
