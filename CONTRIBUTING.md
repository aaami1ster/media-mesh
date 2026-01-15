# Contributing to MediaMesh

Thank you for your interest in contributing to the MediaMesh project! This document outlines the naming conventions and coding standards to maintain consistency across the codebase.

## Naming Conventions

### Files and Directories

- **File Names**: Use kebab-case in singular form (e.g., `user.service.ts`, `auth-guard.ts`)
- **Directory Names**: Use kebab-case in singular form (e.g., `src/module/user`, `src/common/util`)
- **Component Files**: Name files according to their type:
  - Controllers: `*.controller.ts`
  - Services: `*.service.ts`
  - Models: `*.model.ts`
  - DTOs: `*.dto.ts`
  - Resolvers: `*.resolver.ts`
  - Guards: `*.guard.ts`
  - Decorators: `*.decorator.ts`
  - Constants: `*.constants.ts`
  - Schemas: `*.schema.ts`

| Part                 | Convention | Format     | Example            |
| -------------------- | ---------- | ---------- | ------------------ |
| Folder name          | Singular   | kebab-case | `user/`            |
| File name (module)   | Singular   | kebab-case | `user.module.ts`   |
| File name (service)  | Singular   | kebab-case | `user.service.ts`  |
| File name (resolver) | Singular   | kebab-case | `user.resolver.ts` |
| File name (model)    | Singular   | kebab-case | `user.model.ts`    |

### Code Elements

- **Module Names**: Use PascalCase in singular form (e.g., `UserModule`, `AuthModule`)
- **Classes**: Use PascalCase in singular form (e.g., `UserService`, `AuthGuard`)
- **Interfaces**: Use PascalCase with 'I' prefix in singular form (e.g., `IUser`, `IAuthOption`)
- **Enums**: Use PascalCase in singular form (e.g., `UserRole`, `QuestionDifficulty`)
- **Functions/Methods**: Use camelCase and avoid repeating the class name (e.g., `create()`, `find()`, `update()` instead of `createUser()`, `findUsers()`, `updateUser()`)
- **Variables**: Use camelCase (e.g., `userData`, `isAuthenticated`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)
- **Private Members**: Use camelCase with underscore prefix (e.g., `_privateMethod`, `_privateVariable`) or without prefix
- **Database Tables**: Use snake_case in plural form (e.g., `users`, `user_roles`)
- **Database Columns**: Use snake_case (e.g., `first_name`, `created_at`)

| Part                      | Convention                | Format     | Example                                                   |
| ------------------------- | ------------------------- | ---------- | --------------------------------------------------------- |
| Module class name         | Singular + `Module`       | PascalCase | `UserModule`                                              |
| Service class name        | Singular + `Service`      | PascalCase | `UserService`                                             |
| Resolver class name       | Singular + `Resolver`     | PascalCase | `UserResolver`                                            |
| Model class name          | Singular                  | PascalCase | `User`                                                    |
| Service CRUD methods      | Standard verbs            | camelCase  | `findOne()`, `find()`, `create()`, `update()`, `delete()` |
| Service custom methods    | Verb only                 | camelCase  | `validate()`, `process()`, `transform()`                  |
| Resolver internal methods | Verb only (no class name) | camelCase  | `get()`, `create()`, `update()`                           |
| Resolver API methods      | Verb + entity             | camelCase  | `getUser()`, `createUser()`                               |

### Service Method Naming

For services, use the following standard method names for CRUD operations:

1. **Standard CRUD Methods**:

   ```typescript
   @Injectable()
   export class UserService {
     // Find one entity by ID
     findById(id: string): Promise<User> {
       return this.userRepository.findById({ where: { id } });
     }

     // Find list of entities (with optional filters)
     find(filters?: any): Promise<User[]> {
       return this.userRepository.find({ where: filters });
     }

     // Create a new entity
     create(data: CreateUserInput): Promise<User> {
       return this.userRepository.save(data);
     }

     // Update an existing entity
     update(id: string, data: UpdateUserInput): Promise<User> {
       return this.userRepository.update(id, data);
     }

     // Delete an entity
     delete(id: string): Promise<boolean> {
       return this.userRepository.delete(id);
     }
   }
   ```

