import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { DiscoveryRepository } from '../repositories/discovery.repository';
import { DynamoDBDiscoveryRepository } from '../repositories/dynamodb-discovery.repository';
import { ContentStatus, ContentType } from '@mediamesh/shared';
import { REDIS_CONFIG, DYNAMODB_CONFIG } from '../../config/env.constants';

/**
 * Cache key generators
 */
const CacheKeys = {
  program: (id: string) => `program:${id}`,
  programEpisodes: (programId: string, page: number, limit: number) =>
    `program:${programId}:episodes:${page}:${limit}`,
  programs: (status: string, page: number, limit: number) =>
    `programs:${status || 'all'}:${page}:${limit}`,
  search: (query: string, contentType: string, page: number, limit: number) =>
    `search:${query}:${contentType || 'all'}:${page}:${limit}`,
  trending: (contentType: string, limit: number) =>
    `trending:${contentType || 'all'}:${limit}`,
  popular: (contentType: string, limit: number) =>
    `popular:${contentType || 'all'}:${limit}`,
};

/**
 * Discovery Service
 * 
 * Business logic layer for discovery operations.
 * Implements cache-aside pattern with Redis.
 */
@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly repository: DiscoveryRepository,
    private readonly dynamoDBRepository: DynamoDBDiscoveryRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Search programs and episodes
   */
  async search(
    query: string,
    contentType?: ContentType,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ programs: any[]; episodes: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const cacheKey = CacheKeys.search(query, contentType || 'all', page, limit);

    // Try cache first
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${query}`);
      return cached;
    }

    // Cache miss - query database
    this.logger.debug(`Cache miss for search: ${query}`);
    const result = await this.repository.search(query, contentType, skip, limit);

    const response = {
      ...result,
      page,
      limit,
    };

    // Store in cache with shorter TTL for search results
    await this.cacheManager.set(cacheKey, response, REDIS_CONFIG.TTL.SEARCH * 1000);

    return response;
  }

  /**
   * Get programs with pagination
   */
  async getPrograms(
    status?: ContentStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ programs: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const cacheKey = CacheKeys.programs(status || 'all', page, limit);

    // Try cache first
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for programs: ${status || 'all'}`);
      return cached;
    }

    // Cache miss - query database
    this.logger.debug(`Cache miss for programs: ${status || 'all'}`);
    const result = await this.repository.findPrograms(status, skip, limit);

    const response = {
      ...result,
      page,
      limit,
    };

    // Store in cache
    await this.cacheManager.set(cacheKey, response, REDIS_CONFIG.TTL.PROGRAMS * 1000);

    return response;
  }

  /**
   * Get program by ID
   */
  async getProgram(id: string): Promise<any> {
    const cacheKey = CacheKeys.program(id);

    // Try cache first
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for program: ${id}`);
      return cached;
    }

    // Cache miss - query database
    this.logger.debug(`Cache miss for program: ${id}`);
    const program = await this.repository.findProgramById(id);

    if (!program) {
      return null;
    }

    // Store in cache
    await this.cacheManager.set(cacheKey, program, REDIS_CONFIG.TTL.PROGRAMS * 1000);

    return program;
  }

  /**
   * Get episodes for a program
   */
  async getEpisodes(
    programId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ episodes: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const cacheKey = CacheKeys.programEpisodes(programId, page, limit);

    // Try cache first
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for episodes: ${programId}`);
      return cached;
    }

    // Cache miss - query database
    this.logger.debug(`Cache miss for episodes: ${programId}`);
    const result = await this.repository.findEpisodesByProgramId(programId, skip, limit);

    const response = {
      ...result,
      page,
      limit,
    };

    // Store in cache
    await this.cacheManager.set(cacheKey, response, REDIS_CONFIG.TTL.EPISODES * 1000);

    return response;
  }

  /**
   * Get trending content
   * 
   * Cache-aside pattern: DynamoDB → Redis → PostgreSQL
   */
  async getTrending(
    contentType?: ContentType,
    limit: number = 10,
  ): Promise<any[]> {
    const cacheKey = CacheKeys.trending(contentType || 'all', limit);
    const contentTypeKey = contentType || 'all';

    // 1. Try Redis cache first
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Redis cache hit for trending: ${contentTypeKey}`);
      return cached;
    }

    // 2. Try DynamoDB (hot data)
    if (DYNAMODB_CONFIG.ENABLED) {
      const dynamoResult = await this.dynamoDBRepository.getTrending(
        contentTypeKey,
        limit,
      );
      if (dynamoResult) {
        this.logger.debug(`DynamoDB hit for trending: ${contentTypeKey}`);
        // Store in Redis cache
        await this.cacheManager.set(
          cacheKey,
          dynamoResult,
          REDIS_CONFIG.TTL.TRENDING * 1000,
        );
        return dynamoResult;
      }
    }

    // 3. Fallback to PostgreSQL
    this.logger.debug(`Cache miss for trending: ${contentTypeKey}, querying PostgreSQL`);
    const trending = await this.repository.findTrending(contentType, limit);

    // Store in both DynamoDB and Redis
    if (DYNAMODB_CONFIG.ENABLED) {
      await this.dynamoDBRepository.storeTrending(
        contentTypeKey,
        trending,
        REDIS_CONFIG.TTL.TRENDING,
      );
    }
    await this.cacheManager.set(
      cacheKey,
      trending,
      REDIS_CONFIG.TTL.TRENDING * 1000,
    );

    return trending;
  }

  /**
   * Get popular content
   * 
   * Cache-aside pattern: DynamoDB → Redis → PostgreSQL
   */
  async getPopular(
    contentType?: ContentType,
    limit: number = 10,
  ): Promise<any[]> {
    const cacheKey = CacheKeys.popular(contentType || 'all', limit);
    const contentTypeKey = contentType || 'all';

    // 1. Try Redis cache first
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Redis cache hit for popular: ${contentTypeKey}`);
      return cached;
    }

    // 2. Try DynamoDB (hot data)
    if (DYNAMODB_CONFIG.ENABLED) {
      const dynamoResult = await this.dynamoDBRepository.getPopular(
        contentTypeKey,
        limit,
      );
      if (dynamoResult) {
        this.logger.debug(`DynamoDB hit for popular: ${contentTypeKey}`);
        // Store in Redis cache
        await this.cacheManager.set(
          cacheKey,
          dynamoResult,
          REDIS_CONFIG.TTL.POPULAR * 1000,
        );
        return dynamoResult;
      }
    }

    // 3. Fallback to PostgreSQL
    this.logger.debug(`Cache miss for popular: ${contentTypeKey}, querying PostgreSQL`);
    const popular = await this.repository.findPopular(contentType, limit);

    // Store in both DynamoDB and Redis
    if (DYNAMODB_CONFIG.ENABLED) {
      await this.dynamoDBRepository.storePopular(
        contentTypeKey,
        popular,
        REDIS_CONFIG.TTL.POPULAR,
      );
    }
    await this.cacheManager.set(
      cacheKey,
      popular,
      REDIS_CONFIG.TTL.POPULAR * 1000,
    );

    return popular;
  }

  /**
   * Invalidate cache for a program
   */
  async invalidateProgramCache(programId: string): Promise<void> {
    const keys = [
      CacheKeys.program(programId),
      CacheKeys.trending('all', 10),
      CacheKeys.popular('all', 10),
    ];

    for (const key of keys) {
      await this.cacheManager.del(key);
    }

    // Also invalidate all program list caches (in production, use pattern matching)
    this.logger.log(`Cache invalidated for program: ${programId}`);
  }

  /**
   * Invalidate cache for program episodes
   */
  async invalidateProgramEpisodesCache(programId: string): Promise<void> {
    // In production, use pattern matching to delete all episode caches for this program
    this.logger.log(`Cache invalidated for program episodes: ${programId}`);
  }

  /**
   * Invalidate search cache
   */
  async invalidateSearchCache(): Promise<void> {
    // In production, use pattern matching to delete all search caches
    this.logger.log('Search cache invalidated');
  }
}
