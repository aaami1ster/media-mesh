# Common Utilities

This module provides common utility functions for use across MediaMesh microservices.

---

## 📦 Categories

### 1. Pagination Utilities (`pagination.util.ts`)

Helper functions for pagination handling.

**Functions:**
- `createPaginationMetadata()` - Create pagination metadata object
- `createPaginatedResponse()` - Create paginated response DTO
- `normalizePagination()` - Normalize and validate pagination parameters
- `extractPagination()` - Extract pagination from query parameters

**Usage:**

```typescript
import { createPaginatedResponse, normalizePagination } from '@shared/utils';

// Normalize pagination
const { page, limit, skip } = normalizePagination(query.page, query.limit);

// Get data from database
const [data, total] = await repository.findAndCount({ skip, take: limit });

// Create paginated response
return createPaginatedResponse(data, total, page, limit);
```

---

### 2. Validation Utilities (`validation.util.ts`)

Validation helper functions for common data types and formats.

**Functions:**
- `isValidEmail()` - Validate email format
- `isValidUUID()` - Validate UUID format
- `isValidUrl()` - Validate URL format
- `isValidDate()` - Validate date string
- `isNotEmpty()` - Check if value is not empty
- `isValidLength()` - Validate string length
- `isInRange()` - Validate numeric range
- `isValidEnum()` - Validate enum value
- `createValidationErrors()` - Create validation error array
- `validateOrThrow()` - Throw validation exception if condition fails
- `sanitizeString()` - Sanitize string input
- `validateAndSanitizeEmail()` - Validate and sanitize email

**Usage:**

```typescript
import { isValidEmail, validateOrThrow, isValidUUID } from '@shared/utils';

// Validate email
if (!isValidEmail(email)) {
  throw new ValidationException('Invalid email format');
}

// Validate with throw helper
validateOrThrow(isValidUUID(id), 'Invalid UUID format', 'id');

// Validate and sanitize email
const cleanEmail = validateAndSanitizeEmail(userInput);
```

---

### 3. Date/Time Utilities (`date.util.ts`)

Date and time manipulation and formatting functions.

**Functions:**
- `formatDate()` - Format date to ISO string
- `formatDateReadable()` - Format date to readable string
- `formatDateTime()` - Format date with time
- `getCurrentTimestamp()` - Get current timestamp (ISO)
- `getCurrentTimestampMs()` - Get current timestamp (milliseconds)
- `addDays()` - Add days to date
- `addHours()` - Add hours to date
- `addMinutes()` - Add minutes to date
- `getDifferenceMs()` - Get difference in milliseconds
- `getDifferenceSeconds()` - Get difference in seconds
- `getDifferenceMinutes()` - Get difference in minutes
- `getDifferenceHours()` - Get difference in hours
- `getDifferenceDays()` - Get difference in days
- `isPast()` - Check if date is in the past
- `isFuture()` - Check if date is in the future
- `isToday()` - Check if date is today
- `formatDuration()` - Format duration to human-readable string
- `parseDate()` - Parse date string with validation

**Usage:**

```typescript
import {
  formatDate,
  addDays,
  getDifferenceDays,
  isPast,
  formatDuration,
} from '@shared/utils';

// Format date
const isoDate = formatDate(new Date());

// Add days
const expiryDate = addDays(new Date(), 30);

// Calculate difference
const daysDiff = getDifferenceDays(startDate, endDate);

// Check if expired
if (isPast(expiryDate)) {
  throw new Error('Token expired');
}

// Format duration
const duration = formatDuration(150000); // "2m 30s"
```

---

### 4. String Utilities (`string.util.ts`)

String manipulation and transformation functions.

**Functions:**
- `capitalize()` - Capitalize first letter
- `capitalizeWords()` - Capitalize first letter of each word
- `toCamelCase()` - Convert to camelCase
- `toKebabCase()` - Convert to kebab-case
- `toSnakeCase()` - Convert to snake_case
- `toPascalCase()` - Convert to PascalCase
- `truncate()` - Truncate string to length
- `removeWhitespace()` - Remove all whitespace
- `removeSpecialChars()` - Remove special characters
- `randomString()` - Generate random string
- `randomAlphanumeric()` - Generate random alphanumeric string
- `randomNumeric()` - Generate random numeric string
- `maskString()` - Mask sensitive string
- `maskEmail()` - Mask email address
- `extractDomain()` - Extract domain from email
- `extractUsername()` - Extract username from email
- `slugify()` - Convert to URL-friendly slug
- `isEmpty()` - Check if string is empty
- `contains()` - Check if string contains substring (case-insensitive)
- `stripHtml()` - Remove HTML tags
- `escapeHtml()` - Escape HTML special characters
- `unescapeHtml()` - Unescape HTML special characters

