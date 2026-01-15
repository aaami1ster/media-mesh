# Package.json Scripts Reference

This document describes all available npm scripts in the root `package.json`.

---

## 🏗️ Build Scripts

### `npm run build`
Build a single service (requires service name):
```bash
nest build api-gateway-discovery
```

### `npm run build:all`
Build all services in the monorepo using npm workspaces:
```bash
npm run build:all
```
- Uses `npm run build --workspaces --if-present`
- Builds all services that have a `build` script
- Skips services without a build script (graceful)

---

## 🚀 Start Scripts

### `npm run start:dev`
Start all services in development mode using PM2:
```bash
npm run start:dev
```
- Uses `ecosystem.config.js` with development environment variables
- Starts all 9 microservices
- Services connect to `localhost` infrastructure

**Prerequisites:**
- Services must be built: `npm run build:all`
- Infrastructure must be running: `docker compose up -d postgres redis broker`

### `npm run start:prod`
Start all services in production mode using PM2:
```bash
npm run start:prod
```
- Uses `ecosystem.config.js` with production environment variables
- Services connect to Docker service names (postgres, redis, broker)
- Suitable for Docker Compose or production deployment

**Prerequisites:**
- Services must be built: `npm run build:all`
- Infrastructure must be running

### `npm run start:debug`
Start a single service in debug mode (requires service name):
```bash
nest start api-gateway-discovery --debug --watch
```

---

## 🧪 Test Scripts

### `npm run test`
Run tests for a single service (requires service name):
```bash
nest test api-gateway-discovery
```

### `npm run test:all`
Run tests for all services:
```bash
npm run test:all
```
- Uses `npm run test --workspaces --if-present`
- Runs tests in all workspaces that have a test script

### `npm run test:watch`
Run tests in watch mode (single service):
```bash
nest test api-gateway-discovery --watch
```

### `npm run test:cov`
Generate test coverage report:
```bash
npm run test:cov
```

### `npm run test:debug`
Run tests in debug mode:
```bash
npm run test:debug
```

### `npm run test:e2e`
Run end-to-end tests:
```bash
npm run test:e2e
```

---

## 🔍 Lint Scripts

### `npm run lint`
Lint all TypeScript files in services, shared, and test directories:
```bash
npm run lint
```
- Automatically fixes issues where possible
- Uses ESLint with Prettier integration

### `npm run lint:all`
Lint all services using npm workspaces:
```bash
npm run lint:all
```
- Uses `npm run lint --workspaces --if-present`
- Runs lint in all workspaces that have a lint script

---

## 💅 Format Scripts

### `npm run format`
Format all TypeScript files using Prettier:
```bash
npm run format
```
- Formats files in `services/`, `shared/`, and `test/` directories
- Uses Prettier configuration from `.prettierrc`

---

## 📦 PM2 Management Scripts

### `npm run pm2:status`
View status of all PM2 processes:
```bash
npm run pm2:status
```

### `npm run pm2:stop`
Stop all PM2 processes:
```bash
npm run pm2:stop
```

### `npm run pm2:restart`
Restart all PM2 processes:
```bash
npm run pm2:restart
```

### `npm run pm2:delete`
Stop and delete all PM2 processes:
```bash
npm run pm2:delete
```

### `npm run pm2:logs`
View logs from all PM2 processes:
```bash
npm run pm2:logs
```

### `npm run pm2:monit`
Monitor PM2 processes (CPU, memory, logs):
```bash
npm run pm2:monit
```

---

## 📋 Workspace Management

The project uses **npm workspaces** to manage dependencies across services:

```json
"workspaces": [
  "services/*",
  "shared"
]
```

### Install Dependencies

```bash
# Install all dependencies (root + all workspaces)
npm install

# Install dependency in root (available to all workspaces)
npm install <package> -w .

# Install dependency in specific workspace
npm install <package> -w @mediamesh/api-gateway-discovery
```

### Run Scripts in Workspaces

```bash
# Run script in all workspaces
npm run <script> --workspaces

# Run script in specific workspace
npm run <script> --workspace @mediamesh/api-gateway-discovery
```

### List Workspaces

```bash
npm ls --workspaces
```

---

## 🔄 Typical Workflow

### Development

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure
docker compose up -d postgres redis broker

# 3. Build all services
npm run build:all

# 4. Start all services in dev mode
npm run start:dev

# 5. Monitor services
npm run pm2:monit

# 6. View logs
npm run pm2:logs
```

### Production

```bash
# 1. Build all services
npm run build:all

# 2. Start all services in production mode
npm run start:prod

# 3. Save PM2 process list
pm2 save

# 4. Setup PM2 startup (if needed)
pm2 startup
```

### Testing

```bash
# Run all tests
npm run test:all

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint

# Lint all services
npm run lint:all
```

---

## 🐛 Troubleshooting

### Services Not Starting

1. **Check if services are built:**
   ```bash
   ls services/*/dist/main.js
   ```

2. **Check infrastructure:**
   ```bash
   docker compose ps
   ```

3. **Check PM2 status:**
   ```bash
   npm run pm2:status
   ```

4. **Check logs:**
   ```bash
   npm run pm2:logs
   ```

### Build Failures

1. **Clean and rebuild:**
   ```bash
   rm -rf services/*/dist
   npm run build:all
   ```

2. **Check TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

### PM2 Issues

1. **Kill PM2 daemon:**
   ```bash
   pm2 kill
   ```

2. **Reset PM2:**
   ```bash
   pm2 kill
   npm run start:dev
   ```

---

## 📚 Additional Resources

- [NPM Workspaces Documentation](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [NestJS CLI Documentation](https://docs.nestjs.com/cli/overview)
