import { GenericRepository } from '@/core/repositories/GenericRepository';
import { db, StockItem } from '@/core/db';
import { Result, success, failure } from '@/core/types/Result';
import { AppError, ValidationError } from '@/core/errors/AppError';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('InventoryService');

export class InventoryService {
  private repository: GenericRepository<StockItem>;

  constructor() {
    this.repository = new GenericRepository<StockItem>(db.inventory);
  }

  async getInventory(id: string): Promise<Result<StockItem>> {
    const result = await this.repository.getById(id);
    if (!result.ok) {
      return failure(result.error);
    }
    if (!result.value) {
      return failure(new AppError('NOT_FOUND', 'Inventory item not found', 404));
    }
    return success(result.value);
  }

  async submitRequisition(data: { inventoryId: string, quantity: number, userId: string }): Promise<Result<string>> {
    if (data.quantity <= 0) {
      return failure(new ValidationError('Quantity must be greater than zero'));
    }

    const inventoryResult = await this.getInventory(data.inventoryId);
    if (!inventoryResult.ok) {
      return failure(inventoryResult.error);
    }

    const item = inventoryResult.value;
    if (item.quantityCurrent < data.quantity) {
      logger.warn('Insufficient stock', { requested: data.quantity, available: item.quantityCurrent });
      return failure(new ValidationError('Insufficient stock available', { 
        available: item.quantityCurrent, 
        requested: data.quantity 
      }));
    }

    const newQuantity = item.quantityCurrent - data.quantity;
    
    // Perform update
    const updateResult = await this.repository.update(item.id, { quantityCurrent: newQuantity });
    if (!updateResult.ok) {
      logger.error('Failed to update stock', updateResult.error);
      return failure(updateResult.error);
    }

    logger.info('Stock requisition successful', {
      inventoryId: item.id,
      deducted: data.quantity,
      remaining: newQuantity,
      userId: data.userId
    });

    return success(item.id);
  }
}