**Usage:**

```typescript
import {
  capitalize,
  toKebabCase,
  slugify,
  maskEmail,
  truncate,
} from '@shared/utils';

// Capitalize
const title = capitalize('hello world'); // "Hello world"

// Convert to kebab-case
const slug = toKebabCase('Hello World'); // "hello-world"

// Slugify for URLs
const urlSlug = slugify('Hello, World!'); // "hello-world"

// Mask email
const masked = maskEmail('user@example.com'); // "u***@example.com"

// Truncate
const short = truncate('Long text here', 10); // "Long te..."
```

---

### 5. Exception Utilities (`exception.util.ts`)

Helper functions for working with exceptions.

**Note:** Exception classes are defined in `shared/exceptions/exception-types.ts`. These utilities provide helper functions for throwing and checking exceptions.

**Functions:**
- `throwIfNotFound()` - Throw NotFoundException if value is null/undefined
- `throwIfUnauthorized()` - Throw UnauthorizedException if condition is false
- `throwIfForbidden()` - Throw ForbiddenException if condition is false
- `throwIfConflict()` - Throw ConflictException if condition is false
- `throwIfInvalid()` - Throw ValidationException if condition is false
- `throwIfBusinessError()` - Throw BusinessException if condition is false
- `isBusinessException()` - Check if error is BusinessException
- `isValidationException()` - Check if error is ValidationException
- `isNotFoundException()` - Check if error is NotFoundException

**Usage:**

```typescript
import {
  throwIfNotFound,
  throwIfUnauthorized,
  throwIfForbidden,
  isBusinessException,
} from '@shared/utils';

// Throw if not found
const user = await this.userService.findById(id);
throwIfNotFound(user, 'User', id);

// Throw if unauthorized
throwIfUnauthorized(user.isActive, 'User account is inactive');

// Throw if forbidden
throwIfForbidden(user.role === 'ADMIN', 'Admin access required');

// Check exception type
try {
  await this.service.doSomething();
} catch (error) {
  if (isBusinessException(error)) {
    // Handle business exception
  }
}
```

---

## 📚 Complete Example

```typescript
import {
  // Pagination
  createPaginatedResponse,
  normalizePagination,
  // Validation
  isValidEmail,
  validateAndSanitizeEmail,
  // Date/Time
  formatDate,
  addDays,
  isPast,
  // String
  slugify,
  maskEmail,
  // Exceptions
  throwIfNotFound,
  throwIfUnauthorized,
} from '@shared/utils';

@Controller('users')
export class UsersController {
  @Get()
  async findAll(@Query() query: PaginationDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [users, total] = await this.userService.findAndCount(skip, limit);
    return createPaginatedResponse(users, total, page, limit);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    // Validate and sanitize email
    const email = validateAndSanitizeEmail(dto.email);
    
    // Check if user exists
    const existing = await this.userService.findByEmail(email);
    throwIfNotFound(!existing, 'User', 'email already exists');
    
    // Create user
    const user = await this.userService.create({ ...dto, email });
    
    // Format dates
    return {
      ...user,
      createdAt: formatDate(user.createdAt),
      email: maskEmail(user.email), // Mask in response
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    throwIfNotFound(user, 'User', id);
    throwIfUnauthorized(user.isActive, 'User account is inactive');
    return user;
  }
}
```

---

## 🎯 Best Practices

1. **Use pagination utilities** - Always normalize pagination parameters before database queries
2. **Validate early** - Use validation utilities before processing data
3. **Consistent date formatting** - Use date utilities for consistent date handling
4. **String sanitization** - Sanitize user input before storing or displaying
5. **Exception helpers** - Use exception utilities for consistent error handling
6. **Type safety** - All utilities are fully typed with TypeScript

---

## 📝 Notes

- All utilities are pure functions (no side effects)
- All utilities are fully typed with TypeScript
- Exception classes are defined in `shared/exceptions/exception-types.ts`
- Pagination DTOs are defined in `shared/dto/common.dto.ts`
