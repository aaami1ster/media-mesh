/**
 * API Version Constants
 * 
 * Defines API versioning constants for the MediaMesh API.
 */

/**
 * Current API version
 */
export const API_VERSION = 'v1';

/**
 * API version prefix
 */
export const API_VERSION_PREFIX = `/api/${API_VERSION}`;

/**
 * Supported API versions
 */
export const SUPPORTED_API_VERSIONS = ['v1'] as const;

/**
 * API version type
 */
export type ApiVersion = typeof SUPPORTED_API_VERSIONS[number];

/**
 * Default API version
 */
export const DEFAULT_API_VERSION: ApiVersion = 'v1';

/**
 * API version header name
 */
export const API_VERSION_HEADER = 'X-API-Version';

/**
 * API version query parameter name
 */
export const API_VERSION_QUERY = 'version';

/**
 * Check if an API version is supported
 */
export function isSupportedApiVersion(version: string): version is ApiVersion {
  return SUPPORTED_API_VERSIONS.includes(version as ApiVersion);
}

/**
 * Get API version from request
 */
export function getApiVersionFromRequest(
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, string | string[] | undefined>,
): ApiVersion {
  // Check header first
  const headerVersion = headers[API_VERSION_HEADER.toLowerCase()];
  if (headerVersion && typeof headerVersion === 'string') {
    if (isSupportedApiVersion(headerVersion)) {
      return headerVersion;
    }
  }

  // Check query parameter
  const queryVersion = query[API_VERSION_QUERY];
  if (queryVersion && typeof queryVersion === 'string') {
    if (isSupportedApiVersion(queryVersion)) {
      return queryVersion;
    }
  }

  // Return default version
  return DEFAULT_API_VERSION;
}
