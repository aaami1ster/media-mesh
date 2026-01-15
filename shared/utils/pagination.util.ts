import { PaginationDto, PaginatedResponseDto } from '../dto';

/**
 * Pagination utilities
 */

/**
 * Create pagination metadata
 */
export function createPaginationMetadata(
  total: number,
  page: number,
  limit: number,
): PaginatedResponseDto<any>['meta'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponseDto<T> {
  return new PaginatedResponseDto(data, total, page, limit);
}

/**
 * Normalize pagination parameters
 */
export function normalizePagination(
  page?: number,
  limit?: number,
  maxLimit: number = 100,
): { page: number; limit: number; skip: number } {
  const normalizedPage = Math.max(1, page || 1);
  const normalizedLimit = Math.min(Math.max(1, limit || 20), maxLimit);
  const skip = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
  };
}

/**
 * Extract pagination from query parameters
 */
export function extractPagination(query: any): {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} {
  const { page, limit, sortBy, sortOrder } = query;
  const normalized = normalizePagination(page, limit);

  return {
    ...normalized,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
  };
}
