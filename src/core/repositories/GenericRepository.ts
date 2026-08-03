import { db } from '../db';
import type { Table, UpdateSpec } from 'dexie';
import { Result, success, failure } from '../types/Result';
import { IRepository } from '../types/Generic';
import { AppError } from '../errors/AppError';

export class GenericRepository<T extends { id: string }> implements IRepository<T> {
  constructor(protected table: Table<T>) {}

  async getById(id: string): Promise<Result<T | undefined>> {
    try {
      const item = await this.table.get(id);
      return success(item);
    } catch (error) {
      return failure(new AppError('DB_ERROR', `Failed to fetch by id: ${id}`, 500, { error }));
    }
  }

  async getAll(): Promise<Result<T[]>> {
    try {
      const items = await this.table.toArray();
      return success(items);
    } catch (error) {
      return failure(new AppError('DB_ERROR', 'Failed to fetch all items', 500, { error }));
    }
  }

  async create(item: T): Promise<Result<string>> {
    try {
      await this.table.add(item);
      return success(item.id);
    } catch (error) {
      return failure(new AppError('DB_ERROR', 'Failed to create item', 500, { error }));
    }
  }

  async update(id: string, item: Partial<T>): Promise<Result<void>> {
    try {
      await this.table.update(id, item as UpdateSpec<T>);
      return success(undefined);
    } catch (error) {
      return failure(new AppError('DB_ERROR', `Failed to update item: ${id}`, 500, { error }));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.table.delete(id);
      return success(undefined);
    } catch (error) {
      return failure(new AppError('DB_ERROR', `Failed to delete item: ${id}`, 500, { error }));
    }
  }
}
