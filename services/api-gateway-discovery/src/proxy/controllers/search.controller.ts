import {
  Controller,
  Get,
  Query,
  Req,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public, TimeoutInterceptor } from '@mediamesh/shared';
import { ProxyService } from '../proxy.service';
import { Request } from 'express';
import { RESILIENCE_CONFIG, RATE_LIMIT_CONFIG } from '../../config/env.constants';
import { ThrottlerIPGuard } from '../../throttler/throttler-ip.guard';

/**
 * Search Controller
 * 
 * Routes requests to Search Service.
 * Base path: /api/v1/search
 * All endpoints are public by default.
 */
@ApiTags('Search')
@Controller({ path: 'search', version: '1' })
@UseGuards(ThrottlerIPGuard)
@UseInterceptors(
  new TimeoutInterceptor({
    timeout: RESILIENCE_CONFIG.REQUEST_TIMEOUT,
    timeoutMessage: 'Request to Search service timed out',
  }),
)
@Public()
export class SearchController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * GET /api/v1/search
   */
  @Get()
  @Throttle({
    default: {
      limit: RATE_LIMIT_CONFIG.SEARCH_LIMIT,
      ttl: RATE_LIMIT_CONFIG.SEARCH_TTL * 1000,
    },
  })
  @ApiOperation({
    summary: 'Search content',
    description: `Full-text search across programs and episodes. Public endpoint.
    
**Rate Limits:**
- IP-based: ${RATE_LIMIT_CONFIG.SEARCH_LIMIT} requests per ${RATE_LIMIT_CONFIG.SEARCH_TTL} seconds
- User-based (authenticated): ${RATE_LIMIT_CONFIG.SEARCH_LIMIT} requests per ${RATE_LIMIT_CONFIG.SEARCH_TTL} seconds

**Note:** Search operations are expensive, so rate limits are stricter than other endpoints.`,
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
    name: 'tags',
    required: false,
    type: [String],
    description: 'Filter by tags',
    example: ['action', 'adventure'],
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
    const path = queryString ? `/search?${queryString}` : '/search';
    return this.proxyService.proxyToSearch('GET', path, null, headers);
  }

  private getAuthHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    return headers;
  }
}
