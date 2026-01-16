/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for discovery-service.
 */

// Database configuration (read-only replica)
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  USERNAME: process.env.DB_USERNAME || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DATABASE: process.env.DB_DATABASE || 'discovery_db',
};

// Database URL for Prisma
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${DB_CONFIG.USERNAME}:${DB_CONFIG.PASSWORD}@${DB_CONFIG.HOST}:${DB_CONFIG.PORT}/${DB_CONFIG.DATABASE}?schema=public`;

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8092', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Redis configuration
export const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  PASSWORD: process.env.REDIS_PASSWORD,
  DB: parseInt(process.env.REDIS_DB || '0', 10),
  TTL: {
    PROGRAMS: parseInt(process.env.CACHE_TTL_PROGRAMS || '300', 10), // 5 minutes
    EPISODES: parseInt(process.env.CACHE_TTL_EPISODES || '300', 10), // 5 minutes
    SEARCH: parseInt(process.env.CACHE_TTL_SEARCH || '60', 10), // 1 minute
    TRENDING: parseInt(process.env.CACHE_TTL_TRENDING || '300', 10), // 5 minutes
    POPULAR: parseInt(process.env.CACHE_TTL_POPULAR || '300', 10), // 5 minutes
  },
};

// Kafka configuration
export const KAFKA_CONFIG = {
  BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'discovery-service',
  GROUP_ID: process.env.KAFKA_GROUP_ID || 'discovery-service-group',
};

// CMS Service configuration (for direct queries if needed)
export const CMS_SERVICE_CONFIG = {
  BASE_URL: process.env.CMS_SERVICE_URL || 'http://localhost:8002',
};
