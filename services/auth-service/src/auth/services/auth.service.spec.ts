import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../../users/services/user.service';
import { KafkaService } from '../../kafka/kafka.service';
import { UserRoles, LoginDto, RegisterDto } from '@mediamesh/shared';
import { User } from '../../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let kafkaService: jest.Mocked<KafkaService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRoles.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    toDto: jest.fn().mockReturnValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: '',
      lastName: '',
      role: UserRoles.USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  } as any;

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      validateCredentials: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockKafkaService = {
      emitUserCreated: jest.fn(),
      emitUserUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    kafkaService = module.get(KafkaService);
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

    it('should register a new user and return tokens', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');
      kafkaService.emitUserCreated.mockResolvedValue(undefined);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn');
      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        role: UserRoles.USER,
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(kafkaService.emitUserCreated).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userService.create).not.toHaveBeenCalled();
      expect(kafkaService.emitUserCreated).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user and return tokens', async () => {
      // Arrange
      userService.validateCredentials.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn');
      expect(userService.validateCredentials).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      userService.validateCredentials.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with correct payload', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';
      const role = UserRoles.ADMIN;
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');

      // Act
      const result = await service.generateToken(userId, email, role);

      // Assert
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          role,
        },
        expect.objectContaining({
          secret: expect.any(String),
          expiresIn: expect.any(String),
        }),
      );
    });

    it('should generate different tokens for different users', async () => {
      // Arrange
      jwtService.signAsync
        .mockResolvedValueOnce('token-1')
        .mockResolvedValueOnce('token-2');

      // Act
      const token1 = await service.generateToken('user-1', 'user1@test.com', UserRoles.USER);
      const token2 = await service.generateToken('user-2', 'user2@test.com', UserRoles.EDITOR);

      // Assert
      expect(token1.accessToken).toBe('token-1');
      expect(token2.accessToken).toBe('token-2');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };
      jwtService.verifyAsync.mockResolvedValue(payload);
      userService.findById.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('new-jwt-token');

      // Act
      const result = await service.refreshToken(token);

      // Assert
      expect(result).toHaveProperty('accessToken', 'new-jwt-token');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, expect.any(Object));
      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.signAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.refreshToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const token = 'valid-token';
      const payload = { sub: 'non-existent-user', email: 'test@example.com', role: UserRoles.USER };
      jwtService.verifyAsync.mockResolvedValue(payload);
      userService.findById.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(service.refreshToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should validate user credentials successfully', async () => {
      // Arrange
      userService.validateCredentials.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toEqual(mockUser);
      expect(userService.validateCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should return null for invalid credentials', async () => {
      // Arrange
      userService.validateCredentials.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('test@example.com', 'wrong-password');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const payload = { sub: 'user-123', email: 'test@example.com', role: UserRoles.USER };
      jwtService.verifyAsync.mockResolvedValue(payload);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, expect.any(Object));
    });

    it('should return null for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user DTO', async () => {
      // Arrange
      userService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserById(mockUser.id);

      // Assert
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('role', mockUser.role);
      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      userService.findById.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(service.getUserById('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
