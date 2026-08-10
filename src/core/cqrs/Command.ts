// src/core/cqrs/Command.ts
export abstract class Command<T = void> {
  abstract execute(): Promise<T>;
  abstract validate(): boolean;
  abstract rollback(): Promise<void>;
}
