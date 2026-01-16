import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { KafkaService } from '../../kafka/kafka.service';
import { UserRoles } from '@mediamesh/shared';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
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
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      emailExists: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    const mockKafkaService = {
      emitUserUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    kafkaService = module.get(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'plainPassword123',
        role: UserRoles.USER,
      };
      userRepository.emailExists.mockResolvedValue(false);
      userRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.create(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.emailExists).toHaveBeenCalledWith(userData.email);
      expect(userRepository.create).toHaveBeenCalled();
      // Verify password was hashed (not plain text)
      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe(userData.password);
      expect(createCall.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
      };
      userRepository.emailExists.mockResolvedValue(true);

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      // Arrange
      const plainPassword = 'testPassword123';

      // Act
      const hashedPassword = await service.hashPassword(plainPassword);

      // Assert
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/); // bcrypt hash format
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for same password', async () => {
      // Arrange
      const plainPassword = 'testPassword123';

      // Act
      const hash1 = await service.hashPassword(plainPassword);
      const hash2 = await service.hashPassword(plainPassword);

      // Assert
      expect(hash1).not.toBe(hash2); // Different salts produce different hashes
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      // Arrange
      const plainPassword = 'testPassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Act
      const result = await service.verifyPassword(plainPassword, hashedPassword);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      // Arrange
      const plainPassword = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Act
      const result = await service.verifyPassword(wrongPassword, hashedPassword);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validateCredentials', () => {
    it('should validate correct credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword,
      };
      userRepository.findByEmail.mockResolvedValue(userWithHashedPassword);

      // Act
      const result = await service.validateCredentials(email, password);

      // Assert
      expect(result).toEqual(userWithHashedPassword);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.validateCredentials(
        'nonexistent@example.com',
        'password123',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      // Arrange
      const email = 'test@example.com';
      const correctPassword = 'password123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await bcrypt.hash(correctPassword, 10);
      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword,
      };
      userRepository.findByEmail.mockResolvedValue(userWithHashedPassword);

      // Act
      const result = await service.validateCredentials(email, wrongPassword);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user and emit Kafka event', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        email: 'newemail@example.com',
        role: UserRoles.EDITOR,
      };
      const oldUser = { ...mockUser, email: 'old@example.com', role: UserRoles.USER };
      const updatedUser = { ...mockUser, ...updateData };

      userRepository.findById
        .mockResolvedValueOnce(oldUser) // First call for existence check
        .mockResolvedValueOnce(oldUser); // Second call to get old user for comparison
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.update.mockResolvedValue(updatedUser);
      kafkaService.emitUserUpdated.mockResolvedValue(undefined);

      // Act
      const result = await service.update(userId, updateData);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(userRepository.update).toHaveBeenCalled();
      expect(kafkaService.emitUserUpdated).toHaveBeenCalled();
    });

    it('should hash password when updating password', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        password: 'newPassword123',
      };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(mockUser);

      // Act
      await service.update(userId, updateData);

      // Assert
      const updateCall = userRepository.update.mock.calls[0];
      expect(updateCall[1].password).not.toBe(updateData.password);
      expect(updateCall[1].password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });
});
