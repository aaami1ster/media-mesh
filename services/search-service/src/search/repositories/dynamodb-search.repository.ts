import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DynamoDBService } from '@mediamesh/shared';
import { DYNAMODB_CONFIG } from '../../config/env.constants';
import { ContentType } from '@mediamesh/shared';
import { SearchIndex } from '../entities/search-index.entity';

/**
 * DynamoDB Search Repository
 * 
 * Handles search indexes in DynamoDB with TTL support.
 * Implements cache-aside pattern with PostgreSQL fallback.
 */
@Injectable()
export class DynamoDBSearchRepository implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBSearchRepository.name);
  private readonly searchIndexTable: string;
  private readonly ttlAttribute: string;
  private readonly defaultTtl: number;

  constructor(private readonly dynamoDB: DynamoDBService) {
    this.searchIndexTable = DYNAMODB_CONFIG.TABLES.SEARCH_INDEX;
    this.ttlAttribute = DYNAMODB_CONFIG.TTL_ATTRIBUTE;
    this.defaultTtl = DYNAMODB_CONFIG.TTL_SECONDS;
  }

  async onModuleInit() {
    if (!DYNAMODB_CONFIG.ENABLED) {
      this.logger.log('DynamoDB is disabled, skipping table creation');
      return;
    }

    try {
      // Create search index table with GSI for contentType and category
      await this.dynamoDB.ensureTable(
        this.searchIndexTable,
        'contentId', // Partition key
        undefined, // No sort key
        [
          {
            indexName: 'contentType-index',
            partitionKey: 'contentType',
          },
          {
            indexName: 'category-index',
            partitionKey: 'category',
          },
        ],
        this.ttlAttribute, // TTL attribute
      );

      this.logger.log('DynamoDB search index table initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize DynamoDB search table. Service will continue without DynamoDB support:', error.message || error);
      this.logger.warn('DynamoDB features will be disabled. Service will use PostgreSQL only.');
      // Don't throw - allow service to start without DynamoDB
      // DynamoDB is optional for search indexing
    }
  }

  /**
   * Upsert search index in DynamoDB
   */
  async upsert(data: {
    contentId: string;
    contentType: ContentType;
    title: string;
    description?: string;
    category?: string;
    language?: string;
    tags?: string[];
  }): Promise<SearchIndex | null> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return null;
    }

    try {
      const now = new Date();
      const item = {
        contentId: data.contentId,
        contentType: data.contentType,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        language: data.language || null,
        tags: data.tags || [],
        indexedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await this.dynamoDB.putItem(this.searchIndexTable, item, this.defaultTtl);

      this.logger.debug(`Indexed content in DynamoDB: ${data.contentId}`);
      return new SearchIndex({
        id: data.contentId, // Use contentId as ID for DynamoDB
        contentId: item.contentId,
        contentType: item.contentType,
        title: item.title,
        description: item.description ?? undefined,
        category: item.category ?? undefined,
        language: item.language ?? undefined,
        tags: item.tags,
        indexedAt: now,
        updatedAt: now,
      });
    } catch (error) {
      this.logger.error('Failed to upsert in DynamoDB:', error);
      return null; // Fallback to PostgreSQL
    }
  }

  /**
   * Get search index by content ID from DynamoDB
   */
  async findByContentId(contentId: string): Promise<SearchIndex | null> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return null;
    }

    try {
      const item = await this.dynamoDB.getItem(this.searchIndexTable, {
        contentId,
      });

      if (!item) {
        return null;
      }

      return new SearchIndex({
        id: item.contentId,
        contentId: item.contentId,
        contentType: item.contentType as ContentType,
        title: item.title,
        description: item.description || undefined,
        category: item.category || undefined,
        language: item.language || undefined,
        tags: item.tags || [],
        indexedAt: new Date(item.indexedAt),
        updatedAt: new Date(item.updatedAt),
      });
    } catch (error) {
      this.logger.error('Failed to get from DynamoDB:', error);
      return null; // Fallback to PostgreSQL
    }
  }

  /**
   * Search in DynamoDB
   * Note: DynamoDB doesn't support full-text search natively
   * This is a simple implementation - for production, use OpenSearch/Elasticsearch
   */
  async search(
    query: string,
    contentType?: ContentType,
    category?: string,
    language?: string,
    tags?: string[],
    limit: number = 20,
  ): Promise<{ results: SearchIndex[]; total: number }> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return { results: [], total: 0 };
    }

    try {
      let items: any[] = [];

      // Query by contentType if provided
      if (contentType) {
        items = await this.dynamoDB.query(
          this.searchIndexTable,
          'contentType = :contentType',
          { ':contentType': contentType },
          'contentType-index',
          undefined,
          limit * 2, // Get more to filter
        );
      } else {
        // Scan if no contentType filter
        items = await this.dynamoDB.scan(
          this.searchIndexTable,
          undefined,
          undefined,
          limit * 2,
        );
      }

      // Client-side filtering (for production, use OpenSearch)
      let filtered = items;

      if (query) {
        const queryLower = query.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title?.toLowerCase().includes(queryLower) ||
            item.description?.toLowerCase().includes(queryLower),
        );
      }

      if (category) {
        filtered = filtered.filter((item) => item.category === category);
      }

      if (language) {
        filtered = filtered.filter((item) => item.language === language);
      }

      if (tags && tags.length > 0) {
        filtered = filtered.filter((item) =>
          tags.some((tag) => item.tags?.includes(tag)),
        );
      }

      // Limit results
      const limited = filtered.slice(0, limit);

      const results = limited.map(
        (item) =>
          new SearchIndex({
            id: item.contentId,
            contentId: item.contentId,
            contentType: item.contentType as ContentType,
            title: item.title,
            description: item.description || undefined,
            category: item.category || undefined,
            language: item.language || undefined,
            tags: item.tags || [],
            indexedAt: new Date(item.indexedAt),
            updatedAt: new Date(item.updatedAt),
          }),
      );

      return {
        results,
        total: filtered.length, // Approximate total
      };
    } catch (error) {
      this.logger.error('Failed to search in DynamoDB:', error);
      return { results: [], total: 0 }; // Fallback to PostgreSQL
    }
  }

  /**
   * Delete from DynamoDB
   */
  async delete(contentId: string): Promise<void> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return;
    }

    try {
      await this.dynamoDB.deleteItem(this.searchIndexTable, { contentId });
      this.logger.debug(`Deleted from DynamoDB: ${contentId}`);
    } catch (error) {
      this.logger.error('Failed to delete from DynamoDB:', error);
      // Don't throw - fallback to PostgreSQL
    }
  }

  /**
   * Batch write to DynamoDB
   */
  async batchWrite(items: SearchIndex[]): Promise<void> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return;
    }

    try {
      const dynamoItems = items.map((item) => ({
        contentId: item.contentId,
        contentType: item.contentType,
        title: item.title,
        description: item.description || null,
        category: item.category || null,
        language: item.language || null,
        tags: item.tags || [],
        indexedAt: item.indexedAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));

      await this.dynamoDB.batchWrite(
        this.searchIndexTable,
        dynamoItems,
        this.defaultTtl,
      );

      this.logger.debug(`Batch wrote ${items.length} items to DynamoDB`);
    } catch (error) {
      this.logger.error('Failed to batch write to DynamoDB:', error);
      // Don't throw - fallback to PostgreSQL
    }
  }
}
