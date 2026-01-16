import { ContentType } from '@mediamesh/shared';

/**
 * Search Index Entity
 * 
 * Represents indexed content for search.
 */
export class SearchIndex {
  id: string;
  contentId: string;
  contentType: ContentType;
  title: string;
  description?: string;
  category?: string;
  language?: string;
  tags: string[];
  indexedAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<SearchIndex>) {
    Object.assign(this, partial);
  }

  /**
   * Create SearchIndex entity from Prisma model
   */
  static fromPrisma(prismaIndex: {
    id: string;
    contentId: string;
    contentType: string;
    title: string;
    description: string | null;
    category: string | null;
    language: string | null;
    tags: string[];
    indexedAt: Date;
    updatedAt: Date;
  }): SearchIndex {
    return new SearchIndex({
      id: prismaIndex.id,
      contentId: prismaIndex.contentId,
      contentType: prismaIndex.contentType as ContentType,
      title: prismaIndex.title,
      description: prismaIndex.description || undefined,
      category: prismaIndex.category || undefined,
      language: prismaIndex.language || undefined,
      tags: prismaIndex.tags,
      indexedAt: prismaIndex.indexedAt,
      updatedAt: prismaIndex.updatedAt,
    });
  }

  /**
   * Convert to DTO
   */
  toDto() {
    const { ...dto } = this;
    return dto;
  }
}
