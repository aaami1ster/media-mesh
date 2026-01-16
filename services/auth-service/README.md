# Auth Service

Authentication and authorization service for MediaMesh.

---

## 🏗️ Architecture

### Structure

```
auth-service/
├── prisma/
│   └── schema.prisma          # Prisma schema (User model)
├── src/
│   ├── config/
│   │   └── env.constants.ts   # Environment configuration
│   ├── prisma/
│   │   ├── prisma.service.ts  # Prisma service (database connection)
│   │   └── prisma.module.ts   # Prisma module (global)
│   ├── users/
│   │   ├── entities/
│   │   │   └── user.entity.ts # User entity
│   │   ├── repositories/
│   │   │   └── user.repository.ts # User repository (data access)
│   │   ├── services/
│   │   │   └── user.service.ts    # User service (business logic)
│   │   └── users.module.ts        # Users module
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
└── package.json
```

---

## 📦 Dependencies

### Core
- `@nestjs/common`, `@nestjs/core` - NestJS framework
- `@nestjs/platform-fastify` - Fastify adapter
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI (dev dependency)

### Authentication
- `@nestjs/jwt` - JWT module for NestJS
- `@nestjs/passport` - Passport integration
- `passport-jwt` - JWT strategy for Passport
- `bcrypt` - Password hashing

### Shared
- `@mediamesh/shared` - Shared modules (DTOs, constants, utilities)

---

## 🗄️ Database

### Prisma Schema

The service uses Prisma ORM with PostgreSQL database `auth_db`.

**User Model:**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed password
  role      String   @default("USER") // ADMIN, EDITOR, USER
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
  @@index([email])
}
```

### Database Connection

**Connection String Format:**
```
postgresql://{username}:{password}@{host}:{port}/{database}?schema=public
```

**Example:**
```
postgresql://postgres:postgres@localhost:5432/auth_db?schema=public
```

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Create migration
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npx prisma studio
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the service root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=auth_db

# Or use DATABASE_URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db?schema=public

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRATION=86400000  # 24 hours in milliseconds
JWT_EXPIRATION_STRING=24h

# Server
PORT=8001
NODE_ENV=development

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

---

## 📚 Modules

### PrismaModule

Global module that provides `PrismaService` to all modules.

**Features:**
- Database connection management
- Automatic connection on module init
- Automatic disconnection on module destroy
- Query logging in development

### UsersModule

Provides user management functionality.

**Exports:**
- `UserRepository` - Data access layer
- `UserService` - Business logic layer

**Features:**
- User CRUD operations
- Password hashing with bcrypt
- Email validation
- Role management

---

## 🔐 User Service

### UserService Methods

```typescript
// Create user
await userService.create({
  email: 'user@example.com',
  password: 'password123',
  role: UserRoles.USER,
});

// Find user by ID
const user = await userService.findById(userId);

// Find user by email
const user = await userService.findByEmail('user@example.com');

// Update user
await userService.update(userId, {
  email: 'newemail@example.com',
  role: UserRoles.EDITOR,
});

// Delete user
await userService.delete(userId);

// Validate credentials
const user = await userService.validateCredentials(email, password);

// Find all users (with pagination)
const { users, total } = await userService.findAll(skip, take);
```

### Password Hashing

Passwords are automatically hashed using bcrypt with configurable salt rounds (default: 10).

```typescript
// Hash password
const hashedPassword = await userService.hashPassword('plainPassword');

// Verify password
const isValid = await userService.verifyPassword('plainPassword', hashedPassword);
```

---

## 🚀 Usage

### Development

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Production

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

### With Docker Compose

```bash
# Start infrastructure (PostgreSQL)
docker compose up -d postgres

# Run migrations
npx prisma migrate deploy

# Start service
npm run start:prod
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

---

## 📝 Next Steps

1. **Authentication Controllers** - Create login, register, and token refresh endpoints
2. **JWT Strategy** - Implement JWT authentication strategy
3. **Auth Guards** - Use shared guards from `@mediamesh/shared`
4. **Event Publishing** - Publish auth events to Kafka
5. **Password Reset** - Implement password reset functionality
6. **Email Verification** - Add email verification flow

---

## 🔗 Related Documentation

- [Shared Module](../../shared/README.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [JWT Authentication](https://docs.nestjs.com/security/authentication)
