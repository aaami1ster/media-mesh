/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for ingest-service.
 */

// Database configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  USERNAME: process.env.DB_USERNAME || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DATABASE: process.env.DB_DATABASE || 'ingest_db',
};

// Database URL for Prisma
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${DB_CONFIG.USERNAME}:${DB_CONFIG.PASSWORD}@${DB_CONFIG.HOST}:${DB_CONFIG.PORT}/${DB_CONFIG.DATABASE}?schema=public`;

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8005', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Kafka configuration
export const KAFKA_CONFIG = {
  BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'ingest-service',
};

// YouTube API configuration
export const YOUTUBE_CONFIG = {
  API_KEY: process.env.YOUTUBE_API_KEY || '',
  MAX_RESULTS: parseInt(process.env.YOUTUBE_MAX_RESULTS || '50', 10),
};

// JWT configuration (must match auth-service secret)
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production-use-a-long-random-string-at-least-256-bits',
  EXPIRATION_STRING: process.env.JWT_EXPIRATION_STRING || '24h',
};

// Ingest configuration
export const INGEST_CONFIG = {
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS || '5000', 10),
  BATCH_SIZE: parseInt(process.env.INGEST_BATCH_SIZE || '10', 10),
};