2. **Custom Methods**: For methods that perform specific operations beyond CRUD, use descriptive verbs without repeating the class name:
   ```typescript
   // Custom methods
   validate(data: any): boolean { ... }
   process(data: any): Promise<any> { ... }
   transform(data: any): any { ... }
   ```

### GraphQL

- **Types**: Use PascalCase in singular form (e.g., `User`, `Question`)
- **Queries**: Use camelCase (e.g., `findUserById`, `findQuestions`)
- **Mutations**: Use camelCase with verb prefix (e.g., `createUser`, `updateQuestion`)
- **Input Types**: Use PascalCase with 'Input' suffix in singular form (e.g., `CreateUserInput`, `UpdateQuestionInput`)
- **Arguments**: Use camelCase (e.g., `userId`, `questionId`)

#### Resolver Method Naming

For resolvers, there are two naming conventions to consider:

1. **Method Names**: These are the actual method names in your resolver class. They should follow the same convention as service methods - use verbs only without repeating the class name. e.g `findById`
2. **API Method Names**: These are the names exposed in your GraphQL API. They should include the entity name for clarity. e.g `findUserById`

   ```typescript
   @Resolver(() => User)
   export class UserResolver {
     // API method name
     @Query(() => User, { name: 'findUserById' })
     // method name
     async findById(@Args('input') input: FindUserByIdInput) {
       return this.userService.findById(input.id);
     }
   }
   ```

This separation allows you to keep your internal code clean and consistent while providing clear, descriptive names in your API.

#### Resolver Method Arguments

All resolver method arguments should be objects that can be validated using class-validator. This ensures consistent validation across your application.

1. **Input DTOs**: Create a separate DTO class for each resolver method's arguments:

   ```typescript
   // user.dto.ts
   import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
   import { Field, InputType } from '@nestjs/graphql';

   @InputType()
   export class FindUserByIdInput {
     @Field()
     @IsString()
     id: string;
   }

   @InputType()
   export class CreateUserInput {
     @Field()
     @IsString()
     @MinLength(2)
     firstName: string;

     @Field()
     @IsString()
     @MinLength(2)
     lastName: string;

     @Field()
     @IsEmail()
     email: string;

     @Field({ nullable: true })
     @IsOptional()
     @IsString()
     phoneNumber?: string;
   }
   ```

2. **Using Input DTOs in Resolvers**: Use the `@Args()` decorator with the input DTO class:

   ```typescript
   @Resolver(() => User)
   export class UserResolver {
     constructor(private readonly userService: UserService) {}

     @Query(() => User, { name: 'findUserById' })
     async findById(@Args('input') input: FindUserByIdInput) {
       return this.userService.findById(input.id);
     }

     @Mutation(() => User, { name: 'createUser' })
     async create(@Args('input') input: CreateUserInput) {
       return this.userService.create(input);
     }
   }
   ```

3. **Global Validation**: Enable validation globally in your application:

   ```typescript
   // main.ts
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from './app.module';
   import { ValidationPipe } from '@nestjs/common';

   async function bootstrap() {
     const app = await NestFactory.create(AppModule);

     // Enable validation globally
     app.useGlobalPipes(
       new ValidationPipe({
         whitelist: true, // Strip properties that don't have decorators
         transform: true, // Transform payloads to DTO instances
         forbidNonWhitelisted: true, // Throw errors if non-whitelisted properties are present
       }),
     );

     await app.listen(3000);
   }
   bootstrap();
   ```

This approach ensures that all inputs are properly validated before reaching your business logic, reducing the need for manual validation in your service methods.

## Environment Variables

We use environment variables to manage configuration across different environments. Follow these guidelines when working with environment variables:

### Using .env Files

1. **Create a .env file**: Each developer should create a `.env` file in the project root with their local configuration.

