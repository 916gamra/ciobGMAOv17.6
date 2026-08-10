// src/features/pdr-engine/cqrs/PdrQueries.ts
import { Query } from '@/core/cqrs/Query';
import { db, PdrBlueprint, StockItem } from '@/core/db';

export class GetPdrBlueprintsByTemplateQuery extends Query<PdrBlueprint[]> {
  constructor(public readonly templateId: string) {
    super();
  }

  validate(): boolean {
    return !!this.templateId;
  }

  async execute(): Promise<PdrBlueprint[]> {
    return await db.pdrBlueprints
      .where('templateId')
      .equals(this.templateId)
      .toArray();
  }

  cache(): boolean {
    return true;
  }

  cacheDuration(): number {
    return 10 * 1000; // 10 seconds cache
  }
}

export class GetStockItemByBlueprintQuery extends Query<StockItem[]> {
  constructor(public readonly blueprintId: string) {
    super();
  }

  validate(): boolean {
    return !!this.blueprintId;
  }

  async execute(): Promise<StockItem[]> {
    return await db.inventory
      .where('blueprintId')
      .equals(this.blueprintId)
      .toArray();
  }

  cache(): boolean {
    return false;
  }

  cacheDuration(): number {
    return 0;
  }
}
