// src/core/events/Event.ts
export abstract class DomainEvent {
  public readonly id: string;
  public readonly occurredAt: Date;

  constructor() {
    this.id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.occurredAt = new Date();
  }

  abstract getEventType(): string;
  abstract getAggregateId(): string;
}
