import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../entities/user.entity';
import { UserRoles } from '@mediamesh/shared';

/**
 * User Repository
 * 
 * Data access layer for User entity.
 * Handles all database operations for users.
 */
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user ? User.fromPrisma(user) : null;
    } catch (error) {
      this.logger.error(`Failed to find user by ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user ? User.fromPrisma(user) : null;
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${email}`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    password: string;
    role?: UserRoles;
  }): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: data.password,
          role: data.role || UserRoles.USER,
        },
      });

      return User.fromPrisma(user);
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw error;
    }
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
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.email && { email: data.email }),
          ...(data.password && { password: data.password }),
          ...(data.role && { role: data.role }),
        },
      });

      return User.fromPrisma(user);
    } catch (error) {
      this.logger.error(`Failed to update user: ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete user: ${id}`, error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email },
      });

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check email existence: ${email}`, error);
      throw error;
    }
  }

  /**
   * Find all users (with pagination)
   */
  async findAll(skip: number = 0, take: number = 20): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });

      return users.map((user) => User.fromPrisma(user));
    } catch (error) {
      this.logger.error('Failed to find all users', error);
      throw error;
    }
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    try {
      return await this.prisma.user.count();
    } catch (error) {
      this.logger.error('Failed to count users', error);
      throw error;
    }
  }
}
