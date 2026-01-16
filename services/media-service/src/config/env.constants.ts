/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for media-service.
 */

// Database configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  USERNAME: process.env.DB_USERNAME || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DATABASE: process.env.DB_DATABASE || 'media_db',
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
  PORT: parseInt(process.env.PORT || '8004', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Kafka configuration
export const KAFKA_CONFIG = {
  BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'media-service',
};

// Object Storage configuration
export const STORAGE_CONFIG = {
  // Storage provider: S3, SPACES, or MINIO
  PROVIDER: (process.env.STORAGE_PROVIDER || 'S3').toUpperCase() as 'S3' | 'SPACES' | 'MINIO',
  
  // AWS S3 / DigitalOcean Spaces / MinIO configuration
  ENDPOINT: process.env.STORAGE_ENDPOINT,
  REGION: process.env.STORAGE_REGION || 'us-east-1',
  BUCKET: process.env.STORAGE_BUCKET || 'media-mesh',
  ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID || '',
  SECRET_ACCESS_KEY: process.env.STORAGE_SECRET_ACCESS_KEY || '',
  
  // CDN configuration
  CDN_BASE_URL: process.env.CDN_BASE_URL || '',
  
  // MinIO specific
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost:9000',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
};
