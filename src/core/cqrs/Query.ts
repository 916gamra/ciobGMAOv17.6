// src/core/cqrs/Query.ts
export abstract class Query<T> {
  abstract execute(): Promise<T>;
  abstract cache(): boolean;
  abstract cacheDuration(): number;
}
