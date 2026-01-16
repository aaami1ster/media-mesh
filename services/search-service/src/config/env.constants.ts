/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for search-service.
 */

// Database configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  USERNAME: process.env.DB_USERNAME || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DATABASE: process.env.DB_DATABASE || 'search_db',
};

// Database URL for Prisma
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${DB_CONFIG.USERNAME}:${DB_CONFIG.PASSWORD}@${DB_CONFIG.HOST}:${DB_CONFIG.PORT}/${DB_CONFIG.DATABASE}?schema=public`;

// JWT configuration (must match auth-service secret)
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production-use-a-long-random-string-at-least-256-bits',
  EXPIRATION_STRING: process.env.JWT_EXPIRATION_STRING || '24h',
};

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8091', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Kafka configuration
export const KAFKA_CONFIG = {
  BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'search-service',
  GROUP_ID: process.env.KAFKA_GROUP_ID || 'search-service-group',
  TOPICS: {
    CONTENT_EVENTS: process.env.KAFKA_CONTENT_TOPIC || 'content.events',
    INGEST_EVENTS: process.env.KAFKA_INGEST_TOPIC || 'ingest.events',
  },
};

// Search configuration
export const SEARCH_CONFIG = {
  MAX_RESULTS: parseInt(process.env.SEARCH_MAX_RESULTS || '100', 10),
  DEFAULT_LIMIT: parseInt(process.env.SEARCH_DEFAULT_LIMIT || '20', 10),
};

// CMS Service configuration (for fetching content to index)
export const CMS_SERVICE_CONFIG = {
  BASE_URL: process.env.CMS_SERVICE_URL || 'http://localhost:8002',
};

// DynamoDB configuration
export const DYNAMODB_CONFIG = {
  REGION: process.env.AWS_REGION || 'us-east-1',
  ENDPOINT: process.env.DYNAMODB_ENDPOINT, // For DynamoDB Local
  ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  TABLES: {
    SEARCH_INDEX: process.env.DYNAMODB_TABLE_SEARCH_INDEX || 'mediamesh-search-index',
  },
  TTL_ATTRIBUTE: process.env.DYNAMODB_TTL_ATTRIBUTE || 'ttl',
  ENABLED: process.env.DYNAMODB_ENABLED !== 'false', // Default to enabled
  TTL_SECONDS: parseInt(process.env.DYNAMODB_TTL_SECONDS || '2592000', 10), // 30 days default
};
