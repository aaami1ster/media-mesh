import { ValidationException, ValidationError } from '../exceptions';

/**
 * Validation utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date string (ISO format)
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate that value is not empty
 */
export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  return true;
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  min?: number,
  max?: number,
): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const length = value.length;
  if (min !== undefined && length < min) {
    return false;
  }
  if (max !== undefined && length > max) {
    return false;
  }
  return true;
}

/**
 * Validate numeric range
 */
export function isInRange(
  value: number,
  min?: number,
  max?: number,
): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
}

/**
 * Validate enum value
 */
export function isValidEnum<T extends string>(
  value: string,
  enumObject: Record<string, T>,
): value is T {
  return Object.values(enumObject).includes(value as T);
}

/**
 * Create validation errors from object
 */
export function createValidationErrors(
  errors: Record<string, string>,
): ValidationError[] {
  return Object.entries(errors).map(([field, message]) => ({
    field,
    message,
  }));
}

/**
 * Throw validation exception if validation fails
 */
export function validateOrThrow(
  condition: boolean,
  message: string,
  field?: string,
): void {
  if (!condition) {
    const errors: ValidationError[] = field
      ? [{ field, message }]
      : [{ field: 'validation', message }];
    throw new ValidationException(message, errors);
  }
}

/**
 * Sanitize string (remove special characters, trim)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate and sanitize email
 */
export function validateAndSanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    throw new ValidationException('Invalid email format', [
      { field: 'email', message: 'Email must be a valid email address' },
    ]);
  }
  return trimmed;
}