2. **Load environment variables**: Use the `dotenv` package to load environment variables:

   ```typescript
   // main.ts
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from './app.module';
   import { ValidationPipe } from '@nestjs/common';
   import * as dotenv from 'dotenv';

   // Load environment variables from .env file
   dotenv.config();

   async function bootstrap() {
     const app = await NestFactory.create(AppModule);

     // Enable validation globally
     app.useGlobalPipes(
       new ValidationPipe({
         whitelist: true,
         transform: true,
         forbidNonWhitelisted: true,
       }),
     );

     await app.listen(3000);
   }
   bootstrap();
   ```

3. **Access environment variables**: Use `process.env` to access environment variables in your code:

   ```typescript
   // config/database.config.ts
   export const databaseConfig = {
     host: process.env.DB_HOST || 'localhost',
     port: parseInt(process.env.DB_PORT, 10) || 5432,
     username: process.env.DB_USERNAME || 'postgres',
     password: process.env.DB_PASSWORD || 'postgres',
     database: process.env.DB_DATABASE || 'mediamesh',
   };
   ```

### Centralized Environment Configuration

To ensure consistent access to environment variables with proper default values, create a centralized constants file:

1. **Create an environment constants file**:

   ```typescript
   // src/config/env.constants.ts
   import * as dotenv from 'dotenv';

   // Load environment variables from .env file
   dotenv.config();

   // Database configuration
   export const DB_CONFIG = {
     HOST: process.env.DB_HOST || 'localhost',
     PORT: parseInt(process.env.DB_PORT, 10) || 5432,
     USERNAME: process.env.DB_USERNAME || 'postgres',
     PASSWORD: process.env.DB_PASSWORD || 'postgres',
     DATABASE: process.env.DB_DATABASE || 'mediamesh',
   };

   // JWT configuration
   export const JWT_CONFIG = {
     SECRET: process.env.JWT_SECRET || 'default_jwt_secret_key',
     EXPIRATION: process.env.JWT_EXPIRATION || '1d',
   };

   // Server configuration
   export const SERVER_CONFIG = {
     PORT: parseInt(process.env.PORT, 10) || 3000,
     NODE_ENV: process.env.NODE_ENV || 'development',
   };

   // API configuration
   export const API_CONFIG = {
     PREFIX: process.env.API_PREFIX || '/api',
     VERSION: process.env.API_VERSION || 'v1',
   };

   // File upload configuration
   export const UPLOAD_CONFIG = {
     MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
     ALLOWED_MIME_TYPES: (
       process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,application/pdf'
     ).split(','),
   };

   // Export all configuration as a single object
   export const ENV_CONFIG = {
     DB: DB_CONFIG,
     JWT: JWT_CONFIG,
     SERVER: SERVER_CONFIG,
     API: API_CONFIG,
     UPLOAD: UPLOAD_CONFIG,
   };
   ```

