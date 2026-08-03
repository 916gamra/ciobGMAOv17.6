import { User } from '../db';

export function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.initials === 'string' &&
    typeof obj.color === 'string' &&
    typeof obj.pin === 'string'
  );
}

export function isSystemRoot(user: User): boolean {
  return !!user.isSystemRoot;
}

export function hasPortalAccess(user: User, portal: string): boolean {
  if (user.isSystemRoot) return true; // System Root has access to everything
  return user.allowedPortals?.includes(portal) ?? false;
}
