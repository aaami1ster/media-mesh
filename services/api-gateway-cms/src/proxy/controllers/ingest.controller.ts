import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  TimeoutInterceptor,
} from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';
import { ProxyService } from '../proxy.service';
import { Request } from 'express';
import { RESILIENCE_CONFIG } from '../../config/env.constants';

/**
 * Ingest Controller
 * 
 * Routes requests to Ingest Service.
 * Base path: /api/v1/ingest
 */
@ApiTags('Ingest')
@Controller({ path: 'ingest', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(
  new TimeoutInterceptor({
    timeout: RESILIENCE_CONFIG.REQUEST_TIMEOUT * 2, // Longer timeout for ingest operations
    timeoutMessage: 'Request to Ingest service timed out',
  }),
)
@ApiBearerAuth('JWT-auth')
export class IngestController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * POST /api/v1/ingest/jobs
   */
  @Post('jobs')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Create ingest job' })
  @ApiResponse({ status: 201, description: 'Ingest job created' })
  async createJob(@Body() body: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToIngest('POST', '/ingest/jobs', body, headers);
  }

  /**
   * GET /api/v1/ingest/jobs
   */
  @Get('jobs')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'List ingest jobs' })
  @ApiResponse({ status: 200, description: 'List of ingest jobs' })
  async getJobs(@Query() query: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    const queryString = new URLSearchParams(query).toString();
    const path = queryString ? `/ingest/jobs?${queryString}` : '/ingest/jobs';
    return this.proxyService.proxyToIngest('GET', path, null, headers);
  }

  /**
   * GET /api/v1/ingest/jobs/:id
   */
  @Get('jobs/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get ingest job by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ingest job details' })
  async getJob(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToIngest('GET', `/ingest/jobs/${id}`, null, headers);
  }

  /**
   * POST /api/v1/ingest/jobs/:id/retry
   */
  @Post('jobs/:id/retry')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Retry ingest job' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ingest job retried' })
  async retryJob(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToIngest('POST', `/ingest/jobs/${id}/retry`, null, headers);
  }

  /**
   * DELETE /api/v1/ingest/jobs/:id
   */
  @Delete('jobs/:id')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete ingest job' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Ingest job deleted' })
  async deleteJob(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToIngest('DELETE', `/ingest/jobs/${id}`, null, headers);
  }

  private getAuthHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    return headers;
  }
}
