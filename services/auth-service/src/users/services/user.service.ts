import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { UserRoles } from '@mediamesh/shared';
import { throwIfNotFound } from '@mediamesh/shared';

/**
 * User Service
 * 
 * Business logic layer for user operations.
 * Handles password hashing, validation, and user management.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly saltRounds = 10;

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    password: string;
    role?: UserRoles;
  }): Promise<User> {
    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      role: data.role || UserRoles.USER,
    });

    this.logger.log(`User created: ${user.id} (${user.email})`);
    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    throwIfNotFound(user, 'User', id);
    return user!;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Update user
   */
  async update(
    id: string,
    data: {
      email?: string;
      password?: string;
      role?: UserRoles;
    },
  ): Promise<User> {
    // Check if user exists
    await this.findById(id);

    // If email is being updated, check if it's already taken
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`User with email ${data.email} already exists`);
      }
    }

    // Hash password if provided
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    const user = await this.userRepository.update(id, updateData);
    this.logger.log(`User updated: ${id}`);
    return user;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.delete(id);
    this.logger.log(`User deleted: ${id}`);
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Find all users (with pagination)
   */
  async findAll(skip: number = 0, take: number = 20): Promise<{ users: User[]; total: number }> {
    const [users, total] = await Promise.all([
      this.userRepository.findAll(skip, take),
      this.userRepository.count(),
    ]);

    return { users, total };
  }
}
