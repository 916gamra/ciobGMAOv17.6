import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import type { Machine, PdrBlueprint, StockItem, User } from '@/core/db';
import { useAuthSlots } from '@/features/auth/hooks/useAuthSlots';
import { ALL_HARDCODED_SLOTS } from '@/core/config/authSlots';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('RequisitionEngine');

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export function useRequisitionEngine() {
  const authSlots = useAuthSlots();
  const technicians = authSlots.filter(s => s.id.startsWith('TC') && s.isActive);
  const machines = useLiveQuery(() => db.machines.toArray(), []);
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const templates = useLiveQuery(() => db.pdrTemplates.toArray(), []);
  const families = useLiveQuery(() => db.pdrFamilies.toArray(), []);

  const isLoading = 
    machines === undefined || 
    blueprints === undefined || 
    inventory === undefined ||
    templates === undefined ||
    families === undefined;

  const submitRequisition = async (
    technicianId: string, 
    machineId: string, 
    cartLines: Array<{ blueprintId: string, quantity: number }>
  ): Promise<Result<string>> => {
    try {
      logger.info('Starting requisition submission', { technicianId, machineId, cartLines });

      const baseSlot = ALL_HARDCODED_SLOTS.find(s => s.id === technicianId);
      const override = await db.userOverrides.get(technicianId);
      
      if (!baseSlot) {
        return { ok: false, error: new Error(`Technician slot ${technicianId} is not a valid system slot.`) };
      }

      const tech = { ...baseSlot, ...override } as User;
      if (!tech.isActive) {
        return { ok: false, error: new Error(`Technician slot ${technicianId} is inactive.`) };
      }

      let generatedReqId = '';

      // CRITICAL ACID LOGIC
      await db.transaction(
        'rw', 
        [db.partRequisitions, db.partRequisitionLines, db.inventory, db.movements, db.machines, db.pdrBlueprints],
        async () => {
          const machine = await db.machines.get(machineId);
          
          if (!machine) {
            throw new Error("Machine not found. Validation failed.");
          }

          generatedReqId = crypto.randomUUID();
          const date = new Date().toISOString();

          // 1. Create part requisition
          await db.partRequisitions.add({
            id: generatedReqId,
            technicianId,
            machineId,
            status: 'FULFILLED',
            requestDate: date
          });

          // 2. Loop through cart
          for (const line of cartLines) {
            const blueprint = await db.pdrBlueprints.get(line.blueprintId);
            if (!blueprint) {
              throw new Error(`Blueprint ${line.blueprintId} not found.`);
            }

            const invItem = await db.inventory.where('blueprintId').equals(line.blueprintId).first();
            if (!invItem) {
              throw new Error(`Item ${blueprint.reference} has no inventory record.`);
            }

            if (invItem.quantityCurrent < line.quantity) {
              throw new Error(`Stock Insufficient for ${blueprint.reference}. Available: ${invItem.quantityCurrent}, Requested: ${line.quantity}`);
            }

            // 3. Deduct stock
            await db.inventory.update(invItem.id, {
              quantityCurrent: invItem.quantityCurrent - line.quantity,
              updatedAt: date
            });

            // 4. Create Requisition Line
            await db.partRequisitionLines.add({
              id: crypto.randomUUID(),
              requisitionId: generatedReqId,
              blueprintId: line.blueprintId,
              quantity: line.quantity
            });

            // 5. Audit Trail (Movement)
            await db.movements.add({
              id: crypto.randomUUID(),
              stockId: invItem.id,
              type: 'OUT',
              quantity: line.quantity,
              performedBy: `${tech.name} [ID: ${tech.realBadgeId || tech.id}]`,
              notes: `Requisition (auto-deduct) | Machine: ${machine.referenceCode}`,
              timestamp: date
            });
          }
      });
      
      logger.info('Requisition completed successfully', { requisitionId: generatedReqId });
      return { ok: true, value: generatedReqId };
      
    } catch (error) {
      logger.error('Failed to submit requisition', error, { technicianId, machineId });
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  return {
    technicians,
    machines: machines || [],
    blueprints: blueprints || [],
    inventory: inventory || [],
    templates: templates || [],
    families: families || [],
    isLoading,
    submitRequisition
  };
}
