import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '@mediamesh/shared';
import { JwtService } from '@nestjs/jwt';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('canActivate', () => {
    it('should allow request with valid token', async () => {
      const mockContext = {
        getHandler: jest.fn(() => ({})),
        getClass: jest.fn(() => ({})),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        id: 'user-123',
        role: 'ADMIN',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object),
      );
    });

    it('should reject request without token', async () => {
      const mockContext = {
        getHandler: jest.fn(() => ({})),
        getClass: jest.fn(() => ({})),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject request with invalid token', async () => {
      const mockContext = {
        getHandler: jest.fn(() => ({})),
        getClass: jest.fn(() => ({})),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow();
    });
  });
});
