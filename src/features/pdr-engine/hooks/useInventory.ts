// src/features/pdr-engine/hooks/useInventory.ts
import { useState, useCallback, useEffect } from 'react';
import { inventoryService } from '../services/InventoryService';
import { AppError } from '@/core/error';
import { Inventory } from '@/core/validation/schemas';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('useInventory');

export function useInventory() {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Loading inventory items');
      const result = await inventoryService.getAll();

      if (result.ok) {
        setItems(result.value);
        logger.info('Inventory items loaded', { count: result.value.length });
      } else {
        setError(result.error);
        logger.error('Failed to load inventory items', new Error(result.error.message));
      }
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError('UNKNOWN_ERROR', String(err), 500);
      setError(appError);
      logger.error('Error loading inventory', appError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = useCallback(
    async (data: unknown, userId: string) => {
      try {
        setError(null);
        logger.info('Adding inventory item', { userId });

        const result = await inventoryService.add(data, userId);

        if (result.ok) {
          logger.info('Inventory item added', { id: result.value });
          await loadItems(); // Reload
          return { ok: true, value: result.value };
        } else {
          setError(result.error);
          logger.error('Failed to add inventory item', new Error(result.error.message));
          return { ok: false, error: result.error };
        }
      } catch (err) {
        const appError = err instanceof AppError
          ? err
          : new AppError('UNKNOWN_ERROR', String(err), 500);
        setError(appError);
        logger.error('Error adding inventory item', appError);
        return { ok: false, error: appError };
      }
    },
    [loadItems]
  );

  const updateItem = useCallback(
    async (id: string, data: unknown, userId: string) => {
      try {
        setError(null);
        logger.info('Updating inventory item', { id, userId });

        const result = await inventoryService.update(id, data, userId);

        if (result.ok) {
          logger.info('Inventory item updated', { id });
          await loadItems(); // Reload
          return { ok: true };
        } else {
          setError(result.error);
          logger.error('Failed to update inventory item', new Error(result.error.message));
          return { ok: false, error: result.error };
        }
      } catch (err) {
        const appError = err instanceof AppError
          ? err
          : new AppError('UNKNOWN_ERROR', String(err), 500);
        setError(appError);
        logger.error('Error updating inventory item', appError);
        return { ok: false, error: appError };
      }
    },
    [loadItems]
  );

  const deleteItem = useCallback(
    async (id: string, userId: string) => {
      try {
        setError(null);
        logger.info('Deleting inventory item', { id, userId });

        const result = await inventoryService.delete(id, userId);

        if (result.ok) {
          logger.info('Inventory item deleted', { id });
          await loadItems(); // Reload
          return { ok: true };
        } else {
          setError(result.error);
          logger.error('Failed to delete inventory item', new Error(result.error.message));
          return { ok: false, error: result.error };
        }
      } catch (err) {
        const appError = err instanceof AppError
          ? err
          : new AppError('UNKNOWN_ERROR', String(err), 500);
        setError(appError);
        logger.error('Error deleting inventory item', appError);
        return { ok: false, error: appError };
      }
    },
    [loadItems]
  );

  const submitRequisition = useCallback(
    async (inventoryId: string, quantity: number, userId: string) => {
      try {
        setError(null);
        logger.info('Submitting requisition', { inventoryId, quantity, userId });

        const result = await inventoryService.submitRequisition(
          inventoryId,
          quantity,
          userId
        );

        if (result.ok) {
          logger.info('Requisition submitted', { transactionId: result.value });
          await loadItems(); // Reload
          return { ok: true, value: result.value };
        } else {
          setError(result.error);
          logger.error('Failed to submit requisition', new Error(result.error.message));
          return { ok: false, error: result.error };
        }
      } catch (err) {
        const appError = err instanceof AppError
          ? err
          : new AppError('UNKNOWN_ERROR', String(err), 500);
        setError(appError);
        logger.error('Error submitting requisition', appError);
        return { ok: false, error: appError };
      }
    },
    [loadItems]
  );

  const getLowStockItems = useCallback(async () => {
    try {
      setError(null);
      logger.info('Getting low stock items');

      const result = await inventoryService.getLowStockItems();

      if (result.ok) {
        logger.info('Low stock items retrieved', { count: result.value.length });
        return { ok: true, value: result.value };
      } else {
        setError(result.error);
        return { ok: false, error: result.error };
      }
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError('UNKNOWN_ERROR', String(err), 500);
      setError(appError);
      return { ok: false, error: appError };
    }
  }, []);

  return {
    items,
    loading,
    error,
    loadItems,
    addItem,
    updateItem,
    deleteItem,
    submitRequisition,
    getLowStockItems,
  };
}