2. **Use the constants file in your application**:

   ```typescript
   // src/config/database.config.ts
   import { DB_CONFIG } from './env.constants';

   export const databaseConfig = {
     host: DB_CONFIG.HOST,
     port: DB_CONFIG.PORT,
     username: DB_CONFIG.USERNAME,
     password: DB_CONFIG.PASSWORD,
     database: DB_CONFIG.DATABASE,
   };
   ```

   ```typescript
   // src/auth/auth.service.ts
   import { JWT_CONFIG } from '../config/env.constants';

   @Injectable()
   export class AuthService {
     generateToken(user: User): string {
       return jwt.sign({ sub: user.id, email: user.email }, JWT_CONFIG.SECRET, {
         expiresIn: JWT_CONFIG.EXPIRATION,
       });
     }
   }
   ```

   ```typescript
   // main.ts
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from './app.module';
   import { ValidationPipe } from '@nestjs/common';
   import { SERVER_CONFIG } from './config/env.constants';

   async function bootstrap() {
     const app = await NestFactory.create(AppModule);

     app.useGlobalPipes(
       new ValidationPipe({
         whitelist: true,
         transform: true,
         forbidNonWhitelisted: true,
       }),
     );

     await app.listen(SERVER_CONFIG.PORT);
     console.log(`Application is running on: http://localhost:${SERVER_CONFIG.PORT}`);
   }
   bootstrap();
   ```

3. **Benefits of this approach**:

   - **Centralized configuration**: All environment variables are defined in one place
   - **Default values**: Each variable has a sensible default value
   - **Type safety**: Constants are properly typed
   - **IntelliSense support**: Better code completion in your IDE
   - **Easier testing**: You can mock the constants file for testing
   - **Documentation**: The constants file serves as documentation for all available configuration options

### Never Commit .env Files

1. **Add .env to .gitignore**: Ensure `.env` is listed in your `.gitignore` file:

   ```
   # .gitignore
   # Environment variables
   .env
   .env.*
   !.env.example
   ```

2. **Create a .env.example file**: Provide a template for other developers:

   ```
   # .env.example
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=mediamesh

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=1d

   # Server
   PORT=3000
   NODE_ENV=development
   ```

3. **Document required environment variables**: List all required environment variables in your README.md:

   ## Environment Variables

   The following environment variables are required:

   | Variable       | Description         | Default     |
   | -------------- | ------------------- | ----------- |
   | DB_HOST        | Database host       | localhost   |
   | DB_PORT        | Database port       | 5432        |
   | DB_USERNAME    | Database username   | postgres    |
   | DB_PASSWORD    | Database password   | postgres    |
   | DB_DATABASE    | Database name       | mediamesh      |
   | JWT_SECRET     | JWT secret key      | -           |
   | JWT_EXPIRATION | JWT expiration time | 1d          |
   | PORT           | Server port         | 3000        |
   | NODE_ENV       | Environment         | development |

4. **Use environment-specific .env files**: For different environments, use `.env.development`, `.env.production`, etc., and load the appropriate one based on `NODE_ENV`.

## Git Best Practices

We follow a structured approach to Git branching and naming to maintain a clean and organized repository. Follow these guidelines for all Git operations:

### Branching Strategy

We use a simplified Git Flow branching model with the following branches:

1. **Main Branches**:

   - `main`: Production-ready code, where code is always stable and deployable.
   - `develop`: Integration branch for features. The code here may not always be production-ready, but it’s always stable enough to test and integrate new changes.

1. **Feature Branches**

   - Feature branches are used to develop new features or significant changes.
   - Naming Convention: `feature/<TASK_ID>-<short-description>`
   - Base Branch: `develop`
   - Lifecycle:

     - Create a feature branch from `develop`.
     - Work on the feature, commit often.
     - When finished, open a pull/merge request (PR) from the feature branch to `develop`.

   - Example:
     ```sh
     git checkout -b feature/CU-abc123-create-user-form develop
     ```

1. **Bugfix Branches**

   - Bugfix branches are used to address bugs in the codebase that need to be fixed immediately or in the near future.
   - Naming Convention: `bugfix/<TASK_ID>-<short-description>`
   - Base Branch: `develop`
   - Lifecycle:
     - Create a bugfix branch from `develop`.
     - Work on fixing the bug.
     - Open a PR once the fix is complete to `develop`.
   - Example:
     ```sh
     git checkout -b bugfix/CU-def456-fix-user-login develop
     ```

1. **Hotfix Branches**
   - Hotfixes are urgent fixes that must be applied directly to the production code (main branch). These are typically used for critical issues that cannot wait for the next release cycle.
   - Naming Convention: `hotfix/<TASK_ID>-<short-description>`
   - Base Branch: `main`
   - Lifecycle:
     - Create a hotfix branch from `main`.
     - Once the hotfix is applied, merge it back into both `main` and `develop` to ensure that the fix is applied to both production and the next release.
   - Example:
     ```sh
     git checkout -b hotfix/CU-ghi789-fix-production-bug main
     ```
1. **Release Branches**
   - Release branches are used for preparing a new production release. These are the final preparations, like versioning, bug fixing, and documentation.
   - Naming Convention: `release/<version>`
   - Base Branch: `develop`
   - Lifecycle:
     - Create a release branch from `develop`.
     - Perform any final bug fixing, versioning, and documentation.
     - Merge it into main and `develop` once ready.
     - Tag the release in main (e.g., v1.0.0).
   - Example:
     ```sh
     git checkout -b release/v1.0.0 develop
     ```

### 🔧 Git Flow Workflow (Best Practices)

1. Create feature/bugfix branches from develop:
   - Use descriptive names, and ensure that you work on one issue per branch.
1. Merge feature/bugfix branches into develop via PR:
   - Always ensure code is reviewed before merging.
1. Use release branches for preparing production releases:
   - Once all features and fixes are merged into develop, create a release branch.
   - Perform final testing and fixes here.
   - Once stable, merge into main and tag the release.
1. Use hotfix branches for urgent fixes on production:
   - Always branch from main for hotfixes.
   - After fixing the issue, merge it back into both main and develop.

### 📚 Branch Naming Conventions

| Type    | Example                               |
| ------- | ------------------------------------- |
| Feature | `feature/CU-abc123-create-user-form`  |
| Bugfix  | `bugfix/CU-def456-fix-user-login`     |
| Hotfix  | `hotfix/CU-ghi789-fix-production-bug` |
| Release | `release/v1.0.0`                      |

### 📈 Example Workflow

1. Start a Feature or Bugfix

   ```bash
   git checkout -b feature/CU-abc123-create-user-form develop
   # Work on feature, commit changes
   git commit -m "Added create user form"
   git push origin feature/CU-abc123-create-user-form
   ```

1. Create a PR and Merge to Develop

   After completing the work, open a PR to merge back into develop.

1. Release Preparation

   Once your team merges everything into develop, create a release branch:

   ```bash
   git checkout -b release/v1.0.0 develop
   # Final bug fixes, versioning, and testing
   git commit -m "Final fixes for release v1.0.0"
   git push origin release/v1.0.0
   ```

1. Merge Release into Main
   After testing and confirming the release branch, merge it into main and tag the release.

   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin main --tags
   ```

