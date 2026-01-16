import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../services/auth.service';
import { UserRoles } from '@mediamesh/shared';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user object from JWT payload', async () => {
      // Arrange
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: UserRoles.USER,
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        firstName: '',
        lastName: '',
      });
    });

    it('should handle different user roles', async () => {
      // Arrange
      const adminPayload = {
        sub: 'admin-123',
        email: 'admin@example.com',
        role: UserRoles.ADMIN,
      };

      // Act
      const result = await strategy.validate(adminPayload);

      // Assert
      expect(result.role).toBe(UserRoles.ADMIN);
    });
  });
});
