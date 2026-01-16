import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@mediamesh/shared';
import { UserRoles, UserRole } from '@mediamesh/shared';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (userRole: UserRoles): ExecutionContext => {
    const request = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: userRole,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    it('should allow ADMIN to access ADMIN route', () => {
      // Arrange
      const context = createMockContext(UserRoles.ADMIN);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow ADMIN to access EDITOR route', () => {
      // Arrange
      const context = createMockContext(UserRoles.ADMIN);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow ADMIN to access USER route', () => {
      // Arrange
      const context = createMockContext(UserRoles.ADMIN);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow EDITOR to access EDITOR route', () => {
      // Arrange
      const context = createMockContext(UserRoles.EDITOR);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow EDITOR to access USER route', () => {
      // Arrange
      const context = createMockContext(UserRoles.EDITOR);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny EDITOR access to ADMIN route', () => {
      // Arrange
      const context = createMockContext(UserRoles.EDITOR);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow USER to access USER route', () => {
      // Arrange
      const context = createMockContext(UserRoles.USER);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny USER access to EDITOR route', () => {
      // Arrange
      const context = createMockContext(UserRoles.USER);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny USER access to ADMIN route', () => {
      // Arrange
      const context = createMockContext(UserRoles.USER);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
