/**
 * Error Codes Constants
 * 
 * Centralized error codes for consistent error handling across services.
 * Error codes follow the pattern: SERVICE_ERROR_TYPE
 */

/**
 * General error codes
 */
export const GeneralErrorCodes = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/**
 * Validation error codes
 */
export const ValidationErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_RANGE: 'INVALID_RANGE',
  INVALID_ENUM_VALUE: 'INVALID_ENUM_VALUE',
} as const;

/**
 * Authentication error codes
 */
export const AuthErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_MALFORMED: 'TOKEN_MALFORMED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
} as const;

/**
 * Authorization error codes
 */
export const AuthorizationErrorCodes = {
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',
} as const;

/**
 * Resource error codes
 */
export const ResourceErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  DELETED: 'DELETED',
  ARCHIVED: 'ARCHIVED',
} as const;

/**
 * Content error codes
 */
export const ContentErrorCodes = {
  CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
  CONTENT_ALREADY_EXISTS: 'CONTENT_ALREADY_EXISTS',
  CONTENT_INVALID_STATUS: 'CONTENT_INVALID_STATUS',
  CONTENT_NOT_PUBLISHED: 'CONTENT_NOT_PUBLISHED',
  CONTENT_PUBLISH_FAILED: 'CONTENT_PUBLISH_FAILED',
} as const;

/**
 * Media error codes
 */
export const MediaErrorCodes = {
  MEDIA_NOT_FOUND: 'MEDIA_NOT_FOUND',
  MEDIA_UPLOAD_FAILED: 'MEDIA_UPLOAD_FAILED',
  MEDIA_PROCESSING_FAILED: 'MEDIA_PROCESSING_FAILED',
  MEDIA_INVALID_FORMAT: 'MEDIA_INVALID_FORMAT',
  MEDIA_TOO_LARGE: 'MEDIA_TOO_LARGE',
  MEDIA_TRANSCODE_FAILED: 'MEDIA_TRANSCODE_FAILED',
} as const;

/**
 * Ingest error codes
 */
export const IngestErrorCodes = {
  INGEST_NOT_FOUND: 'INGEST_NOT_FOUND',
  INGEST_ALREADY_RUNNING: 'INGEST_ALREADY_RUNNING',
  INGEST_FAILED: 'INGEST_FAILED',
  INGEST_CANCELLED: 'INGEST_CANCELLED',
  INGEST_INVALID_SOURCE: 'INGEST_INVALID_SOURCE',
} as const;

/**
 * Metadata error codes
 */
export const MetadataErrorCodes = {
  METADATA_NOT_FOUND: 'METADATA_NOT_FOUND',
  METADATA_INVALID: 'METADATA_INVALID',
  METADATA_EXTRACTION_FAILED: 'METADATA_EXTRACTION_FAILED',
} as const;

/**
 * Search error codes
 */
export const SearchErrorCodes = {
  SEARCH_FAILED: 'SEARCH_FAILED',
  INDEX_NOT_FOUND: 'INDEX_NOT_FOUND',
  INDEX_CREATION_FAILED: 'INDEX_CREATION_FAILED',
  QUERY_INVALID: 'QUERY_INVALID',
} as const;

/**
 * Discovery error codes
 */
export const DiscoveryErrorCodes = {
  DISCOVERY_FAILED: 'DISCOVERY_FAILED',
  RECOMMENDATIONS_UNAVAILABLE: 'RECOMMENDATIONS_UNAVAILABLE',
  TRENDING_UNAVAILABLE: 'TRENDING_UNAVAILABLE',
} as const;

/**
 * Database error codes
 */
export const DatabaseErrorCodes = {
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
  DATABASE_TRANSACTION_FAILED: 'DATABASE_TRANSACTION_FAILED',
  DATABASE_CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
} as const;

/**
 * External service error codes
 */
