import { db, PmPlan, WorkOrder, WorkOrderOperation } from '../db';
import { pmPlanSchema, PmPlanInput } from '../schemas';
import { BaseService, Result } from './BaseService';
import { workOrderKernelService } from './WorkOrderKernelService';

export class PreventiveSchedulerService extends BaseService {
  /**
   * Create or register a new Preventive Maintenance Plan
   */
  async createPmPlan(input: PmPlanInput): Promise<Result<PmPlan>> {
    return this.executeAsync(async () => {
      const validated = pmPlanSchema.parse(input);

      // Calculate initial nextDueAt if not set
      let nextDueAt = validated.nextDueAt;
      if (!nextDueAt && validated.frequencyDays) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + validated.frequencyDays);
        nextDueAt = dueDate.toISOString();
      }

      const plan: PmPlan = {
        ...validated,
        nextDueAt
      };

      await db.pmPlans.put(plan);
      return plan;
    }, 'createPmPlan');
  }

  /**
   * Evaluates all active PM plans and auto-generates Work Orders for due maintenance tasks
   */
  async evaluateAndGenerateDueWorkOrders(): Promise<Result<{ generatedWorkOrders: WorkOrder[]; plansProcessed: number }>> {
    return this.executeAsync(async () => {
      const activePlans = await db.pmPlans.filter(p => p.isActive).toArray();
      const generatedWorkOrders: WorkOrder[] = [];
      const now = new Date();
      const nowIso = now.toISOString();

      for (const plan of activePlans) {
        let isDue = false;

        // 1. Calendar-based or Hybrid check
        if ((plan.strategyType === 'CALENDAR_BASED' || plan.strategyType === 'HYBRID') && plan.nextDueAt) {
          if (new Date(plan.nextDueAt) <= now) {
            isDue = true;
          }
        }

        // 2. Usage/Meter-based check
        if ((plan.strategyType === 'USAGE_BASED' || plan.strategyType === 'METER_BASED' || plan.strategyType === 'HYBRID') && plan.assetId) {
          const machine = await db.machines.get(plan.assetId);
          if (machine && plan.frequencyHours && (machine.runningHours ?? 0) >= (plan.frequencyHours)) {
            isDue = true;
          }

          if (plan.meterId && plan.thresholdValue) {
            const meter = await db.meters.get(plan.meterId);
            if (meter && meter.currentReading >= plan.thresholdValue) {
              isDue = true;
            }
          }
        }

        if (isDue) {
          const machine = plan.assetId ? await db.machines.get(plan.assetId) : undefined;
          const sectorId = machine?.sectorId || 'SEC-01';

          const woId = `WO-PM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const woCode = `WO-PM-${plan.code}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

          const scheduledEnd = new Date(now.getTime() + (plan.estimatedDurationMinutes || 60) * 60 * 1000).toISOString();

          const newWo: WorkOrder = {
            id: woId,
            code: woCode,
            type: 'PREVENTIVE',
            priority: plan.priority,
            status: 'SCHEDULED',
            assetId: plan.assetId || 'ASSET-GENERIC',
            functionalLocationId: plan.functionalLocationId,
            sectorId,
            assignedTechnicianId: plan.assignedTechnicianId,
            scheduledStart: nowIso,
            scheduledEnd,
            totalLaborHours: (plan.estimatedDurationMinutes || 60) / 60,
            notes: `[PM PLAN: ${plan.title}]\nChecklist tasks: ${plan.checklist.length}`,
            createdAt: nowIso,
            updatedAt: nowIso
          };

          // Save WO and create operations from checklist
          await db.transaction('rw', [db.workOrders, db.workOrderOperations, db.pmPlans], async () => {
            await db.workOrders.put(newWo);

            // Checklist operations
            for (let i = 0; i < plan.checklist.length; i++) {
              const task = plan.checklist[i];
              const op: WorkOrderOperation = {
                id: `OP-${woId}-${i + 1}`,
                workOrderId: woId,
                sequenceNumber: (i + 1) * 10,
                title: task.description,
                description: `Criticality: ${task.criticality}`,
                status: 'PENDING',
                estimatedMinutes: task.estimatedMinutes
              };
              await db.workOrderOperations.put(op);
            }

            // Calculate next due date
            let nextDue: string | undefined = undefined;
            if (plan.frequencyDays) {
              const nextDate = new Date();
              nextDate.setDate(nextDate.getDate() + plan.frequencyDays);
              nextDue = nextDate.toISOString();
            }

            // Update plan state
            plan.lastGeneratedAt = nowIso;
            if (nextDue) {
              plan.nextDueAt = nextDue;
            }
            await db.pmPlans.put({ ...plan });
          });

          // Reserve materials if required
          if (plan.partsRequired && plan.partsRequired.length > 0) {
            for (const part of plan.partsRequired) {
              // Find stock item for blueprint
              const stockItems = await db.inventory.where('blueprintId').equals(part.blueprintId).toArray();
              if (stockItems.length > 0) {
                await workOrderKernelService.reserveMaterial({
                  id: `RES-${woId}-${part.blueprintId}`,
                  stockItemId: stockItems[0].id,
                  blueprintId: part.blueprintId,
                  workOrderId: woId,
                  quantityReserved: part.quantity,
                  reservedBy: 'SYSTEM_PM_SCHEDULER',
                  status: 'ACTIVE',
                  reservedAt: nowIso
                });
              }
            }
          }

          generatedWorkOrders.push(newWo);
        }
      }

      return {
        generatedWorkOrders,
        plansProcessed: activePlans.length
      };
    }, 'evaluateAndGenerateDueWorkOrders');
  }

  /**
   * Calculates Preventive Maintenance Compliance Percentage
   */
  async calculatePmCompliance(sectorId?: string): Promise<Result<{ totalScheduled: number; completedOnTime: number; compliancePercentage: number }>> {
    return this.executeAsync(async () => {
      let pmWorkOrders = await db.workOrders.filter(w => w.type === 'PREVENTIVE').toArray();

      if (sectorId) {
        pmWorkOrders = pmWorkOrders.filter(w => w.sectorId === sectorId);
      }

      const totalScheduled = pmWorkOrders.length;
      if (totalScheduled === 0) {
        return { totalScheduled: 0, completedOnTime: 0, compliancePercentage: 100 };
      }

      const completedOnTime = pmWorkOrders.filter(w => {
        if (w.status !== 'COMPLETED' || !w.actualEnd) return false;
        if (!w.scheduledEnd) return true;
        return new Date(w.actualEnd) <= new Date(w.scheduledEnd);
      }).length;

      const compliancePercentage = Math.round((completedOnTime / totalScheduled) * 100);

      return {
        totalScheduled,
        completedOnTime,
        compliancePercentage
      };
    }, 'calculatePmCompliance');
  }
}

export const preventiveSchedulerService = new PreventiveSchedulerService();
