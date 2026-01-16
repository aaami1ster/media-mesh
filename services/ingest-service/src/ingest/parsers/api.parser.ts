import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * API Parser
 * 
 * Fetches content from external APIs.
 */
@Injectable()
export class APIParser {
  private readonly logger = new Logger(APIParser.name);
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'MediaMesh-Ingest-Service/1.0',
      },
    });
  }

  /**
   * Fetch content from API endpoint
   */
  async fetchFromAPI(apiUrl: string, options?: {
    method?: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    body?: any;
  }): Promise<any> {
    try {
      const config: any = {
        url: apiUrl,
        method: options?.method || 'GET',
        headers: options?.headers || {},
        params: options?.params,
      };

      if (options?.body) {
        config.data = options.body;
      }

      const response = await this.httpClient.request(config);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch from API: ${apiUrl}`, error);
      
      if (error.response) {
        throw new BadRequestException(
          `API request failed: ${error.response.status} ${error.response.statusText}`,
        );
      } else if (error.request) {
        throw new BadRequestException('API request timeout or network error');
      } else {
        throw new BadRequestException(`API request error: ${error.message}`);
      }
    }
  }

  /**
   * Normalize API response to internal format
   */
  normalizeAPIResponse(data: any, mapping?: Record<string, string>): any {
    if (!mapping) {
      return data;
    }

    const normalized: any = {};
    for (const [key, value] of Object.entries(mapping)) {
      if (data[value]) {
        normalized[key] = data[value];
      }
    }

    return normalized;
  }
}
