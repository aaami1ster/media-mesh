/**
 * Environment Constants
 * 
 * Centralized environment variable configuration for cms-service.
 */

// Database configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  USERNAME: process.env.DB_USERNAME || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DATABASE: process.env.DB_DATABASE || 'cms_db',
};

// Database URL for Prisma
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${DB_CONFIG.USERNAME}:${DB_CONFIG.PASSWORD}@${DB_CONFIG.HOST}:${DB_CONFIG.PORT}/${DB_CONFIG.DATABASE}?schema=public`;

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8082', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
