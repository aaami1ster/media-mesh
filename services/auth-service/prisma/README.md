# Prisma Database Setup

This directory contains Prisma schema, migrations, and seed scripts for the auth-service.

---

## 📋 Files

- `schema.prisma` - Prisma schema definition
- `migrations/` - Database migration files
- `seed.ts` - Seed script to create initial admin user

---

## 🚀 Setup

### 1. Environment Variables

Create a `.env` file in the service root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db?schema=public

# Optional: Customize admin user
ADMIN_EMAIL=admin@mediamesh.com
ADMIN_PASSWORD=Admin123!@#
BCRYPT_SALT_ROUNDS=10
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
# or
npx prisma generate
```

### 3. Run Migrations

**Development:**
```bash
npm run prisma:migrate
# or
npx prisma migrate dev
```

**Production:**
```bash
npm run prisma:migrate:deploy
# or
npx prisma migrate deploy
```

### 4. Seed Database

```bash
npm run db:seed
# or
npx prisma db seed
# or
npx ts-node prisma/seed.ts
```

---

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "users_email_idx" ON "users"("email");
```

**Fields:**
- `id` - UUID (primary key)
- `email` - Unique email address
- `password` - Hashed password (bcrypt)
- `role` - User role (ADMIN, EDITOR, USER)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

---

## 🌱 Seed Script

The seed script creates an initial admin user with the following defaults:

- **Email**: `admin@mediamesh.com` (configurable via `ADMIN_EMAIL`)
- **Password**: `Admin123!@#` (configurable via `ADMIN_PASSWORD`)
- **Role**: `ADMIN`

**Customize via environment variables:**
```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=YourSecurePassword123!
```

**Security Note:** The seed script will skip creating the admin user if one already exists with the same email.

---

## 🔧 Prisma Commands

### Generate Client
```bash
npx prisma generate
```

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

### Apply Migrations
```bash
# Development (creates migration file)
npx prisma migrate dev

# Production (applies existing migrations)
npx prisma migrate deploy
```

### View Database
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

---

## 📝 Migration Files

Migrations are stored in `prisma/migrations/` directory. Each migration includes:

- Migration SQL file
- Migration metadata

**Important:** Never edit migration files manually after they've been applied. Create new migrations for schema changes.

---

## 🔍 Troubleshooting

### Database Connection Error

Ensure PostgreSQL is running and the `DATABASE_URL` is correct:

```bash
# Check PostgreSQL connection
psql postgresql://postgres:postgres@localhost:5432/auth_db
```

### Migration Conflicts

If migrations are out of sync:

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually resolve conflicts
npx prisma migrate resolve --applied migration_name
```

### Seed Script Errors

Ensure:
1. Database is running
2. Migrations are applied
3. `DATABASE_URL` is set correctly
4. Dependencies are installed (`bcrypt`, `@prisma/client`)

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Seed Guide](https://www.prisma.io/docs/guides/database/seed-database)
