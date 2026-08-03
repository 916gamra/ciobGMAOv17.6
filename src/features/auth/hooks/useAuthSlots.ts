import { useLiveQuery } from 'dexie-react-hooks';
import { db, User } from '@/core/db';
import { ALL_HARDCODED_SLOTS, AuthSlot } from '@/core/config/authSlots';

export function useAuthSlots(): User[] {
  const overrides = useLiveQuery(() => db.userOverrides.toArray(), [], []);

  return ALL_HARDCODED_SLOTS.map((slot: AuthSlot) => {
    const override = overrides.find(o => o.id === slot.id);
    if (!override) return slot as User;

    return {
      ...slot,
      ...override, // apply overrides
    } as User;
  });
}

export function useActiveUsers(): User[] {
  const allUsers = useAuthSlots();
  return allUsers.filter(u => u.isActive);
}
