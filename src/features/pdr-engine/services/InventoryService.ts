// src/features/pdr-engine/services/InventoryService.ts
import { BaseService } from '@/core/services/BaseService';
import { asyncHandler, Result, ValidationError, NotFoundError } from '@/core/error';
import { Validator, CreateInventorySchema, Inventory } from '@/core/validation/schemas';
import { db } from '@/core/db';
import { auditService } from '@/core/audit/AuditService';

function mapToInventory(item: any): Inventory {
  return {
    id: item.id,
    partId: item.partId || item.blueprintId || '',
    quantity: item.quantity !== undefined ? item.quantity : item.quantityCurrent || 0,
    location: item.location || item.locationDetails || '',
    minStock: item.minStock !== undefined ? item.minStock : item.minThreshold || 0,
    maxStock: item.maxStock !== undefined ? item.maxStock : 1000,
    lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(item.updatedAt || Date.now()),
  };
}

export class InventoryService extends BaseService {
  async getAll(): Promise<Result<Inventory[]>> {
    return this.executeAsync(
      async () => {
        const items = await db.inventory.toArray();
        return items.map(mapToInventory);
      },
      'getAll'
    );
  }

  async getById(id: string): Promise<Result<Inventory>> {
    return this.executeAsync(
      async () => {
        const item = await db.inventory.get(id);
        if (!item) {
          throw new NotFoundError('Inventory');
        }
        return mapToInventory(item);
      },
      'getById'
    );
  }

  async add(data: unknown, userId: string): Promise<Result<string>> {
    return this.executeAsync(
      async () => {
        // Validate
        const validated = Validator.validate<any>(CreateInventorySchema, data);

        // Check if part exists (since we support legacy compatibility, we first try to find the part)
        const part = await db.parts.get(validated.partId);
        if (!part) {
          throw new NotFoundError('Part');
        }

        // Add to database
        const id = `inv-${Date.now()}`;
        await db.inventory.add({
          id,
          ...validated,
          lastUpdated: new Date(),
        } as any);

        // Audit
        await auditService.log(
          'INVENTORY_ADDED',
          'Inventory',
          id,
          validated,
          userId
        );

        return id;
      },
      'add'
    );
  }

  async update(
    id: string,
    data: unknown,
    userId: string
  ): Promise<Result<void>> {
    return this.executeAsync(
      async () => {
        // Get existing
        const existing = await db.inventory.get(id);
        if (!existing) {
          throw new NotFoundError('Inventory');
        }

        // Validate
        const validated = Validator.validate<any>(CreateInventorySchema, data);

        // Update
        await db.inventory.update(id, {
          ...validated,
          lastUpdated: new Date(),
        } as any);

        // Audit
        await auditService.log(
          'INVENTORY_UPDATED',
          'Inventory',
          id,
          { from: existing, to: validated },
          userId
        );
      },
      'update'
    );
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    return this.executeAsync(
      async () => {
        // Get existing
        const existing = await db.inventory.get(id);
        if (!existing) {
          throw new NotFoundError('Inventory');
        }

        // Delete
        await db.inventory.delete(id);

        // Audit
        await auditService.log(
          'INVENTORY_DELETED',
          'Inventory',
          id,
          existing as unknown as Record<string, any>,
          userId
        );
      },
      'delete'
    );
  }

