import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { SERVICE_CONFIG } from '../config/env.constants';

/**
 * Proxy Service
 * 
 * Handles HTTP requests to backend microservices.
 */
@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Proxy request to CMS service
   */
  async proxyToCms(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(SERVICE_CONFIG.CMS_SERVICE, method, path, data, headers);
  }

  /**
   * Proxy request to Metadata service
   */
  async proxyToMetadata(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(SERVICE_CONFIG.METADATA_SERVICE, method, path, data, headers);
  }

  /**
   * Proxy request to Media service
   */
  async proxyToMedia(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(SERVICE_CONFIG.MEDIA_SERVICE, method, path, data, headers);
  }

  /**
   * Proxy request to Ingest service
   */
  async proxyToIngest(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(SERVICE_CONFIG.INGEST_SERVICE, method, path, data, headers);
  }

  /**
   * Generic proxy request method
   */
  private async proxyRequest(
    baseUrl: string,
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const url = `${baseUrl}${path}`;
    const config: AxiosRequestConfig = {
      method: method.toUpperCase() as any,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(data && { data }),
      validateStatus: () => true, // Don't throw on any status
    };

    try {
      this.logger.debug(`Proxying ${method.toUpperCase()} ${url}`);

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.request(config),
      );

      // Forward the status code and response
      if (response.status >= 400) {
        throw new HttpException(
          response.data || 'Service error',
          response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Proxy error for ${method.toUpperCase()} ${url}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Service unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        error.response?.data || 'Internal server error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
