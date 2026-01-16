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
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
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

// Resilience configuration
export const RESILIENCE_CONFIG = {
  // Retry configuration
  RETRY_MAX_ATTEMPTS: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
  RETRY_INITIAL_DELAY: parseInt(process.env.RETRY_INITIAL_DELAY || '1000', 10), // ms
  RETRY_MAX_DELAY: parseInt(process.env.RETRY_MAX_DELAY || '10000', 10), // ms
  RETRY_MULTIPLIER: parseFloat(process.env.RETRY_MULTIPLIER || '2'),
  
  // Circuit breaker configuration
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5', 10),
  CIRCUIT_BREAKER_SUCCESS_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '2', 10),
  CIRCUIT_BREAKER_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10), // ms
  CIRCUIT_BREAKER_RESET_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '300000', 10), // ms
  CIRCUIT_BREAKER_MONITORING_PERIOD: parseInt(process.env.CIRCUIT_BREAKER_MONITORING_PERIOD || '60000', 10), // ms
  
  // Timeout configuration
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // ms
};
