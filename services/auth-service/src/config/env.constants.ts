/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for auth-service.
 */

// Database configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  USERNAME: process.env.DB_USERNAME || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DATABASE: process.env.DB_DATABASE || 'auth_db',
};

// Database URL for Prisma
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${DB_CONFIG.USERNAME}:${DB_CONFIG.PASSWORD}@${DB_CONFIG.HOST}:${DB_CONFIG.PORT}/${DB_CONFIG.DATABASE}?schema=public`;

// JWT configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production-use-a-long-random-string-at-least-256-bits',
  EXPIRATION: process.env.JWT_EXPIRATION || '86400000', // 24 hours in milliseconds
  EXPIRATION_STRING: process.env.JWT_EXPIRATION_STRING || '24h',
};

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Bcrypt configuration
export const BCRYPT_CONFIG = {
  SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
};
