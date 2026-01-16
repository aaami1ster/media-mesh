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
 * Media Controller
 * 
 * Routes requests to Media Service.
 * Base path: /api/v1/media
 */
@ApiTags('Media')
@Controller({ path: 'media', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MediaController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * POST /api/v1/media/upload
   */
  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // Lower limit for file uploads
  @ApiOperation({ summary: 'Upload media file' })
  @ApiResponse({ status: 201, description: 'Media uploaded' })
  async uploadMedia(@Body() body: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMedia('POST', '/media/upload', body, headers);
  }

  /**
   * GET /api/v1/media/:id
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Media details' })
  async getMedia(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMedia('GET', `/media/${id}`, null, headers);
  }

  /**
   * GET /api/v1/media/content/:contentId
   */
  @Get('content/:contentId')
  @Public()
  @ApiOperation({ summary: 'Get media by content ID' })
  @ApiParam({ name: 'contentId', type: String })
  @ApiResponse({ status: 200, description: 'Media details' })
  async getMediaByContentId(@Param('contentId') contentId: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMedia(
      'GET',
      `/media/content/${contentId}`,
      null,
      headers,
    );
  }

  /**
   * DELETE /api/v1/media/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete media' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Media deleted' })
  async deleteMedia(@Param('id') id: string, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMedia('DELETE', `/media/${id}`, null, headers);
  }

  /**
   * POST /api/v1/media/:id/thumbnail
   */
  @Post(':id/thumbnail')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate thumbnail' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Thumbnail generated' })
  async generateThumbnail(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const headers = this.getAuthHeaders(req);
    return this.proxyService.proxyToMedia(
      'POST',
      `/media/${id}/thumbnail`,
      body,
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
