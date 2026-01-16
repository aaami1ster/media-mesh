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
  @ApiOperation({ summary: 'List programs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of programs' })
  async getPrograms(@Query() query: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('GET', '/programs', null, headers);
  }

  /**
   * GET /api/v1/cms/programs/:id
   */
  @Get('programs/:id')
  @Public()
  @ApiOperation({ summary: 'Get program by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Program details' })
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
  @ApiOperation({ summary: 'Create program' })
  @ApiResponse({ status: 201, description: 'Program created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createProgram(@Body() body: any, @Req() req: Request, @CurrentUser() user: any) {
    const headers = this.getAuthHeaders(req);
    // Apply role-based rate limiting
    if (user?.role === UserRole.ADMIN) {
      // Admin limit already set via decorator
    } else if (user?.role === UserRole.EDITOR) {
      // Editor limit would be applied via custom guard
    }
    return this.proxyService.proxyToCms('POST', '/programs', body, headers);
  }

  /**
   * PUT /api/v1/cms/programs/:id
   */
  @Put('programs/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Update program' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Program updated' })
  async updateProgram(
    @Param('id') id: string,
    @Body() body: any,
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
  @ApiOperation({ summary: 'Delete program' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Program deleted' })
  async deleteProgram(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('DELETE', `/programs/${id}`, null, headers);
  }

  /**
   * GET /api/v1/cms/episodes
   */
  @Get('episodes')
  @Public()
  @ApiOperation({ summary: 'List episodes' })
  @ApiQuery({ name: 'programId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of episodes' })
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
  @ApiOperation({ summary: 'Get episode by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Episode details' })
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
  @ApiOperation({ summary: 'Create episode' })
  @ApiResponse({ status: 201, description: 'Episode created' })
  async createEpisode(@Body() body: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToCms('POST', '/episodes', body, headers);
  }

  /**
   * PUT /api/v1/cms/episodes/:id
   */
  @Put('episodes/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Update episode' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Episode updated' })
  async updateEpisode(
    @Param('id') id: string,
    @Body() body: any,
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
  @ApiOperation({ summary: 'Delete episode' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Episode deleted' })
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
