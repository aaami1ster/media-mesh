import { Injectable, Logger } from '@nestjs/common';
import { SearchRepository } from '../repositories/search.repository';
import { SearchIndex } from '../entities/search-index.entity';
import { ContentType } from '@mediamesh/shared';
import { IndexContentDto } from '../dto/search.dto';
import axios from 'axios';
import { CMS_SERVICE_CONFIG } from '../../config/env.constants';

/**
 * Search Service
 * 
 * Business logic layer for search operations.
 * Handles indexing and search functionality.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private indexingInProgress = false;

  constructor(private readonly repository: SearchRepository) {}

  /**
   * Index content
   */
  async indexContent(data: IndexContentDto): Promise<SearchIndex> {
    this.logger.log(`Indexing content: ${data.contentId} (${data.contentType})`);

    const index = await this.repository.upsert({
      contentId: data.contentId,
      contentType: data.contentType,
      title: data.title,
      description: data.description,
      category: data.category,
      language: data.language,
      tags: data.tags,
    });

    this.logger.log(`Content indexed: ${data.contentId}`);
    return index;
  }

  /**
   * Update search index
   */
  async updateIndex(
    contentId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      language?: string;
      tags?: string[];
    },
  ): Promise<SearchIndex> {
    this.logger.log(`Updating search index: ${contentId}`);

    const existing = await this.repository.findByContentId(contentId);
    if (!existing) {
      throw new Error(`Content not found in index: ${contentId}`);
    }

    const index = await this.repository.upsert({
      contentId,
      contentType: existing.contentType,
      title: data.title || existing.title,
      description: data.description !== undefined ? data.description : existing.description,
      category: data.category !== undefined ? data.category : existing.category,
      language: data.language !== undefined ? data.language : existing.language,
      tags: data.tags !== undefined ? data.tags : existing.tags,
    });

    this.logger.log(`Search index updated: ${contentId}`);
    return index;
  }

  /**
   * Delete from search index
   */
  async deleteFromIndex(contentId: string): Promise<void> {
    this.logger.log(`Deleting from search index: ${contentId}`);
    await this.repository.delete(contentId);
    this.logger.log(`Content deleted from index: ${contentId}`);
  }

  /**
   * Search content
   */
  async search(
    query: string,
    contentType?: ContentType,
    category?: string,
    language?: string,
    tags?: string[],
    page: number = 1,
    limit: number = 20,
  ): Promise<{ results: SearchIndex[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const result = await this.repository.search(
      query,
      contentType,
      category,
      language,
      tags,
      skip,
      limit,
    );

    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Reindex all content
   */
  async reindexAll(): Promise<{ indexed: number; errors: number }> {
    if (this.indexingInProgress) {
      throw new Error('Reindexing already in progress');
    }

    this.indexingInProgress = true;
    this.logger.log('Starting full reindex...');

    let indexed = 0;
    let errors = 0;

    try {
      // Fetch all programs from CMS service
      try {
        const programsResponse = await axios.get(`${CMS_SERVICE_CONFIG.BASE_URL}/programs`, {
          params: { take: 1000 },
        });

        for (const program of programsResponse.data || []) {
          try {
            await this.indexContent({
              contentId: program.id,
              contentType: ContentType.PROGRAM,
              title: program.title,
              description: program.description,
              category: undefined,
              language: undefined,
              tags: undefined,
            });
            indexed++;
          } catch (error) {
            this.logger.error(`Failed to index program ${program.id}:`, error);
            errors++;
          }
        }
      } catch (error) {
        this.logger.error('Failed to fetch programs from CMS service:', error);
        errors++;
      }

      // Fetch all episodes from CMS service
      try {
        const episodesResponse = await axios.get(`${CMS_SERVICE_CONFIG.BASE_URL}/episodes`, {
          params: { take: 1000 },
        });

        for (const episode of episodesResponse.data || []) {
          try {
            await this.indexContent({
              contentId: episode.id,
              contentType: ContentType.EPISODE,
              title: episode.title,
              description: episode.description,
              category: undefined,
              language: undefined,
              tags: undefined,
            });
            indexed++;
          } catch (error) {
            this.logger.error(`Failed to index episode ${episode.id}:`, error);
            errors++;
          }
        }
      } catch (error) {
        this.logger.error('Failed to fetch episodes from CMS service:', error);
        errors++;
      }

      this.logger.log(`Reindex completed: ${indexed} indexed, ${errors} errors`);
    } finally {
      this.indexingInProgress = false;
    }

    return { indexed, errors };
  }

  /**
   * Get indexing status
   */
  async getIndexingStatus(): Promise<{
    totalIndexed: number;
    lastIndexedAt: Date | null;
    indexingInProgress: boolean;
  }> {
    const [totalIndexed, lastIndexedAt] = await Promise.all([
      this.repository.count(),
      this.repository.getLastIndexedAt(),
    ]);

    return {
      totalIndexed,
      lastIndexedAt,
      indexingInProgress: this.indexingInProgress,
    };
  }
}
