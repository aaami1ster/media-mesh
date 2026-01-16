# Environment Variables Setup

This document explains how to set up environment variables for the auth-service.

---

## 📍 Location

The `.env` file should be placed in the **`services/auth-service/`** directory:

```
services/auth-service/
├── .env                    ← Place .env file here
├── .env.example            ← Example template
├── prisma/
│   └── schema.prisma
└── src/
    └── ...
```

---

## 🚀 Quick Setup

### 1. Copy the example file

```bash
cd services/auth-service
cp .env.example .env
```

### 2. Update DATABASE_URL

Edit `.env` and set the `DATABASE_URL` based on your setup:

**For local development with Docker Compose:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db?schema=public
```

**For Docker container (when running in compose):**
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/auth_db?schema=public
```

**For production:**
```env
DATABASE_URL=postgresql://username:password@your-db-host:5432/auth_db?schema=public
```

---

## 📋 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_DATABASE` | Database name | `auth_db` |
| `JWT_SECRET` | JWT secret key | `your-secret-key...` |
| `JWT_EXPIRATION` | JWT expiration (ms) | `86400000` (24h) |
| `PORT` | Server port | `8001` |
| `NODE_ENV` | Environment | `development` |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | `10` |
| `ADMIN_EMAIL` | Admin user email (seed) | `admin@mediamesh.com` |
| `ADMIN_PASSWORD` | Admin user password (seed) | `Admin123!@#` |

---

## 🔧 Configuration Scenarios

### Scenario 1: Local Development (Docker Compose)

**When:** Running PostgreSQL via `docker compose up`

**`.env` file:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db?schema=public
PORT=8001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
```

**Connection details:**
- Host: `localhost` (from host machine)
- Port: `5432` (mapped from container)
- Database: `auth_db`
- User: `postgres`
- Password: `postgres`

---

### Scenario 2: Docker Container (Service in Compose)

**When:** Running auth-service as a Docker container

**`.env` file:**
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/auth_db?schema=public
PORT=8001
NODE_ENV=production
JWT_SECRET=your-production-secret-key
```

**Connection details:**
- Host: `postgres` (Docker service name)
- Port: `5432` (internal container port)
- Database: `auth_db`
- User: `postgres`
- Password: `postgres`

---

### Scenario 3: Production (AWS RDS, etc.)

**When:** Using managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)

**`.env` file:**
```env
DATABASE_URL=postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/auth_db?schema=public
PORT=8001
NODE_ENV=production
JWT_SECRET=your-very-secure-random-secret-key-at-least-256-bits
```

**Connection details:**
- Host: Your RDS endpoint
- Port: `5432` (or custom)
- Database: `auth_db`
- User: Your database username
- Password: Your database password

---

## 🔒 Security Best Practices

### 1. Never Commit `.env` Files

The `.env` file is already in `.gitignore`. Never commit it to version control.

### 2. Use Strong JWT Secrets

Generate a strong random secret:

```bash
# Generate random secret (256 bits)
openssl rand -base64 32
```

### 3. Use Environment-Specific Files

- `.env` - Local development
- `.env.production` - Production template
- `.env.staging` - Staging environment (if needed)

### 4. Use Secrets Management in Production

For production deployments:
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Kubernetes**: Use Kubernetes Secrets
- **Docker**: Use Docker secrets
- **CI/CD**: Use environment variables in CI/CD platform

---

## ✅ Verification

### Check if `.env` is loaded

```bash
cd services/auth-service
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Test database connection

```bash
# Using Prisma
npx prisma db pull

# Using psql
psql postgresql://postgres:postgres@localhost:5432/auth_db
```

---

## 🐛 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solution:** Ensure `.env` file exists in `services/auth-service/` directory.

### Error: "Can't reach database server"

**Possible causes:**
1. PostgreSQL is not running
2. Wrong host/port in `DATABASE_URL`
3. Firewall blocking connection
4. Wrong credentials

**Solutions:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Test connection
psql $DATABASE_URL

# Check Docker network
docker network ls
```

### Error: "database does not exist"

**Solution:** Ensure the database `auth_db` exists:

```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/postgres

# Create database
CREATE DATABASE auth_db;
```

---

## 📚 Related Documentation

- [Prisma Environment Variables](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#environment-variables)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
