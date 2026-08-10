import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { preventiveSchedulerService } from '../services/PreventiveSchedulerService';
import { workOrderKernelService } from '../services/WorkOrderKernelService';

describe('Industrial Kernel Phase 2 - Preventive Maintenance & Dynamic Scheduler Engine', () => {
  beforeEach(async () => {
    await db.machines.clear();
    await db.pmPlans.clear();
    await db.workOrders.clear();
    await db.workOrderOperations.clear();
    await db.inventory.clear();
    await db.stockReservations.clear();
    await db.meters.clear();
  });

  it('creates a PM plan and calculates initial next due date', async () => {
    const planRes = await preventiveSchedulerService.createPmPlan({
      id: 'PMP-HYD-01',
      code: 'PMP-H-01',
      title: 'Monthly Hydraulic Pump Filter Overhaul',
      strategyType: 'CALENDAR_BASED',
      frequencyDays: 30,
      priority: 'HIGH',
      estimatedDurationMinutes: 120,
      checklist: [
        { taskIndex: 1, description: 'Check suction pressure & oil level', criticality: 'HIGH', estimatedMinutes: 30 },
        { taskIndex: 2, description: 'Replace main hydraulic filter element', criticality: 'CRITICAL', estimatedMinutes: 90 }
      ],
      partsRequired: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    expect(planRes.ok).toBe(true);
    expect(planRes.value?.nextDueAt).toBeDefined();

    const dbPlan = await db.pmPlans.get('PMP-HYD-01');
    expect(dbPlan?.title).toBe('Monthly Hydraulic Pump Filter Overhaul');
    expect(dbPlan?.checklist.length).toBe(2);
  });

  it('evaluates due calendar PM plans and auto-generates Work Orders and checklist operations', async () => {
    // Setup machine
    await db.machines.put({
      id: 'MACH-MILL-01',
      referenceCode: 'MILL-01',
      serialNumber: 'SN-M-01',
      manufacturingYear: 2023,
      sectorId: 'SEC-PROD',
      status: 'Active'
    });

    const pastDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString(); // Due yesterday

    await preventiveSchedulerService.createPmPlan({
      id: 'PMP-DUE-01',
      code: 'PMP-MILL-30D',
      title: 'Rolling Mill Bearing Lubrication Sweep',
      assetId: 'MACH-MILL-01',
      strategyType: 'CALENDAR_BASED',
      frequencyDays: 30,
      priority: 'MEDIUM',
      estimatedDurationMinutes: 60,
      checklist: [
        { taskIndex: 1, description: 'Grease main bearing block', criticality: 'HIGH', estimatedMinutes: 30 },
        { taskIndex: 2, description: 'Inspect seals for leakage', criticality: 'MEDIUM', estimatedMinutes: 30 }
      ],
      partsRequired: [],
      isActive: true,
      nextDueAt: pastDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const schedulerRes = await preventiveSchedulerService.evaluateAndGenerateDueWorkOrders();
    expect(schedulerRes.ok).toBe(true);
    expect(schedulerRes.value?.generatedWorkOrders.length).toBe(1);

    const generatedWo = schedulerRes.value?.generatedWorkOrders[0];
    expect(generatedWo?.type).toBe('PREVENTIVE');
    expect(generatedWo?.assetId).toBe('MACH-MILL-01');

    // Check WO operations created from checklist
    const ops = await db.workOrderOperations.where('workOrderId').equals(generatedWo!.id).toArray();
    expect(ops.length).toBe(2);
    expect(ops[0].title).toBe('Grease main bearing block');

    // Check plan nextDueAt was updated
    const updatedPlan = await db.pmPlans.get('PMP-DUE-01');
    expect(new Date(updatedPlan!.nextDueAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it('reserves required materials when generating due PM work order', async () => {
    await db.machines.put({
      id: 'MACH-PUMP-99',
      referenceCode: 'PUMP-99',
      serialNumber: 'SN-P-99',
      manufacturingYear: 2024,
      sectorId: 'SEC-HYD',
      status: 'Active'
    });

    // Add stock item
    await db.inventory.put({
      id: 'STOCK-SEAL-01',
      blueprintId: 'BP-SEAL-VITON',
      warehouseId: 'WH-MAIN',
      quantityCurrent: 50,
      locationDetails: 'A-01-02',
      updatedAt: new Date().toISOString()
    });

    const pastDate = new Date(Date.now() - 1000).toISOString();

    await preventiveSchedulerService.createPmPlan({
      id: 'PMP-PARTS-01',
      code: 'PMP-PUMP-SEAL',
      title: 'Pump Viton Seal Replacement',
      assetId: 'MACH-PUMP-99',
      strategyType: 'CALENDAR_BASED',
      frequencyDays: 90,
      priority: 'HIGH',
      estimatedDurationMinutes: 180,
      checklist: [
        { taskIndex: 1, description: 'Dismantle housing and replace Viton seal', criticality: 'CRITICAL', estimatedMinutes: 180 }
      ],
      partsRequired: [
        { blueprintId: 'BP-SEAL-VITON', quantity: 2 }
      ],
      isActive: true,
      nextDueAt: pastDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const res = await preventiveSchedulerService.evaluateAndGenerateDueWorkOrders();
    expect(res.ok).toBe(true);

    const wo = res.value?.generatedWorkOrders[0];
    expect(wo).toBeDefined();

    // Verify material reservation
    const reservations = await db.stockReservations.where('workOrderId').equals(wo!.id).toArray();
    expect(reservations.length).toBe(1);
    expect(reservations[0].quantityReserved).toBe(2);
    expect(reservations[0].blueprintId).toBe('BP-SEAL-VITON');
  });

  it('calculates PM compliance percentage accurately', async () => {
    // Add completed PM WO on time
    await db.workOrders.put({
      id: 'WO-PM-ONTIME',
      code: 'WO-PM-01',
      type: 'PREVENTIVE',
      priority: 'HIGH',
      status: 'COMPLETED',
      assetId: 'MACH-01',
      sectorId: 'SEC-01',
      scheduledStart: '2026-08-01T08:00:00Z',
      scheduledEnd: '2026-08-01T12:00:00Z',
      actualStart: '2026-08-01T08:00:00Z',
      actualEnd: '2026-08-01T11:00:00Z',
      createdAt: '2026-08-01T08:00:00Z',
      updatedAt: '2026-08-01T11:00:00Z'
    });

    // Add overdue completed PM WO
    await db.workOrders.put({
      id: 'WO-PM-LATE',
      code: 'WO-PM-02',
      type: 'PREVENTIVE',
      priority: 'HIGH',
      status: 'COMPLETED',
      assetId: 'MACH-01',
      sectorId: 'SEC-01',
      scheduledStart: '2026-08-02T08:00:00Z',
      scheduledEnd: '2026-08-02T12:00:00Z',
      actualStart: '2026-08-02T08:00:00Z',
      actualEnd: '2026-08-02T16:00:00Z', // Late
      createdAt: '2026-08-02T08:00:00Z',
      updatedAt: '2026-08-02T16:00:00Z'
    });

    const complianceRes = await preventiveSchedulerService.calculatePmCompliance('SEC-01');
    expect(complianceRes.ok).toBe(true);
    expect(complianceRes.value?.totalScheduled).toBe(2);
    expect(complianceRes.value?.completedOnTime).toBe(1);
    expect(complianceRes.value?.compliancePercentage).toBe(50);
  });
});
