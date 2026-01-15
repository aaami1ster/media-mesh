import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';

/**
 * Login DTO
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

/**
 * Register DTO
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;
}

/**
 * Token response DTO
 */
export class TokenResponseDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string = 'Bearer';
}

/**
 * User DTO
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}

export class UserDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
