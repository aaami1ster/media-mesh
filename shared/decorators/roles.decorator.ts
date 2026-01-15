import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../dto';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for an endpoint
 * 
 * @param roles - One or more roles required to access the endpoint
 * 
 * @example
 * ```typescript
 * @Roles(UserRole.ADMIN)
 * @Get('admin-only')
 * adminOnly() {
 *   return { message: 'Admin only' };
 * }
 * 
 * @Roles(UserRole.ADMIN, UserRole.EDITOR)
 * @Post('content')
 * createContent() {
 *   // Both ADMIN and EDITOR can access
 * }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
