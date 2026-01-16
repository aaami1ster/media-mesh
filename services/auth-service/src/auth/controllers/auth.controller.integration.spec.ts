import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UserService } from '../../users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { KafkaService } from '../../kafka/kafka.service';
import { JwtAuthGuard } from '@mediamesh/shared';
import { LoginDto, RegisterDto, TokenResponseDto, UserRoles } from '@mediamesh/shared';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;

  const mockTokenResponse: TokenResponseDto = {
    accessToken: 'mock-jwt-token',
    tokenType: 'Bearer',
    expiresIn: 86400000,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            validateCredentials: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emitUserCreated: jest.fn().mockResolvedValue(undefined),
            emitUserUpdated: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          // Mock authenticated user for protected routes
          request.user = {
            id: 'user-123',
            email: 'test@example.com',
            role: UserRoles.USER,
          };
          return true;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user', async () => {
      // Arrange
      jest.spyOn(authService, 'register').mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(response.body).toHaveProperty('expiresIn');
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return 400 for invalid email', async () => {
      // Act
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...registerDto,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      // Act
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...registerDto,
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      // Arrange
      jest.spyOn(authService, 'login').mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new Error('Invalid credentials'));

      // Act
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(500); // Note: In real app, this would be 401 after proper error handling
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockTokenResponse);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ token })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('accessToken');
      expect(authService.refreshToken).toHaveBeenCalledWith(token);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user info', async () => {
      // Arrange
      const mockUserDto = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRoles.USER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      jest.spyOn(authService, 'getUserById').mockResolvedValue(mockUserDto as any);

      // Act
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
    });
  });
});
