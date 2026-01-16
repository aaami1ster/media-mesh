/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for api-gateway-cms.
 */

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8081', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Service URLs
export const SERVICE_CONFIG = {
  CMS_SERVICE: process.env.CMS_SERVICE_URL || 'http://localhost:8002',
  METADATA_SERVICE: process.env.METADATA_SERVICE_URL || 'http://localhost:8003',
  MEDIA_SERVICE: process.env.MEDIA_SERVICE_URL || 'http://localhost:8004',
  INGEST_SERVICE: process.env.INGEST_SERVICE_URL || 'http://localhost:8005',
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
  ADMIN_TTL: parseInt(process.env.RATE_LIMIT_ADMIN_TTL || '60', 10), // seconds
  ADMIN_LIMIT: parseInt(process.env.RATE_LIMIT_ADMIN_LIMIT || '100', 10), // requests per TTL
  EDITOR_TTL: parseInt(process.env.RATE_LIMIT_EDITOR_TTL || '60', 10),
  EDITOR_LIMIT: parseInt(process.env.RATE_LIMIT_EDITOR_LIMIT || '50', 10),
  DEFAULT_TTL: parseInt(process.env.RATE_LIMIT_DEFAULT_TTL || '60', 10),
  DEFAULT_LIMIT: parseInt(process.env.RATE_LIMIT_DEFAULT_LIMIT || '20', 10),
};

// JWT configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
};
