import { Result } from './Result';

export interface IRepository<T extends { id: string }> {
  getById(id: string): Promise<Result<T | undefined>>;
  getAll(): Promise<Result<T[]>>;
  create(item: T): Promise<Result<string>>;
  update(id: string, item: Partial<T>): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
}

export interface IQueryableRepository<T extends { id: string }> extends IRepository<T> {
  find(predicate: (item: T) => boolean): Promise<Result<T[]>>;
  findOne(predicate: (item: T) => boolean): Promise<Result<T | undefined>>;
}
