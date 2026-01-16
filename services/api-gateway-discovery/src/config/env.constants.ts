/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for api-gateway-discovery.
 */

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Service URLs
export const SERVICE_CONFIG = {
  DISCOVERY_SERVICE: process.env.DISCOVERY_SERVICE_URL || 'http://localhost:8006',
  SEARCH_SERVICE: process.env.SEARCH_SERVICE_URL || 'http://localhost:8091',
};

// Redis configuration for rate limiting
export const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  PASSWORD: process.env.REDIS_PASSWORD,
  DB: parseInt(process.env.REDIS_DB || '0', 10),
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  DEFAULT_TTL: parseInt(process.env.RATE_LIMIT_DEFAULT_TTL || '60', 10), // seconds
  DEFAULT_LIMIT: parseInt(process.env.RATE_LIMIT_DEFAULT_LIMIT || '100', 10), // requests per TTL
  SEARCH_TTL: parseInt(process.env.RATE_LIMIT_SEARCH_TTL || '60', 10),
  SEARCH_LIMIT: parseInt(process.env.RATE_LIMIT_SEARCH_LIMIT || '60', 10), // 60 requests/minute for search
  AUTHENTICATED_TTL: parseInt(process.env.RATE_LIMIT_AUTHENTICATED_TTL || '60', 10),
  AUTHENTICATED_LIMIT: parseInt(process.env.RATE_LIMIT_AUTHENTICATED_LIMIT || '200', 10), // Higher limit for authenticated users
};

// GraphQL configuration
export const GRAPHQL_CONFIG = {
  PLAYGROUND: process.env.GRAPHQL_PLAYGROUND !== 'false',
  INTROSPECTION: process.env.GRAPHQL_INTROSPECTION !== 'false',
  AUTO_SCHEMA_FILE: process.env.GRAPHQL_AUTO_SCHEMA_FILE || 'schema.gql',
};

// Resilience configuration
export const RESILIENCE_CONFIG = {
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // ms
};
