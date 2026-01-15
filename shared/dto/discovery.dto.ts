import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './common.dto';

/**
 * Search sort field enum
 */
export enum SearchSortField {
  RELEVANCE = 'relevance',
  TITLE = 'title',
  RELEASE_DATE = 'releaseDate',
  CREATED_AT = 'createdAt',
  RATING = 'rating',
}

/**
 * Search query DTO
 */
export class SearchQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  q?: string; // search query

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(SearchSortField)
  sortBy?: SearchSortField = SearchSortField.RELEVANCE;

  @IsOptional()
  @IsDateString()
  releaseDateFrom?: string;

  @IsOptional()
  @IsDateString()
  releaseDateTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rating?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minDuration?: number; // in seconds

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDuration?: number; // in seconds
}

/**
 * Search result item
 */
export class SearchResultItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  type: string;
  relevanceScore?: number;
  highlights?: string[]; // matched text snippets
}

/**
 * Search response DTO
 */
export class SearchResponseDto {
  results: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  filters?: {
    genres?: string[];
    tags?: string[];
    releaseDateFrom?: string;
    releaseDateTo?: string;
    rating?: string;
  };
  took?: number; // search time in milliseconds
}

/**
 * Trending query DTO
 */
export class TrendingQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsEnum(['day', 'week', 'month', 'all'])
  period?: 'day' | 'week' | 'month' | 'all' = 'week';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];
}
