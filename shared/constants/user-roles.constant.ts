/**
 * User Roles Enum
 * 
 * Defines the available user roles in the system.
 */
export enum UserRoles {
  /**
   * Administrator - Full system access
   */
  ADMIN = 'ADMIN',

  /**
   * Editor - Content management access
   */
  EDITOR = 'EDITOR',

  /**
   * User - Standard user access
   */
  USER = 'USER',
}

/**
 * User role display names
 */
export const UserRoleNames: Record<UserRoles, string> = {
  [UserRoles.ADMIN]: 'Administrator',
  [UserRoles.EDITOR]: 'Editor',
  [UserRoles.USER]: 'User',
};

/**
 * User role hierarchy (higher number = more permissions)
 */
export const UserRoleHierarchy: Record<UserRoles, number> = {
  [UserRoles.ADMIN]: 3,
  [UserRoles.EDITOR]: 2,
  [UserRoles.USER]: 1,
};

/**
 * Check if a role has permission compared to another role
 */
export function hasRolePermission(
  userRole: UserRoles,
  requiredRole: UserRoles,
): boolean {
  return UserRoleHierarchy[userRole] >= UserRoleHierarchy[requiredRole];
}

/**
 * Get all roles
 */
export function getAllRoles(): UserRoles[] {
  return Object.values(UserRoles);
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is UserRoles {
  return Object.values(UserRoles).includes(role as UserRoles);
}