1. Hotfix Process

   For urgent fixes in production, create a hotfix branch from main:

   ```bash
   git checkout -b hotfix/CU-xyz987-fix-production-bug main

   # Fix the issue, test it
   git commit -m "Fix production issue"
   git push origin hotfix/CU-xyz987-fix-production-bug
   ```

   Then, merge the hotfix into both main and develop:

   ```bash
   git checkout main
   git merge hotfix/CU-xyz987-fix-production-bug
   git checkout develop
   git merge hotfix/CU-xyz987-fix-production-bug
   ```

### 🔒 Additional Tips

- Rebasing: For cleaner history, rebasing feature branches onto develop before merging can avoid unnecessary merge commits.
- CI/CD Integration: If you have CI/CD pipelines, always trigger them for feature and release branches to run tests automatically.
- Tagging: **Tags can only be created from the main branch**. The CI/CD pipeline automatically creates tags from package.json version when code is merged to main. Manual tag creation is also restricted to main branch via git hooks.
  - To pull without tags: `git pull --no-tags origin develop`
  - To fetch tags explicitly: `git fetch origin --tags`

### Branch Retention Policy

We maintain a policy of keeping all branches after merging for the following reasons:

1. **Historical Reference**: Branches provide a clear history of feature development and bug fixes
2. **Future Development**: Branches may be needed for future work on the same feature
3. **Audit Trail**: Keeps a complete record of all development work
4. **Revert Capability**: Makes it easier to revert changes if needed

When creating merge requests, do not select the "Delete branch after merge" option. All branches should be preserved in the repository.

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

1. **Types**:

   - `feature`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation changes
   - `style`: Changes that don't affect code meaning (formatting, etc.)
   - `refactor`: Code changes that neither fix bugs nor add features
   - `perf`: Performance improvements
   - `test`: Adding or correcting tests
   - `chore`: Changes to the build process or auxiliary tools

