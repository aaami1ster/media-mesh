import { Injectable, Logger } from '@nestjs/common';
import { SearchRepository } from '../repositories/search.repository';
import { DynamoDBSearchRepository } from '../repositories/dynamodb-search.repository';
import { SearchIndex } from '../entities/search-index.entity';
import { ContentType } from '@mediamesh/shared';
import { IndexContentDto } from '../dto/search.dto';
import axios from 'axios';
import { CMS_SERVICE_CONFIG, DYNAMODB_CONFIG } from '../../config/env.constants';

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

  constructor(
    private readonly repository: SearchRepository,
    private readonly dynamoDBRepository: DynamoDBSearchRepository,
  ) {}

  /**
   * Index content
   * 
   * Writes to both DynamoDB (primary) and PostgreSQL (fallback)
   */
  async indexContent(data: IndexContentDto): Promise<SearchIndex> {
    this.logger.log(`Indexing content: ${data.contentId} (${data.contentType})`);

    // Try DynamoDB first
    let index: SearchIndex | null = null;
    if (DYNAMODB_CONFIG.ENABLED) {
      index = await this.dynamoDBRepository.upsert({
        contentId: data.contentId,
        contentType: data.contentType,
        title: data.title,
        description: data.description,
        category: data.category,
        language: data.language,
        tags: data.tags,
      });
    }

    // Fallback to PostgreSQL if DynamoDB failed or disabled
    if (!index) {
      index = await this.repository.upsert({
        contentId: data.contentId,
        contentType: data.contentType,
        title: data.title,
        description: data.description,
        category: data.category,
        language: data.language,
        tags: data.tags,
      });
    }

    this.logger.log(`Content indexed: ${data.contentId}`);
    return index;
  }

  /**
   * Update search index
   * 
   * Updates both DynamoDB and PostgreSQL
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

    // Try DynamoDB first
    let existing: SearchIndex | null = null;
    if (DYNAMODB_CONFIG.ENABLED) {
      existing = await this.dynamoDBRepository.findByContentId(contentId);
    }

    // Fallback to PostgreSQL
    if (!existing) {
      existing = await this.repository.findByContentId(contentId);
    }

    if (!existing) {
      throw new Error(`Content not found in index: ${contentId}`);
    }

    const updateData = {
      contentId,
      contentType: existing.contentType,
      title: data.title || existing.title,
      description: data.description !== undefined ? data.description : existing.description,
      category: data.category !== undefined ? data.category : existing.category,
      language: data.language !== undefined ? data.language : existing.language,
      tags: data.tags !== undefined ? data.tags : existing.tags,
    };

    // Update DynamoDB
    let index: SearchIndex | null = null;
    if (DYNAMODB_CONFIG.ENABLED) {
      index = await this.dynamoDBRepository.upsert(updateData);
    }

    // Update PostgreSQL (always, as fallback)
    if (!index) {
      index = await this.repository.upsert(updateData);
    }

    this.logger.log(`Search index updated: ${contentId}`);
    return index;
  }

  /**
   * Delete from search index
   * 
   * Deletes from both DynamoDB and PostgreSQL
   */
  async deleteFromIndex(contentId: string): Promise<void> {
    this.logger.log(`Deleting from search index: ${contentId}`);

    // Delete from DynamoDB
    if (DYNAMODB_CONFIG.ENABLED) {
      await this.dynamoDBRepository.delete(contentId);
    }

    // Delete from PostgreSQL
    await this.repository.delete(contentId);

    this.logger.log(`Content deleted from index: ${contentId}`);
  }

  /**
   * Search content
   * 
   * Cache-aside pattern: DynamoDB → PostgreSQL
   * Note: DynamoDB search is limited - for production, use OpenSearch/Elasticsearch
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

    // Try DynamoDB first (for simple queries)
    if (DYNAMODB_CONFIG.ENABLED && query && query.length < 50) {
      // DynamoDB is better for simple queries
      const dynamoResult = await this.dynamoDBRepository.search(
        query,
        contentType,
        category,
        language,
        tags,
        limit,
      );

      if (dynamoResult.results.length > 0) {
        this.logger.debug(`DynamoDB search returned ${dynamoResult.results.length} results`);
        // Apply pagination
        const paginated = dynamoResult.results.slice(skip, skip + limit);
        return {
          results: paginated,
          total: dynamoResult.total,
          page,
          limit,
        };
      }
    }

    // Fallback to PostgreSQL (better for complex full-text search)
    this.logger.debug('Using PostgreSQL for search (fallback or complex query)');
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
   * 
   * Indexes to both DynamoDB and PostgreSQL
   */
  async reindexAll(): Promise<{ indexed: number; errors: number }> {
    if (this.indexingInProgress) {
      throw new Error('Reindexing already in progress');
    }

    this.indexingInProgress = true;
    this.logger.log('Starting full reindex...');

    let indexed = 0;
    let errors = 0;
    const itemsToBatch: SearchIndex[] = [];

    try {
      // Fetch all programs from CMS service
      try {
        const programsResponse = await axios.get(`${CMS_SERVICE_CONFIG.BASE_URL}/programs`, {
          params: { take: 1000 },
        });

        for (const program of programsResponse.data || []) {
          try {
            const index = await this.indexContent({
              contentId: program.id,
              contentType: ContentType.PROGRAM,
              title: program.title,
              description: program.description,
              category: undefined,
              language: undefined,
              tags: undefined,
            });
            itemsToBatch.push(index);
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
            const index = await this.indexContent({
              contentId: episode.id,
              contentType: ContentType.EPISODE,
              title: episode.title,
              description: episode.description,
              category: undefined,
              language: undefined,
              tags: undefined,
            });
            itemsToBatch.push(index);
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

      // Batch write to DynamoDB if enabled
      if (DYNAMODB_CONFIG.ENABLED && itemsToBatch.length > 0) {
        await this.dynamoDBRepository.batchWrite(itemsToBatch);
        this.logger.log(`Batch wrote ${itemsToBatch.length} items to DynamoDB`);
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
