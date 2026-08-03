import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import type { StockItem, StockMovement } from '@/core/db';

export interface EnrichedStockItem extends StockItem {
  blueprintReference: string;
  unit: string;
  minThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export function useStockEngine() {
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);
  const movements = useLiveQuery(() => db.movements.orderBy('timestamp').reverse().toArray(), []);

  const isLoading = inventory === undefined || blueprints === undefined || movements === undefined;

  // Enqueue a highly optimized in-memory join
  const enrichedInventory = useMemo((): EnrichedStockItem[] => {
    if (!inventory || !blueprints) return [];
    
    // Create a Map for O(1) lookups
    const blueprintMap = new Map(blueprints.map(b => [b.id, b]));
    
    return inventory.map(item => {
      const blueprint = blueprintMap.get(item.blueprintId);
      const minThreshold = blueprint?.minThreshold || 0;
      
      return {
        ...item,
        blueprintReference: blueprint?.reference || 'Unknown Reference',
        unit: blueprint?.unit || 'Pcs',
        minThreshold,
        isLowStock: item.quantityCurrent > 0 && item.quantityCurrent <= minThreshold,
        isOutOfStock: item.quantityCurrent === 0
      };
    });
  }, [inventory, blueprints]);

  // Derived intelligent states
  const lowStockItems = useMemo(() => enrichedInventory.filter(item => item.isLowStock), [enrichedInventory]);
  const outOfStockItems = useMemo(() => enrichedInventory.filter(item => item.isOutOfStock), [enrichedInventory]);

  const addStock = async (item: Omit<StockItem, 'id' | 'updatedAt'>) => {
    return (await import('../repositories/InventoryRepository')).inventoryRepository.create(item);
  };

  return {
    inventory: enrichedInventory,
    movements: movements || [],
    lowStockItems,
    outOfStockItems,
    isLoading,
    addStock
  };
}
