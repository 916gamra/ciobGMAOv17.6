import Dexie from 'dexie';
import { EncryptionService } from './EncryptionService';

export function applyEncryptionHooks(db: Dexie) {
    db.tables.forEach(table => {
        // --- READ HOOK ---
        table.hook('reading', function(obj) {
            if (obj && obj._e) {
                try {
                    const decrypted = EncryptionService.decrypt(obj._e);
                    if (decrypted) {
                        Object.assign(obj, decrypted);
                    }
                } catch (e) {
                    console.error(`Failed to decrypt object in table ${table.name}`, e);
                }
                // Important: Delete _e so it doesn't leak into the app state
                delete obj._e;
            }
            return obj;
        });

        // --- CREATE HOOK ---
        table.hook('creating', function(primKey, obj, trans) {
            const indexedKeys = new Set([
                table.schema.primKey.keyPath,
                ...table.schema.indexes.map(idx => idx.keyPath)
            ].filter(Boolean) as string[]);

            const payload: any = {};
            
            // Extract non-indexed fields
            Object.keys(obj).forEach(key => {
                if (!indexedKeys.has(key) && key !== '_e') {
                    payload[key] = obj[key];
                    delete obj[key]; // Remove from plain object
                }
            });

            // Encrypt and store in _e if there's any data
            if (Object.keys(payload).length > 0) {
                obj._e = EncryptionService.encrypt(payload);
            }
            
            // Return undefined so Dexie uses the mutated obj
            return undefined;
        });

        // --- UPDATE HOOK ---
        table.hook('updating', function(modifications, primKey, obj, trans) {
            // obj is the old object, raw from DB (contains _e)
            
            // 1. Decrypt old object to memory
            const plainObj = { ...obj };
            if (plainObj._e) {
                try {
                    const decrypted = EncryptionService.decrypt(plainObj._e);
                    if (decrypted) {
                        Object.assign(plainObj, decrypted);
                    }
                } catch (e) {
                    console.error(`Failed to decrypt for update in ${table.name}`);
                }
                delete plainObj._e;
            }

            // 2. Apply modifications to memory object
            const updatedObj = { ...plainObj };
            Object.keys(modifications).forEach(key => {
                if (modifications[key] === undefined) {
                     delete updatedObj[key];
                } else {
                     updatedObj[key] = modifications[key];
                }
            });

            // 3. Separate into indexed and non-indexed
            const indexedKeys = new Set([
                table.schema.primKey.keyPath,
                ...table.schema.indexes.map(idx => idx.keyPath)
            ].filter(Boolean) as string[]);

            const payload: any = {};
            const finalModifications: any = {};

            Object.keys(updatedObj).forEach(key => {
                if (!indexedKeys.has(key) && key !== '_e') {
                    payload[key] = updatedObj[key];
                } else if (indexedKeys.has(key)) {
                    // Check if this indexed key was actually modified
                    if (key in modifications) {
                         finalModifications[key] = modifications[key];
                    }
                }
            });

            // 4. Encrypt non-indexed payload
            if (Object.keys(payload).length > 0) {
                finalModifications._e = EncryptionService.encrypt(payload);
            } else {
                finalModifications._e = undefined;
            }
            
            // Note: For properties that were removed in modifications and were part of the payload,
            // they are naturally omitted from `payload` because they were deleted from `updatedObj`.
            
            // If any modifications are attempting to directly update non-indexed fields, we must
            // delete them from finalModifications to avoid saving them in plaintext.
            Object.keys(modifications).forEach(key => {
                if (!indexedKeys.has(key)) {
                     finalModifications[key] = undefined; // Instruct Dexie to delete it from plaintext
                }
            });

            return finalModifications;
        });
    });
}
