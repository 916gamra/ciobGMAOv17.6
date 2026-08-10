// src/core/types/advanced.ts
import { ValidationError } from '@/core/error';

// --- 1. Branded Types Core ---
declare const brand: unique symbol;
export type Brand<T, B> = T & { readonly [brand]: B };

// Domain Brands
export type InventoryId = Brand<string, 'InventoryId'>;
export type PartId = Brand<string, 'PartId'>;
export type UserId = Brand<string, 'UserId'>;
export type TransactionId = Brand<string, 'TransactionId'>;

// Brand Converters / Validators
export function toInventoryId(value: string): InventoryId {
  if (!value || value.trim().length === 0) {
    throw new ValidationError('Invalid InventoryId: Cannot be empty');
  }
  return value as InventoryId;
}

export function toPartId(value: string): PartId {
  if (!value || value.trim().length === 0) {
    throw new ValidationError('Invalid PartId: Cannot be empty');
  }
  return value as PartId;
}

export function toUserId(value: string): UserId {
  if (!value || value.trim().length === 0) {
    throw new ValidationError('Invalid UserId: Cannot be empty');
  }
  return value as UserId;
}

export function unBrand<T, B>(brandedValue: Brand<T, B>): T {
  return brandedValue as T;
}

// --- 2. Discriminated Unions for PDR Transactions ---
export type InventoryTransaction =
  | {
      type: 'IN';
      quantity: number;
      reason: string;
      sourceLocation?: string;
    }
  | {
      type: 'OUT';
      quantity: number;
      reason: string;
      requisitionId: string;
      destinationMachineId?: string;
    }
  | {
      type: 'ADJ';
      quantity: number;
      reason: string;
      physicalQuantity: number;
      reconciledByStorekeeper: boolean;
    };

// --- 3. Advanced Type Guards ---
export function isInTransaction(
  tx: InventoryTransaction
): tx is InventoryTransaction & { type: 'IN' } {
  return tx.type === 'IN';
}

export function isOutTransaction(
  tx: InventoryTransaction
): tx is InventoryTransaction & { type: 'OUT' } {
  return tx.type === 'OUT';
}

export function isAdjustmentTransaction(
  tx: InventoryTransaction
): tx is InventoryTransaction & { type: 'ADJ' } {
  return tx.type === 'ADJ';
}

// --- 4. Conditional & Utility Types ---
export type Flatten<T> = T extends Array<infer U> ? U : T;

export type Asyncify<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : never;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// --- 5. Generic Constraints ---
export interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
