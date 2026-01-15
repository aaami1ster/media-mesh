module.exports = {
  apps: [
    // Discovery Gateway (Public)
    {
      name: "discovery-gateway",
      script: "./services/api-gateway-discovery/dist/main.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 8080,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      error_file: "./logs/discovery-gateway-error.log",
      out_file: "./logs/discovery-gateway-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // CMS Gateway (Internal)
    {
      name: "cms-gateway",
      script: "./services/api-gateway-cms/dist/main.js",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 8081,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8081,
      },
      error_file: "./logs/cms-gateway-error.log",
      out_file: "./logs/cms-gateway-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // Auth Service
    {
      name: "auth-service",
      script: "./services/auth-service/dist/main.js",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 8086,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8086,
      },
      error_file: "./logs/auth-service-error.log",
      out_file: "./logs/auth-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // CMS Service
    {
      name: "cms-service",
      script: "./services/cms-service/dist/main.js",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 8082,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8082,
      },
      error_file: "./logs/cms-service-error.log",
      out_file: "./logs/cms-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // Metadata Service
    {
      name: "metadata-service",
      script: "./services/metadata-service/dist/main.js",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 8083,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8083,
      },
      error_file: "./logs/metadata-service-error.log",
      out_file: "./logs/metadata-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // Media Service
    {
      name: "media-service",
      script: "./services/media-service/dist/main.js",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 8084,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8084,
      },
      error_file: "./logs/media-service-error.log",
      out_file: "./logs/media-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // Ingest Service
    {
      name: "ingest-service",
      script: "./services/ingest-service/dist/main.js",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 8085,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8085,
      },
      error_file: "./logs/ingest-service-error.log",
      out_file: "./logs/ingest-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // Discovery Service
    {
      name: "discovery-service",
      script: "./services/discovery-service/dist/main.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 8092,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8092,
      },
      error_file: "./logs/discovery-service-error.log",
      out_file: "./logs/discovery-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    // Search Service
    {
      name: "search-service",
      script: "./services/search-service/dist/main.js",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 8091,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8091,
      },
      error_file: "./logs/search-service-error.log",
      out_file: "./logs/search-service-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
