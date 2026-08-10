// src/core/services/WorkOrderKernelService.ts
import { 
  db, 
  WorkRequest, 
  WorkOrder, 
  DowntimeEvent, 
  FailureTaxonomyRecord, 
  StockReservation, 
  StockTransactionLedger 
} from '../db';
import { 
  workRequestSchema, 
  workOrderSchema, 
  downtimeEventSchema, 
  failureTaxonomySchema, 
  stockReservationSchema, 
  stockTransactionLedgerSchema,
  WorkRequestInput,
  WorkOrderInput,
  DowntimeEventInput,
  FailureTaxonomyInput,
  StockReservationInput,
  StockTransactionLedgerInput
} from '../schemas';
import { BaseService } from './BaseService';
import { Result } from '../error';

export class WorkOrderKernelService extends BaseService {
  // --- 1. Work Requests ---
  async createWorkRequest(input: WorkRequestInput): Promise<Result<WorkRequest>> {
    return this.executeAsync(async () => {
      const validated = workRequestSchema.parse(input);
      await db.workRequests.put({ ...validated });
      return validated;
    }, 'createWorkRequest');
  }

  // --- 2. Work Order Operations ---
  async createWorkOrder(input: WorkOrderInput): Promise<Result<WorkOrder>> {
    return this.executeAsync(async () => {
      const validated = workOrderSchema.parse(input);
      await db.workOrders.put({ ...validated });
      return validated;
    }, 'createWorkOrder');
  }

  // --- 3. Precision Downtime Event Tracking (Pure MTTR & Total Downtime) ---
  async recordDowntimeEvent(input: DowntimeEventInput): Promise<Result<DowntimeEvent>> {
    return this.executeAsync(async () => {
      const validated = downtimeEventSchema.parse(input);
      
      // Calculate precise time breakdown if timestamps exist
      if (validated.detectedAt) {
        const detected = new Date(validated.detectedAt).getTime();

        if (validated.acknowledgedAt) {
          const ack = new Date(validated.acknowledgedAt).getTime();
          validated.responseMinutes = Math.max(0, Math.round((ack - detected) / (1000 * 60)));
        }

        if (validated.dispatchedAt && validated.interventionStartedAt) {
          const disp = new Date(validated.dispatchedAt).getTime();
          const start = new Date(validated.interventionStartedAt).getTime();
          validated.diagnosticMinutes = Math.max(0, Math.round((start - disp) / (1000 * 60)));
        }

        // PURE MTTR: True Repair Time = repairCompletedAt - interventionStartedAt
        if (validated.interventionStartedAt && validated.repairCompletedAt) {
          const start = new Date(validated.interventionStartedAt).getTime();
          const complete = new Date(validated.repairCompletedAt).getTime();
          validated.trueRepairMinutes = Math.max(0, Math.round((complete - start) / (1000 * 60)));
        }

        // TOTAL DOWNTIME: returnedToServiceAt - detectedAt
        if (validated.returnedToServiceAt) {
          const returnToService = new Date(validated.returnedToServiceAt).getTime();
          validated.totalDowntimeMinutes = Math.max(0, Math.round((returnToService - detected) / (1000 * 60)));
        }
      }

      await db.downtimeEvents.put({ ...validated });
      return validated;
    }, 'recordDowntimeEvent');
  }

  // --- 4. ISO 14224 Failure Taxonomy Recording ---
  async recordFailureTaxonomy(input: FailureTaxonomyInput): Promise<Result<FailureTaxonomyRecord>> {
    return this.executeAsync(async () => {
      const validated = failureTaxonomySchema.parse(input);
      await db.failureTaxonomyRecords.put({ ...validated });
      return validated;
    }, 'recordFailureTaxonomy');
  }

  // --- 5. Atomic Stock Reservation ---
  async reserveMaterial(input: StockReservationInput): Promise<Result<StockReservation>> {
    return this.executeAsync(async () => {
      const validated = stockReservationSchema.parse(input);

      await db.transaction('rw', [db.inventory, db.stockReservations, db.stockTransactionLedgers], async () => {
        const stockItem = await db.inventory.get(validated.stockItemId);
        if (!stockItem) {
          throw new Error(`Stock item not found: ${validated.stockItemId}`);
        }

        const availableQty = stockItem.quantityCurrent;
        if (availableQty < validated.quantityReserved) {
          throw new Error(`Insufficient stock for reservation. Available: ${availableQty}, Requested: ${validated.quantityReserved}`);
        }

        // Save reservation record
        await db.stockReservations.put({ ...validated });

        // Record Ledger Entry
        const ledgerEntry: StockTransactionLedgerInput = {
          id: `LEDGER-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          transactionType: 'RESERVATION',
          stockItemId: validated.stockItemId,
          blueprintId: validated.blueprintId,
          workOrderId: validated.workOrderId,
          quantity: validated.quantityReserved,
          performedBy: validated.reservedBy,
          reason: `Reserved for WO ${validated.workOrderId}`,
          timestamp: new Date().toISOString()
        };
        const validLedger = stockTransactionLedgerSchema.parse(ledgerEntry);
        await db.stockTransactionLedgers.put({ ...validLedger });
      });

      return validated;
    }, 'reserveMaterial');
  }

  // --- 6. Stock Transaction Ledger (Issue, Receipt, Consumption, Return) ---
  async recordStockTransaction(input: StockTransactionLedgerInput): Promise<Result<StockTransactionLedger>> {
    return this.executeAsync(async () => {
      const validated = stockTransactionLedgerSchema.parse(input);

      await db.transaction('rw', [db.inventory, db.stockTransactionLedgers, db.movements], async () => {
        const stockItem = await db.inventory.get(validated.stockItemId);
        if (!stockItem) {
          throw new Error(`Stock item not found: ${validated.stockItemId}`);
        }

        // Apply inventory delta based on transaction type
        if (['ISSUE', 'CONSUMPTION', 'SCRAP'].includes(validated.transactionType)) {
          stockItem.quantityCurrent -= Math.abs(validated.quantity);
        } else if (['RECEIPT', 'RETURN'].includes(validated.transactionType)) {
          stockItem.quantityCurrent += Math.abs(validated.quantity);
        }

        stockItem.updatedAt = validated.timestamp;
        await db.inventory.put({ ...stockItem });
        await db.stockTransactionLedgers.put({ ...validated });
      });

      return validated;
    }, 'recordStockTransaction');
  }
}

export const workOrderKernelService = new WorkOrderKernelService();
