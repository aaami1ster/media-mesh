module.exports = {
  apps: [
    {
      name: "core-service",
      script: "./dist/core/main.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "api-gateway-service",
      script: "./dist/api-gateway/main.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "result-service",
      script: "./dist/result/main.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    }
  ]
}
