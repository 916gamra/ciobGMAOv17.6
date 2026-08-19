/**
 * Protected Table Access
 * Enforces session lock checks before performing Dexie operations on encrypted tables
 */

import { db } from '@/core/db';
import { securitySession } from './session/securitySessionStore';

export class ProtectedTableAccess {
  /**
   * Asserts that security session is unlocked
   */
  private static assertUnlocked(): void {
    const state = securitySession.getState();
    if (!state.unlocked && process.env.NODE_ENV === 'production') {
      throw new Error('Security Violation: Access denied to encrypted data while security session is locked.');
    }
  }

  /**
   * Reads a record from an encrypted Dexie table
   */
  static async read<T = any>(tableName: string, id: string): Promise<T | undefined> {
    this.assertUnlocked();
    const table = (db as any)[tableName];
    if (!table) {
      throw new Error(`Table ${tableName} not found in database schema.`);
    }
    return table.get(id);
  }

  /**
   * Writes/puts a record to an encrypted Dexie table
   */
  static async write<T = any>(tableName: string, data: T): Promise<string> {
    this.assertUnlocked();
    const table = (db as any)[tableName];
    if (!table) {
      throw new Error(`Table ${tableName} not found in database schema.`);
    }
    return table.put(data);
  }
}
