import { UserRoles } from '@mediamesh/shared';

/**
 * User Entity
 * 
 * Represents a user in the system.
 */
export class User {
  id: string;
  email: string;
  password: string; // Hashed password
  role: UserRoles;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  /**
   * Create User entity from Prisma model
   */
  static fromPrisma(prismaUser: {
    id: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      role: prismaUser.role as UserRoles,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  /**
   * Convert to DTO (without password)
   */
  toDto() {
    const { password, ...dto } = this;
    return dto;
  }
}
