import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Register DTO for Swagger documentation
 * 
 * This DTO mirrors the RegisterDto from @mediamesh/shared
 * but includes Swagger decorators for proper API documentation.
 */
export class RegisterDto {
  @ApiProperty({
    name: 'email',
    description: 'User email address',
    example: 'user@example.com',
    type: String,
    format: 'email',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'User password (minimum 8 characters)',
    example: 'SecurePassword123!',
    type: String,
    minLength: 8,
    maxLength: 100,
    format: 'password',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;

  @ApiProperty({
    name: 'firstName',
    description: 'User first name',
    example: 'John',
    type: String,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    name: 'lastName',
    description: 'User last name',
    example: 'Doe',
    type: String,
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;
}

/**
 * Login DTO for Swagger documentation
 * 
 * This DTO mirrors the LoginDto from @mediamesh/shared
 * but includes Swagger decorators for proper API documentation.
 */
export class LoginDto {
  @ApiProperty({
    name: 'email',
    description: 'User email address',
    example: 'user@example.com',
    type: String,
    format: 'email',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    name: 'password',
    description: 'User password (minimum 8 characters)',
    example: 'SecurePassword123!',
    type: String,
    format: 'password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

/**
 * Token Response DTO for Swagger documentation
 */
export class TokenResponseDto {
  @ApiProperty({
    name: 'accessToken',
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    type: String,
  })
  accessToken: string;

  @ApiPropertyOptional({
    name: 'refreshToken',
    description: 'JWT refresh token (optional)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    type: String,
  })
  refreshToken?: string;

  @ApiProperty({
    name: 'expiresIn',
    description: 'Token expiration time in seconds',
    example: 3600,
    type: Number,
  })
  expiresIn: number;

  @ApiProperty({
    name: 'tokenType',
    description: 'Token type (usually "Bearer")',
    example: 'Bearer',
    type: String,
    default: 'Bearer',
  })
  tokenType: string;
}

/**
 * User DTO for Swagger documentation
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}

export class UserDto {
  @ApiProperty({
    name: 'id',
    description: 'Unique user identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
  })
  id: string;

  @ApiProperty({
    name: 'email',
    description: 'User email address',
    example: 'user@example.com',
    type: String,
    format: 'email',
  })
  email: string;

  @ApiProperty({
    name: 'firstName',
    description: 'User first name',
    example: 'John',
    type: String,
  })
  firstName: string;

  @ApiProperty({
    name: 'lastName',
    description: 'User last name',
    example: 'Doe',
    type: String,
  })
  lastName: string;

  @ApiProperty({
    name: 'role',
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiPropertyOptional({
    name: 'createdAt',
    description: 'User creation timestamp (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  createdAt?: string;

  @ApiPropertyOptional({
    name: 'updatedAt',
    description: 'User last update timestamp (ISO 8601)',
    example: '2024-01-16T14:20:00.000Z',
    type: String,
  })
  updatedAt?: string;
}
