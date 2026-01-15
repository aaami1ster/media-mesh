import { IsInt, IsOptional, Min, Max, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Pagination DTO for query parameters
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }
}

/**
 * Standard error response DTO
 */
export class ErrorResponseDto {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  correlationId?: string;
  details?: any;
}
