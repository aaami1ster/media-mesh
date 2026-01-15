// Exception types and interfaces

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  correlationId?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class BusinessException extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'BusinessException';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationException extends BusinessException {
  constructor(
    message: string = 'Validation failed',
    public readonly errors?: ValidationError[],
  ) {
    super(message, 400, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationException';
  }
}

export class NotFoundException extends BusinessException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundException';
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenException';
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictException';
  }
}