  async submitRequisition(
    inventoryIdOrData: string | { inventoryId: string; quantity: number; userId: string },
    quantityParam?: number,
    userIdParam?: string
  ): Promise<Result<string>> {
    return this.executeAsync(
      async () => {
        let inventoryId: string;
        let quantity: number;
        let userId: string;

        if (typeof inventoryIdOrData === 'object' && inventoryIdOrData !== null) {
          inventoryId = inventoryIdOrData.inventoryId;
          quantity = inventoryIdOrData.quantity;
          userId = inventoryIdOrData.userId;
        } else {
          inventoryId = inventoryIdOrData as string;
          quantity = quantityParam!;
          userId = userIdParam!;
        }

        // Validate
        if (quantity <= 0) {
          throw new ValidationError('Quantity must be greater than zero');
        }

        // Get inventory
        const inventory = await db.inventory.get(inventoryId);
        if (!inventory) {
          throw new NotFoundError('Inventory');
        }

        const currentQty = (((inventory as any).quantity) !== undefined ? ((inventory as any).quantity) : (inventory as any).quantityCurrent) || 0;

        // Check stock
        if (currentQty < quantity) {
          throw new ValidationError('Insufficient stock available');
        }

        // Update inventory (update both standard 'quantity' and internal compatibility 'quantityCurrent')
        await db.inventory.update(inventoryId, {
          quantity: currentQty - quantity,
          quantityCurrent: currentQty - quantity,
          lastUpdated: new Date(),
        } as any);

        // Create transaction
        const transactionId = `trans-${Date.now()}`;
        await db.transactions.add({
          id: transactionId,
          inventoryId,
          type: 'OUT',
          quantity,
          reason: 'Requisition',
          timestamp: new Date(),
          userId,
        });

        // Audit
        await auditService.log(
          'REQUISITION_SUBMITTED',
          'Transaction',
          transactionId,
          { inventoryId, quantity },
          userId
        );

        return transactionId;
      },
      'submitRequisition'
    );
  }

  async reconcile(
    inventoryId: string,
    physicalQuantity: number,
    userId: string,
    reason: string
  ): Promise<Result<void>> {
    return this.executeAsync(
      async () => {
        // Validate
        if (physicalQuantity < 0) {
          throw new ValidationError('الكمية الفعلية يجب أن تكون موجبة');
        }

        // Get inventory
        const inventory = await db.inventory.get(inventoryId);
        if (!inventory) {
          throw new NotFoundError('Inventory');
        }

        const currentQty = (((inventory as any).quantity) !== undefined ? ((inventory as any).quantity) : (inventory as any).quantityCurrent) || 0;
        const difference = currentQty - physicalQuantity;

        // Update inventory
        await db.inventory.update(inventoryId, {
          quantity: physicalQuantity,
          quantityCurrent: physicalQuantity,
          lastUpdated: new Date(),
        } as any);

        // Create adjustment transaction
        await db.transactions.add({
          id: `trans-${Date.now()}`,
          inventoryId,
          type: 'ADJ',
          quantity: Math.abs(difference),
          reason: `Reconciliation: ${reason}`,
          timestamp: new Date(),
          userId,
        });

        // Audit
        await auditService.log(
          'INVENTORY_RECONCILED',
          'Inventory',
          inventoryId,
          { physicalQuantity, difference, reason },
          userId
        );
      },
      'reconcile'
    );
  }

  async getLowStockItems(): Promise<Result<Inventory[]>> {
    return this.executeAsync(
      async () => {
        const items = await db.inventory.toArray();
        const mapped = items.map(mapToInventory);
        return mapped.filter(item => item.quantity <= item.minStock);
      },
      'getLowStockItems'
    );
  }

  async getHighStockItems(): Promise<Result<Inventory[]>> {
    return this.executeAsync(
      async () => {
        const items = await db.inventory.toArray();
        const mapped = items.map(mapToInventory);
        return mapped.filter(item => item.quantity >= item.maxStock);
      },
      'getHighStockItems'
    );
  }

  async getTransactionHistory(
    inventoryId: string
  ): Promise<Result<any[]>> {
    return this.executeAsync(
      async () => {
        const transactions = await db.transactions
          .where('inventoryId')
          .equals(inventoryId)
          .toArray();
        return transactions;
      },
      'getTransactionHistory'
    );
  }

  async getInventoryValue(): Promise<Result<number>> {
    return this.executeAsync(
      async () => {
        const items = await db.inventory.toArray();
        const parts = await db.parts.toArray();

        const partsMap = new Map(parts.map(p => [p.id, p]));

        const totalValue = items.reduce((sum, item) => {
          const mapped = mapToInventory(item);
          const part = partsMap.get(mapped.partId);
          return sum + (part?.price || 0) * mapped.quantity;
        }, 0);

        return totalValue;
      },
      'getInventoryValue'
    );
  }
}

export const inventoryService = new InventoryService();
