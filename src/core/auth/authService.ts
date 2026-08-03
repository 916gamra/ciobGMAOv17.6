import { db, User } from '@/core/db';
import { ALL_HARDCODED_SLOTS, AuthSlot } from '@/core/config/authSlots';

export async function getAuthSlots(): Promise<User[]> {
  const overrides = await db.userOverrides.toArray();

  return ALL_HARDCODED_SLOTS.map((slot: AuthSlot) => {
    const override = overrides.find(o => o.id === slot.id);
    if (!override) return slot as User;

    return {
      ...slot,
      ...override, // apply overrides
    } as User;
  });
}

export async function getAuthSlot(id: string): Promise<User | undefined> {
  const slot = ALL_HARDCODED_SLOTS.find(s => s.id === id);
  if (!slot) return undefined;

  const override = await db.userOverrides.get(id);
  if (!override) return slot as User;

  return {
    ...slot,
    ...override, // apply overrides
  } as User;
}
