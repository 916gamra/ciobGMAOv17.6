import { User } from '../db';

export type SlotType = 'SY_ADMIN' | 'OPERATIONAL' | 'TECHNICIAN';

export interface AuthSlot extends Omit<User, 'id'> {
  id: string; // the fixed string ID
  type: SlotType;
  isActive: boolean;
  realBadgeId?: string; // Physical factory badge number
}

// 1. Level: Command (Genesis Account)
export const SY_ADMIN_SLOT: AuthSlot = {
  id: 'SY-ADMIN',
  type: 'SY_ADMIN',
  name: 'System Administrator',
  role: 'System Root',
  initials: 'SY',
  color: 'bg-red-500',
  pin: '0000', // Default generic pin, will be overridden
  isSystemRoot: true,
  isActive: true,
  allowedPortals: ['PDR', 'PREVENTIVE', 'CORRECTIVE', 'ORGANIZATION', 'FACTORY', 'ANALYTICS', 'SETTINGS']
};

export const SYSTEM_ADMIN_SANDBOX_SLOT: AuthSlot = {
  id: 'SYSTEM-ADMIN-SANDBOX',
  type: 'SY_ADMIN',
  name: 'System Admin Sandbox',
  role: 'Super Sandbox Root (v17.5)',
  initials: 'SX',
  color: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 border border-purple-400/30',
  pin: '7777',
  isSystemRoot: true,
  isActive: true,
  allowedPortals: ['PDR', 'PREVENTIVE', 'CORRECTIVE', 'ORGANIZATION', 'FACTORY', 'ANALYTICS', 'SETTINGS']
};

// 2. Level: Operational (Global State Modifiers)
export const OPERATIONAL_SLOTS: AuthSlot[] = Array.from({ length: 5 }, (_, i) => {
  const numStr = (i + 1).toString().padStart(2, '0');
  const ID = `OP-${numStr}`;
  return {
    id: ID,
    type: 'OPERATIONAL',
    name: i === 0 ? 'Store Manager' : `Operator ${i + 1}`,
    role: 'Operational',
    initials: 'OP',
    color: 'bg-indigo-500',
    pin: '1234',
    isActive: i === 0, // First slot active by default
    allowedPortals: ['PDR', 'CORRECTIVE', 'ORGANIZATION']
  };
});

// 3. Level: Technicians (Execution level, tracked with Badge)
export const TECHNICIAN_SLOTS: AuthSlot[] = Array.from({ length: 10 }, (_, i) => {
  const numStr = (i + 1).toString().padStart(2, '0');
  const ID = `TC-${numStr}`;
  return {
    id: ID,
    type: 'TECHNICIAN',
    name: `Technician ${i + 1}`,
    role: 'Technician',
    initials: 'TC',
    color: 'bg-emerald-500',
    pin: '1234',
    isActive: false,
    realBadgeId: `BADGE-${numStr}`,
    allowedPortals: ['PREVENTIVE', 'CORRECTIVE']
  };
});

export const ALL_HARDCODED_SLOTS: AuthSlot[] = [
  SY_ADMIN_SLOT,
  SYSTEM_ADMIN_SANDBOX_SLOT,
  ...OPERATIONAL_SLOTS,
  ...TECHNICIAN_SLOTS
];
