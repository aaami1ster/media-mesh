import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/services/user.service';
import { UserRoles } from '@mediamesh/shared';
import { LoginDto, RegisterDto, TokenResponseDto } from '@mediamesh/shared';
import { JWT_CONFIG } from '../../config/env.constants';

/**
 * Auth Service
 * 
 * Handles authentication and authorization logic:
 * - User login
 * - User registration
 * - Token generation and refresh
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    this.logger.log(`Registering new user: ${registerDto.email}`);

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException(`User with email ${registerDto.email} already exists`);
    }

    // Create user (firstName and lastName are stored but not in User model yet)
    // For now, we'll create the user with email and password
    // TODO: Add firstName and lastName to User model if needed
    const user = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      role: UserRoles.USER,
    });

    // Generate tokens
    const tokens = await this.generateToken(user.id, user.email, user.role);

    this.logger.log(`User registered successfully: ${user.id}`);
    return tokens;
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    this.logger.log(`Login attempt: ${loginDto.email}`);

    // Validate credentials
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateToken(user.id, user.email, user.role);

    this.logger.log(`User logged in successfully: ${user.id}`);
    return tokens;
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string) {
    const user = await this.userService.validateCredentials(email, password);
    return user;
  }

  /**
   * Generate JWT tokens
   */
  async generateToken(
    userId: string,
    email: string,
    role: UserRoles,
  ): Promise<TokenResponseDto> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: JWT_CONFIG.SECRET,
      expiresIn: JWT_CONFIG.EXPIRATION_STRING,
    });

    // Calculate expiration time
    const expiresIn = parseInt(JWT_CONFIG.EXPIRATION, 10);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token: string): Promise<TokenResponseDto> {
    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: JWT_CONFIG.SECRET,
      });

      // Get user to ensure they still exist
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new token
      return await this.generateToken(user.id, user.email, user.role);
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: JWT_CONFIG.SECRET,
      });
      return payload;
    } catch (error) {
      return null;
    }
  }
}
