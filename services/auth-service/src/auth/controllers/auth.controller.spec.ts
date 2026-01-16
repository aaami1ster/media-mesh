import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, TokenResponseDto, UserDto, JwtAuthGuard } from '@mediamesh/shared';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockTokenResponse: TokenResponseDto = {
    accessToken: 'mock-jwt-token',
    tokenType: 'Bearer',
    expiresIn: 86400000,
  };

  const mockUserDto: UserDto = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      getUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user', async () => {
      // Arrange
      authService.register.mockResolvedValue(mockTokenResponse);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(result).toEqual(mockTokenResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      authService.register.mockRejectedValue(
        new ConflictException('User already exists'),
      );

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      // Arrange
      authService.login.mockResolvedValue(mockTokenResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(mockTokenResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const token = 'valid-token';

    it('should refresh token successfully', async () => {
      // Arrange
      authService.refreshToken.mockResolvedValue(mockTokenResponse);

      // Act
      const result = await controller.refreshToken(token);

      // Assert
      expect(result).toEqual(mockTokenResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid token'),
      );

      // Act & Assert
      await expect(controller.refreshToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getCurrentUser', () => {
    const mockRequestUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'USER' as any,
    };

    it('should return current user info', async () => {
      // Arrange
      authService.getUserById.mockResolvedValue(mockUserDto);

      // Act
      const result = await controller.getCurrentUser(mockRequestUser as any);

      // Assert
      expect(result).toEqual(mockUserDto);
      expect(authService.getUserById).toHaveBeenCalledWith(mockRequestUser.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      authService.getUserById.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      // Act & Assert
      await expect(
        controller.getCurrentUser(mockRequestUser as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
