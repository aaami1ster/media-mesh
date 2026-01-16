import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@mediamesh/shared';
import { UserRole } from '@mediamesh/shared';
import { ProxyService } from '../proxy.service';
import { Request } from 'express';

/**
 * Metadata Controller
 * 
 * Routes requests to Metadata Service.
 * Base path: /api/v1/metadata
 */
@ApiTags('Metadata')
@Controller({ path: 'metadata', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MetadataController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * POST /api/v1/metadata
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Create metadata' })
  @ApiResponse({ status: 201, description: 'Metadata created' })
  async createMetadata(@Body() body: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMetadata('POST', '/metadata', body, headers);
  }

  /**
   * GET /api/v1/metadata/:id
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get metadata by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Metadata details' })
  async getMetadata(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMetadata('GET', `/metadata/${id}`, null, headers);
  }

  /**
   * GET /api/v1/metadata/content/:contentId
   */
  @Get('content/:contentId')
  @Public()
  @ApiOperation({ summary: 'Get metadata by content ID' })
  @ApiParam({ name: 'contentId', type: String })
  @ApiResponse({ status: 200, description: 'Metadata details' })
  async getMetadataByContentId(@Param('contentId') contentId: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMetadata(
      'GET',
      `/metadata/content/${contentId}`,
      null,
      headers,
    );
  }

  /**
   * PUT /api/v1/metadata/:id
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Update metadata' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Metadata updated' })
  async updateMetadata(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMetadata('PUT', `/metadata/${id}`, body, headers);
  }

  /**
   * GET /api/v1/metadata/:id/versions
   */
  @Get(':id/versions')
  @Public()
  @ApiOperation({ summary: 'Get metadata version history' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Version history' })
  async getVersionHistory(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMetadata(
      'GET',
      `/metadata/${id}/versions`,
      null,
      headers,
    );
  }

  private getAuthHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    return headers;
  }
}
