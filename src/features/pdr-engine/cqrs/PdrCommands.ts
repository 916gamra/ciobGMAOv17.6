// src/features/pdr-engine/cqrs/PdrCommands.ts
import { Command } from '@/core/cqrs/Command';
import { db } from '@/core/db';
import { Validator } from '@/core/validation/schemas';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { eventStore } from '@/core/events/EventStore';
import { DomainEvent } from '@/core/events/Event';

// --- Events Definitions ---

export class PdrBlueprintCreatedEvent extends DomainEvent {
  constructor(
    public readonly blueprintId: string,
    public readonly templateId: string,
    public readonly reference: string,
    public readonly minThreshold: number
  ) {
    super();
  }
  getEventType(): string { return 'PDR_BLUEPRINT_CREATED'; }
  getAggregateId(): string { return this.blueprintId; }
}

export class StockItemAdjustedEvent extends DomainEvent {
  constructor(
    public readonly stockId: string,
    public readonly blueprintId: string,
    public readonly oldQty: number,
    public readonly newQty: number,
    public readonly reason: string
  ) {
    super();
  }
  getEventType(): string { return 'STOCK_ITEM_ADJUSTED'; }
  getAggregateId(): string { return this.stockId; }
}

// --- Commands Definitions ---

// 1. Create Pdr Blueprint
export const CreatePdrBlueprintSchema = z.object({
  templateId: z.string().uuid('Template ID required'),
  reference: z.string().min(1, 'Reference is required'),
  unit: z.string().default('Pcs'),
  minThreshold: z.number().min(0),
  model: z.string().optional(),
  technicalSpecs: z.string().optional(),
});

export type CreatePdrBlueprintInput = z.infer<typeof CreatePdrBlueprintSchema>;

export class CreatePdrBlueprintCommand extends Command<string> {
  private generatedId: string | null = null;

  constructor(public readonly input: CreatePdrBlueprintInput) {
    super();
  }

  validate(): boolean {
    const res = Validator.safeValidate(CreatePdrBlueprintSchema, this.input);
    return res.ok;
  }

  async execute(): Promise<string> {
    const id = uuidv4();
    this.generatedId = id;

    // Persist commercial model (Blueprint) to DB
    await db.pdrBlueprints.add({
      id,
      templateId: this.input.templateId,
      reference: this.input.reference,
      unit: this.input.unit,
      minThreshold: this.input.minThreshold,
      model: this.input.model,
      technicalSpecs: this.input.technicalSpecs,
      createdAt: new Date().toISOString(),
    });

    // Append event to Event Store
    const event = new PdrBlueprintCreatedEvent(
      id,
      this.input.templateId,
      this.input.reference,
      this.input.minThreshold
    );
    await eventStore.append(event, id);

    return id;
  }

  async rollback(): Promise<void> {
    if (this.generatedId) {
      await db.pdrBlueprints.delete(this.generatedId);
    }
  }
}

// 2. Adjust Stock
export const AdjustStockSchema = z.object({
  stockId: z.string().uuid('Stock ID required'),
  quantity: z.number(),
  reason: z.string().min(1, 'Reason required'),
  performedBy: z.string().min(1, 'User required'),
});

export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;

export class AdjustStockCommand extends Command<void> {
  private originalQty: number | null = null;

  constructor(public readonly input: AdjustStockInput) {
    super();
  }

  validate(): boolean {
    const res = Validator.safeValidate(AdjustStockSchema, this.input);
    return res.ok;
  }

  async execute(): Promise<void> {
    const stockItem = await db.inventory.get(this.input.stockId);
    if (!stockItem) {
      throw new Error(`Stock item ${this.input.stockId} not found`);
    }

    this.originalQty = stockItem.quantityCurrent;
    const newQty = stockItem.quantityCurrent + this.input.quantity;

    if (newQty < 0) {
      throw new Error(`Insufficient stock level. Current: ${stockItem.quantityCurrent}, Adjust: ${this.input.quantity}`);
    }

    // Update main table
    await db.inventory.update(this.input.stockId, {
      quantityCurrent: newQty,
      updatedAt: new Date().toISOString(),
    });

    // Write movement log
    await db.movements.add({
      id: uuidv4(),
      stockId: this.input.stockId,
      type: this.input.quantity >= 0 ? 'IN' : 'OUT',
      quantity: Math.abs(this.input.quantity),
      performedBy: this.input.performedBy,
      notes: this.input.reason,
      timestamp: new Date().toISOString(),
    });

    // Append event to Event Store
    const event = new StockItemAdjustedEvent(
      this.input.stockId,
      stockItem.blueprintId,
      this.originalQty,
      newQty,
      this.input.reason
    );
    await eventStore.append(event, this.input.stockId);
  }

  async rollback(): Promise<void> {
    if (this.originalQty !== null) {
      await db.inventory.update(this.input.stockId, {
        quantityCurrent: this.originalQty,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}
