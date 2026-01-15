import { BaseEvent, EventMetadata, AuthEventType } from './event-types';
import { UserDto } from '../dto';

/**
 * User Created Event
 */
export interface UserCreatedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: AuthEventType.USER_CREATED;
  };
  payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdBy?: string;
    user?: UserDto;
  };
}

/**
 * User Updated Event
 */
export interface UserUpdatedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: AuthEventType.USER_UPDATED;
  };
  payload: {
    userId: string;
    email: string;
    changes: Record<string, { old: any; new: any }>;
    updatedBy: string;
    user?: Partial<UserDto>;
  };
}

/**
 * User Deleted Event
 */
export interface UserDeletedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: AuthEventType.USER_DELETED;
  };
  payload: {
    userId: string;
    email: string;
    deletedBy: string;
    deletedAt: string;
  };
}

/**
 * User Login Event
 */
export interface UserLoginEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: AuthEventType.USER_LOGIN;
  };
  payload: {
    userId: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
    loginAt: string;
    success: boolean;
  };
}

/**
 * User Logout Event
 */
export interface UserLogoutEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: AuthEventType.USER_LOGOUT;
  };
  payload: {
    userId: string;
    email: string;
    logoutAt: string;
  };
}

/**
 * Token Refreshed Event
 */
export interface TokenRefreshedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: AuthEventType.TOKEN_REFRESHED;
  };
  payload: {
    userId: string;
    tokenId: string;
    refreshedAt: string;
  };
}

/**
 * Password Changed Event
 */
export interface PasswordChangedEvent extends BaseEvent {
  metadata: EventMetadata & {
    eventType: AuthEventType.PASSWORD_CHANGED;
  };
  payload: {
    userId: string;
    email: string;
    changedBy: string;
    changedAt: string;
  };
}
