import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { UserDto } from '../dto';
// Type augmentation from ../types/fastify.d.ts is automatically included via tsconfig.json

/**
 * Interface for user in request
 */
export interface RequestUser extends UserDto {
  // Additional request-specific user properties can be added here
}

/**
 * Decorator to extract the current authenticated user from the request
 * 
 * @param data - Optional property name to extract from user object
 * @param ctx - Execution context
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   return user;
 * }
 * 
 * @Get('user-id')
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): RequestUser | any => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as RequestUser;

    return data ? user?.[data] : user;
  },
);
