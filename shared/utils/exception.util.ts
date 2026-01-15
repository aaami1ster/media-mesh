/**
 * Exception utility functions
 * 
 * Note: Exception classes are defined in shared/exceptions/exception-types.ts
 * These utilities provide helper functions for working with exceptions.
 */

import {
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  ValidationException,
  BusinessException,
} from '../exceptions';

/**
 * Throw NotFoundException if value is null or undefined
 */
export function throwIfNotFound<T>(
  value: T | null | undefined,
  resource: string,
  identifier?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundException(resource, identifier);
  }
}

/**
 * Throw UnauthorizedException if condition is false
 */
export function throwIfUnauthorized(
  condition: boolean,
  message: string = 'Unauthorized',
): asserts condition {
  if (!condition) {
    throw new UnauthorizedException(message);
  }
}

/**
 * Throw ForbiddenException if condition is false
 */
export function throwIfForbidden(
  condition: boolean,
  message: string = 'Forbidden',
): asserts condition {
  if (!condition) {
    throw new ForbiddenException(message);
  }
}

/**
 * Throw ConflictException if condition is false
 */
export function throwIfConflict(
  condition: boolean,
  message: string = 'Resource conflict',
): asserts condition {
  if (!condition) {
    throw new ConflictException(message);
  }
}

/**
 * Throw ValidationException if condition is false
 */
export function throwIfInvalid(
  condition: boolean,
  message: string,
  field?: string,
): asserts condition {
  if (!condition) {
    throw new ValidationException(message, field ? [{ field, message }] : undefined);
  }
}

/**
 * Throw BusinessException if condition is false
 */
export function throwIfBusinessError(
  condition: boolean,
  message: string,
  statusCode: number = 400,
  code?: string,
): asserts condition {
  if (!condition) {
    throw new BusinessException(message, statusCode, code);
  }
}

/**
 * Check if error is a known business exception
 */
export function isBusinessException(error: any): error is BusinessException {
  return error instanceof BusinessException;
}

/**
 * Check if error is a validation exception
 */
export function isValidationException(error: any): error is ValidationException {
  return error instanceof ValidationException;
}

/**
 * Check if error is a not found exception
 */
export function isNotFoundException(error: any): error is NotFoundException {
  return error instanceof NotFoundException;
}
