import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchIndex } from '../entities/search-index.entity';
import { ContentType } from '@mediamesh/shared';

/**
 * Search Repository
 * 
 * Data access layer for SearchIndex entities.
 */
@Injectable()
export class SearchRepository {
  private readonly logger = new Logger(SearchRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or update search index entry
   */
  async upsert(data: {
    contentId: string;
    contentType: ContentType;
    title: string;
    description?: string;
    category?: string;
    language?: string;
    tags?: string[];
  }): Promise<SearchIndex> {
    const prismaIndex = await this.prisma.searchIndex.upsert({
      where: { contentId: data.contentId },
      create: {
        contentId: data.contentId,
        contentType: data.contentType,
        title: data.title,
        description: data.description,
        category: data.category,
        language: data.language,
        tags: data.tags || [],
      },
      update: {
        title: data.title,
        description: data.description,
        category: data.category,
        language: data.language,
        tags: data.tags || [],
      },
    });

    return SearchIndex.fromPrisma(prismaIndex);
  }

  /**
   * Find search index by content ID
   */
  async findByContentId(contentId: string): Promise<SearchIndex | null> {
    const prismaIndex = await this.prisma.searchIndex.findUnique({
      where: { contentId },
    });

    return prismaIndex ? SearchIndex.fromPrisma(prismaIndex) : null;
  }

  /**
   * Search content using full-text search
   */
  async search(
    query: string,
    contentType?: ContentType,
    category?: string,
    language?: string,
    tags?: string[],
    skip: number = 0,
    take: number = 20,
  ): Promise<{ results: SearchIndex[]; total: number }> {
    const where: any = {};

    // Full-text search on title and description
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filters
    if (contentType) {
      where.contentType = contentType;
    }
    if (category) {
      where.category = category;
    }
    if (language) {
      where.language = language;
    }
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    const [results, total] = await Promise.all([
      this.prisma.searchIndex.findMany({
        where,
        skip,
        take,
        orderBy: { indexedAt: 'desc' },
      }),
      this.prisma.searchIndex.count({ where }),
    ]);

    return {
      results: results.map(SearchIndex.fromPrisma),
      total,
    };
  }

  /**
   * Delete from search index
   */
  async delete(contentId: string): Promise<void> {
    await this.prisma.searchIndex.delete({
      where: { contentId },
    });
  }

  /**
   * Get all indexed content IDs
   */
  async getAllContentIds(): Promise<string[]> {
    const indices = await this.prisma.searchIndex.findMany({
      select: { contentId: true },
    });

    return indices.map((idx) => idx.contentId);
  }

  /**
   * Count indexed content
   */
  async count(): Promise<number> {
    return await this.prisma.searchIndex.count();
  }

  /**
   * Get last indexed timestamp
   */
  async getLastIndexedAt(): Promise<Date | null> {
    const lastIndex = await this.prisma.searchIndex.findFirst({
      orderBy: { indexedAt: 'desc' },
      select: { indexedAt: true },
    });

    return lastIndex?.indexedAt || null;
  }
}
