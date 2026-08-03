import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { applyEncryptionHooks } from '../DatabaseEncryption';
import { EncryptionService } from '../EncryptionService';
import indexedDB from 'fake-indexeddb';
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;


describe('DatabaseEncryption Hooks', () => {
  let db: Dexie;

  beforeEach(async () => {
    db = new Dexie('TestDB');
    db.version(1).stores({
      users: 'id, name' // id and name are indexed, everything else should be encrypted
    });
    applyEncryptionHooks(db);
    await db.open();
  });

  it('should encrypt non-indexed fields on create and decrypt on read', async () => {
    const original = {
      id: '1',
      name: 'John Doe',
      secretPin: '1234',
      salary: 50000
    };

    await db.table('users').add(original);

    // Read it back
    const retrieved = await db.table('users').get('1');
    
    // It should transparently decrypt
    expect(retrieved.secretPin).toBe('1234');
    expect(retrieved.salary).toBe(50000);
    expect(retrieved._e).toBeUndefined();
  });

  it('should encrypt non-indexed fields on update', async () => {
    await db.table('users').add({
      id: '2',
      name: 'Jane Doe',
      secret: 'old_secret'
    });

    await db.table('users').update('2', { secret: 'new_secret' });

    const retrieved = await db.table('users').get('2');
    expect(retrieved.secret).toBe('new_secret');
  });
});
