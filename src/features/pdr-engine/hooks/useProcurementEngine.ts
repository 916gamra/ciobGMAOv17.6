import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { measureOperation, logger } from '@/core/logger';
import type { PurchaseOrder, PurchaseOrderLine, PdrBlueprint } from '@/core/db';

export interface EnrichedPurchaseOrderLine extends PurchaseOrderLine {
  blueprintReference: string;
}

export interface EnrichedPurchaseOrder extends PurchaseOrder {
  lines: EnrichedPurchaseOrderLine[];
  totalAmount: number;
}

/**
 * 🏭 Procurement Engine Hook
 * 
 * Provides reactive access to purchase orders and exposes strictly validated
 * mutation methods to manage the procurement lifecycle.
 */
export function useProcurementEngine() {
  const purchaseOrders = useLiveQuery(() => db.purchaseOrders.orderBy('orderDate').reverse().toArray(), []);
  const purchaseOrderLines = useLiveQuery(() => db.purchaseOrderLines.toArray(), []);
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);

  const isLoading = purchaseOrders === undefined || purchaseOrderLines === undefined || blueprints === undefined;

  const enrichedOrders = useMemo((): EnrichedPurchaseOrder[] => {
    if (!purchaseOrders || !purchaseOrderLines || !blueprints) return [];

    // Map for fast blueprint lookups
    const blueprintMap = new Map<string, PdrBlueprint>();
    blueprints.forEach(b => blueprintMap.set(b.id, b));

    // Group lines by orderId
    const linesByOrderId = new Map<string, EnrichedPurchaseOrderLine[]>();
    purchaseOrderLines.forEach(line => {
      const blueprint = blueprintMap.get(line.blueprintId);
      const enrichedLine: EnrichedPurchaseOrderLine = {
        ...line,
        blueprintReference: blueprint?.reference || 'Unknown Reference'
      };

      const existingLines = linesByOrderId.get(line.orderId) || [];
      existingLines.push(enrichedLine);
      linesByOrderId.set(line.orderId, existingLines);
    });

    // Enrich orders
    return purchaseOrders.map(order => {
      const lines = linesByOrderId.get(order.id) || [];
      const totalAmount = lines.reduce((sum, line) => sum + (line.quantity * (line.unitPrice || 0)), 0);

      return {
        ...order,
        lines,
        totalAmount
      };
    });
  }, [purchaseOrders, purchaseOrderLines, blueprints]);

  /**
   * ✅ Creates a PENDING Purchase Order
   * 
   * Initiates a new procurement process by creating an order and attaching its lines atomically.
   * 
   * @param supplierName - Legal name of the supplier
   * @param linesData - Array containing blueprint references and quantities
   * 
   * @throws {Error} If the database transaction fails
   * @returns {Promise<void>}
   */
  const createPendingOrder = async (supplierName: string, linesData: Array<{ blueprintId: string, quantity: number, unitPrice?: number }>): Promise<void> => {
    return measureOperation('Procurement.CreatePending', async () => {
      const orderId = crypto.randomUUID();
      const orderDate = new Date().toISOString();

      await db.transaction('rw', db.purchaseOrders, db.purchaseOrderLines, async () => {
        await db.purchaseOrders.add({
          id: orderId,
          supplierName,
          status: 'PENDING',
          orderDate,
          createdAt: orderDate
        });

        const linesToInsert: PurchaseOrderLine[] = linesData.map(line => ({
          id: crypto.randomUUID(),
          orderId,
          blueprintId: line.blueprintId,
          quantity: line.quantity,
          unitPrice: line.unitPrice || 0
        }));

        await db.purchaseOrderLines.bulkAdd(linesToInsert);
      });
      logger.info({ orderId, supplierName }, 'Pending order created securely');
    });
  };

  /**
   * ✅ Confirms a Purchase Order
   * 
   * Moves the status from PENDING to ORDERED, implying it has been sent to the supplier.
   * 
   * @param orderId - Target order UUID
   * @returns {Promise<void>}
   */
  const confirmOrder = async (orderId: string): Promise<void> => {
    return measureOperation('Procurement.ConfirmOrder', async () => {
      await db.purchaseOrders.update(orderId, { status: 'ORDERED' });
      logger.info({ orderId }, 'Purchase order confirmed');
    });
  };

  /**
   * ✅ Receives an Order and Injects into Stock
   * 
   * Processes the delivery of an order. It atomically increments the stock
   * for each line item and generates an audit trail movement (IN).
   * 
   * @param orderId - UUID of the incoming order
   * @param performedBy - System marker for the actor
   * 
   * @throws {Error} If the order is already fulfilled or not found
   * @returns {Promise<void>}
   */
  const fulfillOrder = async (orderId: string, performedBy: string = 'Procurement Auto-Fulfillment'): Promise<void> => {
    return measureOperation('Procurement.FulfillOrder', async () => {
      let lineCount = 0;
      await db.transaction('rw', db.purchaseOrders, db.purchaseOrderLines, db.inventory, db.movements, async () => {
        const order = await db.purchaseOrders.get(orderId);
        if (!order) throw new Error('Order not found');
        if (order.status === 'FULFILLED') throw new Error('Order already fulfilled');

        const lines = await db.purchaseOrderLines.where('orderId').equals(orderId).toArray();
        lineCount = lines.length;

        for (const line of lines) {
          let invItem = await db.inventory.where('blueprintId').equals(line.blueprintId).first();
          let stockId = invItem?.id;

          if (!invItem) {
            stockId = crypto.randomUUID();
            await db.inventory.add({
              id: stockId,
              blueprintId: line.blueprintId,
              warehouseId: 'WH-MAIN',
              quantityCurrent: line.quantity,
              updatedAt: new Date().toISOString()
            });
          } else {
            await db.inventory.update(invItem.id, {
              quantityCurrent: invItem.quantityCurrent + line.quantity,
              updatedAt: new Date().toISOString()
            });
          }

          await db.movements.add({
            id: crypto.randomUUID(),
            stockId: stockId!,
            type: 'IN',
            quantity: line.quantity,
            performedBy,
            notes: `Received from PO #${orderId.substring(0, 8)}`,
            timestamp: new Date().toISOString()
          });
        }

        await db.purchaseOrders.update(orderId, { status: 'FULFILLED' });
      });
      logger.info({ orderId, lineCount }, 'Order fulfilled and stock globally updated');
    });
  };

  return {
    orders: enrichedOrders,
    isLoading,
    createPendingOrder,
    confirmOrder,
    fulfillOrder
  };
}