export const ExternalServiceErrorCodes = {
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

/**
 * All error codes
 */
export const ErrorCodes = {
  // General
  ...GeneralErrorCodes,
  // Validation
  ...ValidationErrorCodes,
  // Authentication
  ...AuthErrorCodes,
  // Authorization
  ...AuthorizationErrorCodes,
  // Resource
  ...ResourceErrorCodes,
  // Content
  ...ContentErrorCodes,
  // Media
  ...MediaErrorCodes,
  // Ingest
  ...IngestErrorCodes,
  // Metadata
  ...MetadataErrorCodes,
  // Search
  ...SearchErrorCodes,
  // Discovery
  ...DiscoveryErrorCodes,
  // Database
  ...DatabaseErrorCodes,
  // External Service
  ...ExternalServiceErrorCodes,
} as const;

/**
 * Error code type
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Get all error codes
 */
export function getAllErrorCodes(): string[] {
  return Object.values(ErrorCodes);
}

/**
 * Check if an error code is valid
 */
export function isValidErrorCode(code: string): code is ErrorCode {
  return Object.values(ErrorCodes).includes(code as ErrorCode);
}

/**
 * Error code to HTTP status code mapping
 */
export const ErrorCodeToHttpStatus: Record<ErrorCode, number> = {
  // General (500)
  [GeneralErrorCodes.INTERNAL_ERROR]: 500,
  [GeneralErrorCodes.NOT_IMPLEMENTED]: 501,
  [GeneralErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [GeneralErrorCodes.TIMEOUT]: 504,
  [GeneralErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  // Validation (400)
  [ValidationErrorCodes.VALIDATION_ERROR]: 400,
  [ValidationErrorCodes.INVALID_INPUT]: 400,
  [ValidationErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ValidationErrorCodes.INVALID_FORMAT]: 400,
  [ValidationErrorCodes.INVALID_RANGE]: 400,
  [ValidationErrorCodes.INVALID_ENUM_VALUE]: 400,
  // Authentication (401)
  [AuthErrorCodes.UNAUTHORIZED]: 401,
  [AuthErrorCodes.INVALID_TOKEN]: 401,
  [AuthErrorCodes.TOKEN_EXPIRED]: 401,
  [AuthErrorCodes.TOKEN_MALFORMED]: 401,
  [AuthErrorCodes.INVALID_CREDENTIALS]: 401,
  [AuthErrorCodes.ACCOUNT_LOCKED]: 401,
  [AuthErrorCodes.ACCOUNT_DISABLED]: 401,
  // Authorization (403)
  [AuthorizationErrorCodes.FORBIDDEN]: 403,
  [AuthorizationErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,
  [AuthorizationErrorCodes.ROLE_REQUIRED]: 403,
  [AuthorizationErrorCodes.RESOURCE_ACCESS_DENIED]: 403,
  // Resource (404, 409)
  [ResourceErrorCodes.NOT_FOUND]: 404,
  [ResourceErrorCodes.ALREADY_EXISTS]: 409,
  [ResourceErrorCodes.CONFLICT]: 409,
  [ResourceErrorCodes.DELETED]: 410,
  [ResourceErrorCodes.ARCHIVED]: 410,
  // Content (404, 400, 500)
  [ContentErrorCodes.CONTENT_NOT_FOUND]: 404,
  [ContentErrorCodes.CONTENT_ALREADY_EXISTS]: 409,
  [ContentErrorCodes.CONTENT_INVALID_STATUS]: 400,
  [ContentErrorCodes.CONTENT_NOT_PUBLISHED]: 404,
  [ContentErrorCodes.CONTENT_PUBLISH_FAILED]: 500,
  // Media (404, 400, 500)
  [MediaErrorCodes.MEDIA_NOT_FOUND]: 404,
  [MediaErrorCodes.MEDIA_UPLOAD_FAILED]: 500,
  [MediaErrorCodes.MEDIA_PROCESSING_FAILED]: 500,
  [MediaErrorCodes.MEDIA_INVALID_FORMAT]: 400,
  [MediaErrorCodes.MEDIA_TOO_LARGE]: 413,
  [MediaErrorCodes.MEDIA_TRANSCODE_FAILED]: 500,
  // Ingest (404, 409, 500)
  [IngestErrorCodes.INGEST_NOT_FOUND]: 404,
  [IngestErrorCodes.INGEST_ALREADY_RUNNING]: 409,
  [IngestErrorCodes.INGEST_FAILED]: 500,
  [IngestErrorCodes.INGEST_CANCELLED]: 410,
  [IngestErrorCodes.INGEST_INVALID_SOURCE]: 400,
  // Metadata (404, 500)
  [MetadataErrorCodes.METADATA_NOT_FOUND]: 404,
  [MetadataErrorCodes.METADATA_INVALID]: 400,
  [MetadataErrorCodes.METADATA_EXTRACTION_FAILED]: 500,
  // Search (500, 404, 400)
  [SearchErrorCodes.SEARCH_FAILED]: 500,
  [SearchErrorCodes.INDEX_NOT_FOUND]: 404,
  [SearchErrorCodes.INDEX_CREATION_FAILED]: 500,
  [SearchErrorCodes.QUERY_INVALID]: 400,
  // Discovery (500, 503)
  [DiscoveryErrorCodes.DISCOVERY_FAILED]: 500,
  [DiscoveryErrorCodes.RECOMMENDATIONS_UNAVAILABLE]: 503,
  [DiscoveryErrorCodes.TRENDING_UNAVAILABLE]: 503,
  // Database (500, 503)
  [DatabaseErrorCodes.DATABASE_CONNECTION_FAILED]: 503,
  [DatabaseErrorCodes.DATABASE_QUERY_FAILED]: 500,
  [DatabaseErrorCodes.DATABASE_TRANSACTION_FAILED]: 500,
  [DatabaseErrorCodes.DATABASE_CONSTRAINT_VIOLATION]: 409,
  // External Service (503, 504, 500)
  [ExternalServiceErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
  [ExternalServiceErrorCodes.EXTERNAL_SERVICE_TIMEOUT]: 504,
  [ExternalServiceErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,
};

/**
 * Get HTTP status code for error code
 */
export function getHttpStatusForErrorCode(code: ErrorCode): number {
  return ErrorCodeToHttpStatus[code] || 500;
}
