import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DynamoDBService } from '@mediamesh/shared';
import { DYNAMODB_CONFIG, REDIS_CONFIG } from '../../config/env.constants';
import { ContentType } from '@mediamesh/shared';

/**
 * DynamoDB Discovery Repository
 * 
 * Handles hot data (trending, popular) in DynamoDB with TTL support.
 * Implements cache-aside pattern with PostgreSQL fallback.
 */
@Injectable()
export class DynamoDBDiscoveryRepository implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBDiscoveryRepository.name);
  private readonly trendingTable: string;
  private readonly popularTable: string;
  private readonly ttlAttribute: string;

  constructor(private readonly dynamoDB: DynamoDBService) {
    this.trendingTable = DYNAMODB_CONFIG.TABLES.TRENDING;
    this.popularTable = DYNAMODB_CONFIG.TABLES.POPULAR;
    this.ttlAttribute = DYNAMODB_CONFIG.TTL_ATTRIBUTE;
  }

  async onModuleInit() {
    if (!DYNAMODB_CONFIG.ENABLED) {
      this.logger.log('DynamoDB is disabled, skipping table creation');
      return;
    }

    try {
      // Create trending table
      await this.dynamoDB.ensureTable(
        this.trendingTable,
        'contentType', // Partition key
        'rank', // Sort key (for ordering)
        undefined, // No GSI
        this.ttlAttribute, // TTL attribute
      );

      // Create popular table
      await this.dynamoDB.ensureTable(
        this.popularTable,
        'contentType', // Partition key
        'rank', // Sort key (for ordering)
        undefined, // No GSI
        this.ttlAttribute, // TTL attribute
      );

      this.logger.log('DynamoDB tables initialized');
    } catch (error) {
      this.logger.error('Failed to initialize DynamoDB tables:', error);
      throw error;
    }
  }

  /**
   * Store trending content in DynamoDB
   */
  async storeTrending(
    contentType: ContentType | 'all',
    items: any[],
    ttlSeconds: number = REDIS_CONFIG.TTL.TRENDING,
  ): Promise<void> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return;
    }

    try {
      // Delete existing items for this contentType
      const existing = await this.dynamoDB.query(
        this.trendingTable,
        'contentType = :contentType',
        { ':contentType': contentType },
      );

      // Delete old items
      await Promise.all(
        existing.map((item) =>
          this.dynamoDB.deleteItem(this.trendingTable, {
            contentType: item.contentType,
            rank: item.rank,
          }),
        ),
      );

      // Store new items with rank
      await Promise.all(
        items.map((item, index) =>
          this.dynamoDB.putItem(
            this.trendingTable,
            {
              contentType,
              rank: index + 1,
              programId: item.id,
              title: item.title,
              description: item.description,
              category: item.category,
              language: item.language,
              status: item.status,
              createdAt: item.createdAt?.toISOString(),
              updatedAt: item.updatedAt?.toISOString(),
              data: JSON.stringify(item), // Store full object
            },
            ttlSeconds,
          ),
        ),
      );

      this.logger.debug(`Stored ${items.length} trending items for ${contentType}`);
    } catch (error) {
      this.logger.error('Failed to store trending in DynamoDB:', error);
      // Don't throw - fallback to PostgreSQL
    }
  }

  /**
   * Get trending content from DynamoDB
   */
  async getTrending(
    contentType: ContentType | 'all',
    limit: number = 10,
  ): Promise<any[] | null> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return null;
    }

    try {
      const items = await this.dynamoDB.query(
        this.trendingTable,
        'contentType = :contentType',
        { ':contentType': contentType },
        undefined, // No index
        undefined, // No filter
        limit,
      );

      if (items.length === 0) {
        return null;
      }

      // Sort by rank and parse data
      const sorted = items
        .sort((a, b) => a.rank - b.rank)
        .map((item) => {
          try {
            return JSON.parse(item.data);
          } catch {
            // Fallback to reconstructing from fields
            return {
              id: item.programId,
              title: item.title,
              description: item.description,
              category: item.category,
              language: item.language,
              status: item.status,
              createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
            };
          }
        });

      this.logger.debug(`Retrieved ${sorted.length} trending items from DynamoDB`);
      return sorted;
    } catch (error) {
      this.logger.error('Failed to get trending from DynamoDB:', error);
      return null; // Fallback to PostgreSQL
    }
  }

  /**
   * Store popular content in DynamoDB
   */
  async storePopular(
    contentType: ContentType | 'all',
    items: any[],
    ttlSeconds: number = REDIS_CONFIG.TTL.POPULAR,
  ): Promise<void> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return;
    }

    try {
      // Delete existing items for this contentType
      const existing = await this.dynamoDB.query(
        this.popularTable,
        'contentType = :contentType',
        { ':contentType': contentType },
      );

      // Delete old items
      await Promise.all(
        existing.map((item) =>
          this.dynamoDB.deleteItem(this.popularTable, {
            contentType: item.contentType,
            rank: item.rank,
          }),
        ),
      );

      // Store new items with rank
      await Promise.all(
        items.map((item, index) =>
          this.dynamoDB.putItem(
            this.popularTable,
            {
              contentType,
              rank: index + 1,
              programId: item.id,
              title: item.title,
              description: item.description,
              category: item.category,
              language: item.language,
              status: item.status,
              createdAt: item.createdAt?.toISOString(),
              updatedAt: item.updatedAt?.toISOString(),
              data: JSON.stringify(item), // Store full object
            },
            ttlSeconds,
          ),
        ),
      );

      this.logger.debug(`Stored ${items.length} popular items for ${contentType}`);
    } catch (error) {
      this.logger.error('Failed to store popular in DynamoDB:', error);
      // Don't throw - fallback to PostgreSQL
    }
  }

  /**
   * Get popular content from DynamoDB
   */
  async getPopular(
    contentType: ContentType | 'all',
    limit: number = 10,
  ): Promise<any[] | null> {
    if (!DYNAMODB_CONFIG.ENABLED) {
      return null;
    }

    try {
      const items = await this.dynamoDB.query(
        this.popularTable,
        'contentType = :contentType',
        { ':contentType': contentType },
        undefined, // No index
        undefined, // No filter
        limit,
      );

      if (items.length === 0) {
        return null;
      }

      // Sort by rank and parse data
      const sorted = items
        .sort((a, b) => a.rank - b.rank)
        .map((item) => {
          try {
            return JSON.parse(item.data);
          } catch {
            // Fallback to reconstructing from fields
            return {
              id: item.programId,
              title: item.title,
              description: item.description,
              category: item.category,
              language: item.language,
              status: item.status,
              createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
            };
          }
        });

      this.logger.debug(`Retrieved ${sorted.length} popular items from DynamoDB`);
      return sorted;
    } catch (error) {
      this.logger.error('Failed to get popular from DynamoDB:', error);
      return null; // Fallback to PostgreSQL
    }
  }
}