2. **Scope**:

   - The part of the codebase affected (e.g., `auth`, `user`, `file-upload`)

3. **Description**:

   - A concise summary of the change in imperative mood

4. **Examples**:
   ```
   feature(auth): implement JWT authentication
   fix(user): resolve user creation validation error
   docs(api): update GraphQL schema documentation
   ```

### Pull/Merge Request Guidelines

1. **Title**: Use the same format as commit messages
2. **Description**: Include:
   - What changes were made
   - Why the changes were made
   - Any related issues
   - Testing instructions
3. **Review Process**:
   - At least one approval required
   - All CI checks must pass
   - No merge conflicts

### Git Hooks

We use Git hooks to enforce our standards:

1. **Pre-commit**: Run linting and tests
2. **Commit-msg**: Validate commit message format
3. **Pre-push**: Run additional checks and **prevent tag creation from non-main branches**
   - Tags can only be created from the `main` branch
   - Attempting to push a tag from any other branch will be rejected

## Recommended Extensions

To maintain code quality and consistency, we recommend using the following extensions in your development environment:

### Code Quality Extensions

1. **ESLint**: For JavaScript and TypeScript linting

   - Install: `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
   - Configuration: Create `.eslintrc.js` in the project root

2. **Prettier**: For code formatting

   - Install: `npm install --save-dev prettier`
   - Configuration: Create `.prettierrc` in the project root

3. **Code Spell Checker**: For catching spelling mistakes in code

   - VS Code Extension: "Code Spell Checker" by Street Side Software
   - Additional dictionaries: "Code Spell Checker: Medical Terms" for domain-specific terms

4. **SonarLint**: For code quality and security analysis

   - VS Code Extension: "SonarLint" by SonarSource

5. **GitLens**: For enhanced Git integration

   - VS Code Extension: "GitLens" by GitKraken

6. **Error Lens**: For inline error display

   - VS Code Extension: "Error Lens" by Alexander

7. **Import Cost**: To visualize the size of imported packages

   - VS Code Extension: "Import Cost" by Wix

8. **TypeScript Hero**: For organizing and sorting imports

   - VS Code Extension: "TypeScript Hero" by Christoph Bühler

9. **NestJS Snippets**: For NestJS-specific code snippets

   - VS Code Extension: "NestJS Snippets" by Ali Alperen

10. **GraphQL**: For GraphQL syntax highlighting and validation
    - VS Code Extension: "GraphQL" by GraphQL Foundation

### Recommended Settings

1. Created a .vscode directory in your project root
1. Add the following to your VS Code settings (`settings.json`):

   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "typescript.tsdk": "node_modules/typescript/lib",
     "typescript.enablePromptUseWorkspaceTsdk": true,
     "cSpell.words": [
       "nestjs",
       "graphql",
       "apollo",
       "typeorm",
       "class-validator",
       "class-transformer",
       "joi",
       "kebab-case",
       "camelCase",
       "PascalCase",
       "snake_case",
       "UPPER_SNAKE_CASE"
     ]
   }
   ```

1. Created a settings.json file with the following settings:
   - Enabled format on save
   - Set Prettier as the default formatter
   - Configured ESLint to run on save
   - Set up specific formatters for TypeScript and JavaScript files
   - Configured Prettier to use your project's configuration
1. To make this work, you'll need to have the following VS Code extensions installed:
   - ESLint (dbaeumer.vscode-eslint)
   - Prettier (esbenp.prettier-vscode)

## Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons at the end of statements
- Use trailing commas in multi-line objects and arrays
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused on a single responsibility

## Git Workflow

- Use feature branches for new features and bug fixes
- Use descriptive commit messages
- Squash commits before merging to main branch
- Create pull requests for code review

## Testing

- Write unit tests for services and utilities
- Write integration tests for controllers and resolvers
- Use descriptive test names that explain what is being tested

## Documentation

- Document public APIs and interfaces
- Add JSDoc comments for complex functions
- Keep README.md up to date with setup instructions

Thank you for following these guidelines to maintain code quality and consistency!
