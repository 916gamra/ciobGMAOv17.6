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
            // obj is the old object, already decrypted by the reading hook
            
            // 1. Build the updated object combining old decrypted obj and modifications
            const updatedObj = { ...obj };
            Object.keys(modifications).forEach(key => {
                if (modifications[key] === undefined) {
                     delete updatedObj[key];
                } else {
                     updatedObj[key] = modifications[key];
                }
            });

            // 2. Separate into indexed and non-indexed
            const indexedKeys = new Set([
                table.schema.primKey.keyPath,
                ...table.schema.indexes.map(idx => idx.keyPath)
            ].filter(Boolean) as string[]);

            const payload: any = {};
            const finalModifications: any = {};

            Object.keys(updatedObj).forEach(key => {
                if (!indexedKeys.has(key) && key !== '_e') {
                    payload[key] = updatedObj[key];
                    // Instruct Dexie to clear plaintext non-indexed properties
                    finalModifications[key] = undefined;
                } else if (indexedKeys.has(key)) {
                    if (key in modifications) {
                         finalModifications[key] = modifications[key];
                    }
                }
            });

            // 3. Encrypt non-indexed payload
            if (Object.keys(payload).length > 0) {
                finalModifications._e = EncryptionService.encrypt(payload);
            } else {
                finalModifications._e = undefined;
            }

            return finalModifications;
        });
    });
}
