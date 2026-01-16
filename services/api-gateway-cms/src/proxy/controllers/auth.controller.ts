import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  Public,
  TimeoutInterceptor,
  LoginDto,
  RegisterDto,
  TokenResponseDto,
  UserDto,
} from '@mediamesh/shared';
import { ProxyService } from '../proxy.service';
import { Request } from 'express';
import { RESILIENCE_CONFIG } from '../../config/env.constants';

/**
 * Auth Controller
 * 
 * Routes authentication requests to Auth Service.
 * Base path: /api/v1/auth
 * 
 * Resilience patterns applied:
 * - Timeout: Prevents hanging requests
 * - Circuit Breaker: Protects against cascading failures
 * - Retry: Exponential backoff for transient failures
 */
@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
@UseInterceptors(
  new TimeoutInterceptor({
    timeout: RESILIENCE_CONFIG.REQUEST_TIMEOUT,
    timeoutMessage: 'Request to Auth service timed out',
  }),
)
export class AuthController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    return this.proxyService.proxyToAuth(
      'POST',
      '/auth/register',
      registerDto,
      this.getAuthHeaders(req),
    );
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.proxyService.proxyToAuth(
      'POST',
      '/auth/login',
      loginDto,
      this.getAuthHeaders(req),
    );
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'JWT access token to refresh',
        },
      },
      required: ['token'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async refreshToken(
    @Body('token') token: string,
    @Req() req: Request,
  ) {
    return this.proxyService.proxyToAuth(
      'POST',
      '/auth/refresh',
      { token },
      this.getAuthHeaders(req),
    );
  }

  /**
   * Get current user info
   * GET /api/v1/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user info' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getCurrentUser(@Req() req: Request) {
    return this.proxyService.proxyToAuth(
      'GET',
      '/auth/me',
      undefined,
      this.getAuthHeaders(req),
    );
  }

  /**
   * Extract authorization headers from request
   */
  private getAuthHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    return headers;
  }
}
