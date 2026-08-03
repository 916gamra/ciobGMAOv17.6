import { db, type StockItem, type StockMovement } from '@/core/db';
import { logger, PerformanceMonitor } from '@/core/logger';
import { z } from 'zod';
import { MiddlewareChain, Middleware } from '@/core/middleware';
import type { User } from '@/core/db';

export interface IInventoryRepository {
  getAll(): Promise<StockItem[]>;
  getById(id: string): Promise<StockItem | undefined>;
  create(item: Omit<StockItem, 'id' | 'updatedAt'>): Promise<string>;
  updateStock(id: string, newQuantity: number): Promise<void>;
  delete(id: string): Promise<void>;
  recordMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<string>;
}

export class InventoryRepository implements IInventoryRepository {
  async getAll(): Promise<StockItem[]> {
    return PerformanceMonitor.measure('InventoryRepo.getAll', () => db.inventory.toArray());
  }

  async getById(id: string): Promise<StockItem | undefined> {
    return PerformanceMonitor.measure('InventoryRepo.getById', () => db.inventory.get(id));
  }

  async create(item: Omit<StockItem, 'id' | 'updatedAt'>): Promise<string> {
    return PerformanceMonitor.measure('InventoryRepo.create', async () => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.inventory.add({
        id,
        ...item,
        updatedAt: now
      });
      return id;
    });
  }

  async updateStock(id: string, newQuantity: number): Promise<void> {
    return PerformanceMonitor.measure('InventoryRepo.updateStock', async () => {
      await db.inventory.update(id, { quantityCurrent: newQuantity, updatedAt: new Date().toISOString() });
    });
  }

  async delete(id: string): Promise<void> {
    return PerformanceMonitor.measure('InventoryRepo.delete', () => db.inventory.delete(id));
  }

  async recordMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<string> {
    return PerformanceMonitor.measure('InventoryRepo.recordMovement', async () => {
      const id = crypto.randomUUID();
      await db.movements.add({
        id,
        ...movement,
        timestamp: new Date().toISOString()
      });
      return id;
    });
  }
}

export const inventoryRepository = new InventoryRepository();

/* -----------------------------------------------------
 * Middleware Definitions for Stock Transactions
 * ---------------------------------------------------*/

export interface TransactionContext {
  stockId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  performedBy: string;
  user: User | null;
  machineId?: string;
  notes?: string;
  item?: StockItem;
  newQuantity?: number;
}

export const validationMiddleware: Middleware<TransactionContext> = async (ctx, next) => {
  if (ctx.quantity <= 0) {
    throw new Error('Quantity must be greater than zero.');
  }
  if (!ctx.stockId) {
    throw new Error('No stock item selected.');
  }
  if (!ctx.performedBy.trim()) {
    throw new Error('Technician name is required.');
  }
  await next();
};

export const businessRulesMiddleware: Middleware<TransactionContext> = async (ctx, next) => {
  const item = await inventoryRepository.getById(ctx.stockId);
  if (!item) throw new Error('Stock item not found in database.');

  if (ctx.type === 'OUT' && item.quantityCurrent < ctx.quantity) {
    throw new Error('Insufficient stock for this withdrawal. Available: ' + item.quantityCurrent);
  }

  ctx.item = item;
  ctx.newQuantity = ctx.type === 'IN'
    ? item.quantityCurrent + ctx.quantity
    : item.quantityCurrent - ctx.quantity;

  await next();
};

export const loggingMiddleware: Middleware<TransactionContext> = async (ctx, next) => {
  const start = performance.now();
  logger.info({ action: 'TRANSACTION_START', entityType: 'INVENTORY_TX', entityId: ctx.stockId, details: { type: ctx.type, quantity: ctx.quantity } });
  
  try {
    await next();
    const duration = performance.now() - start;
    logger.info({ action: 'TRANSACTION_SUCCESS', entityType: 'INVENTORY_TX', entityId: ctx.stockId, details: { durationMs: duration, newQuantity: ctx.newQuantity } });
  } catch (err) {
    const duration = performance.now() - start;
    logger.error({ action: 'TRANSACTION_FAILED', entityType: 'INVENTORY_TX', entityId: ctx.stockId, details: { durationMs: duration } }, err);
    throw err;
  }
};

export const authorizationMiddleware: Middleware<TransactionContext> = async (ctx, next) => {
  // In a full RBAC system, we'd check ctx.user.role/permissions
  if (!ctx.user && !ctx.performedBy) {
    throw new Error('Unauthorized transaction');
  }
  await next();
};

export const persistenceMiddleware: Middleware<TransactionContext> = async (ctx, next) => {
  await db.transaction('rw', [db.inventory, db.movements, db.auditLogs, db.machinePartMappings], async () => {
    if (ctx.newQuantity === undefined) throw new Error('New quantity not calculated');
    
    // Update Stock
    await inventoryRepository.updateStock(ctx.stockId, ctx.newQuantity);
    
    // Add Movement
    await inventoryRepository.recordMovement({
      stockId: ctx.stockId,
      type: ctx.type,
      quantity: ctx.quantity,
      performedBy: ctx.performedBy,
      machineId: ctx.machineId,
      notes: ctx.notes
    });
    
    // Detailed Audit Trail
    await db.auditLogs.add({
      id: crypto.randomUUID(),
      userId: ctx.user?.id.toString() || 'GUEST',
      userName: ctx.performedBy,
      action: ctx.type === 'IN' ? 'RESTOCK' : 'WITHDRAW',
      entityType: 'STOCK_ITEM',
      entityId: ctx.stockId,
      details: JSON.stringify({ 
        transactionType: ctx.type, 
        quantity: ctx.quantity, 
        finalBalance: ctx.newQuantity,
        machineId: ctx.machineId,
        notes: ctx.notes 
      }),
      severity: ctx.type === 'OUT' && ctx.newQuantity === 0 ? 'WARNING' : 'INFO',
      timestamp: new Date().toISOString(),
      deviceInfo: navigator.userAgent
    });
  });
  
  await next();
};