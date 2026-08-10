import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { assetDomainService } from '../services/AssetDomainService';
import { workOrderKernelService } from '../services/WorkOrderKernelService';

describe('Industrial Kernel Phase 1 - Asset Hierarchy, Digital Twin & WO Engine', () => {
  beforeEach(async () => {
    await db.plants.clear();
    await db.functionalLocations.clear();
    await db.machines.clear();
    await db.installedComponents.clear();
    await db.meters.clear();
    await db.meterReadings.clear();
    await db.workRequests.clear();
    await db.workOrders.clear();
    await db.downtimeEvents.clear();
    await db.failureTaxonomyRecords.clear();
    await db.inventory.clear();
    await db.stockReservations.clear();
    await db.stockTransactionLedgers.clear();
  });

  it('creates Plant and Functional Location hierarchy', async () => {
    const plantRes = await assetDomainService.createPlant({
      id: 'PLANT-01',
      code: 'PLANT1',
      name: 'Main Processing Plant',
      createdAt: new Date().toISOString()
    });
    if (!plantRes.ok) throw new Error(`Plant error: ${plantRes.error.message}`);
    expect(plantRes.ok).toBe(true);

    const flRes = await assetDomainService.createFunctionalLocation({
      id: 'FL-HYD-01',
      plantId: 'PLANT-01',
      sectorId: 'SEC-01',
      code: 'FL-HYD-01',
      name: 'Main Hydraulic Unit',
      criticality: 'CRITICAL',
      createdAt: new Date().toISOString()
    });
    if (!flRes.ok) throw new Error(`FL error: ${flRes.error.message}`);
    expect(flRes.ok).toBe(true);
    expect(flRes.value.criticality).toBe('CRITICAL');
  });

  it('registers Asset Digital Twin and updates lifecycle', async () => {
    const assetRes = await assetDomainService.registerAssetDigitalTwin({
      id: 'PRESS-101',
      referenceCode: 'PR-101',
      serialNumber: 'SN-99882',
      manufacturingYear: 2022,
      sectorId: 'SEC-01',
      status: 'Active',
      lifecycleState: 'OPERATING',
      criticality: 'HIGH',
      runningHours: 1200,
      healthIndex: 95
    });
    if (!assetRes.ok) throw new Error(`Asset error: ${assetRes.error.message}`);
    expect(assetRes.ok).toBe(true);

    const updatedRes = await assetDomainService.updateAssetLifecycle('PRESS-101', 'MAINTENANCE', 75);
    if (!updatedRes.ok) throw new Error(`Update asset error: ${updatedRes.error.message}`);
    expect(updatedRes.ok).toBe(true);
    expect(updatedRes.value.lifecycleState).toBe('MAINTENANCE');
    expect(updatedRes.value.healthIndex).toBe(75);
  });

  it('records meter readings and syncs running hours to machine', async () => {
    await assetDomainService.registerAssetDigitalTwin({
      id: 'PUMP-202',
      referenceCode: 'P-202',
      serialNumber: 'SN-11223',
      manufacturingYear: 2023,
      sectorId: 'SEC-02',
      status: 'Active',
      runningHours: 500
    });

    const meterRes = await assetDomainService.registerMeter({
      id: 'MTR-RUN-202',
      assetId: 'PUMP-202',
      name: 'Primary Hour Meter',
      meterType: 'RUNNING_HOURS',
      unit: 'Hours',
      currentReading: 500,
      lastReadingAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    expect(meterRes.ok).toBe(true);

    const readingRes = await assetDomainService.recordMeterReading({
      id: 'RDG-001',
      meterId: 'MTR-RUN-202',
      assetId: 'PUMP-202',
      readingValue: 580,
      recordedAt: new Date().toISOString(),
      recordedBy: 'TECH-01',
      source: 'MANUAL'
    });
    expect(readingRes.ok).toBe(true);

    const updatedMachine = await db.machines.get('PUMP-202');
    expect(updatedMachine?.runningHours).toBe(580);
  });

  it('calculates precision downtime breakdown (Response, Diagnostic, True MTTR, Total Downtime)', async () => {
    const detectedAt = '2026-08-10T08:00:00.000Z';
    const acknowledgedAt = '2026-08-10T08:15:00.000Z'; // 15 min response
    const dispatchedAt = '2026-08-10T08:20:00.000Z';
    const interventionStartedAt = '2026-08-10T08:30:00.000Z'; // 10 min diagnostic
    const repairCompletedAt = '2026-08-10T09:45:00.000Z'; // 75 min true repair time
    const returnedToServiceAt = '2026-08-10T10:00:00.000Z'; // 120 min total downtime

    const downtimeRes = await workOrderKernelService.recordDowntimeEvent({
      id: 'DT-001',
      workOrderId: 'WO-2026-001',
      assetId: 'PRESS-101',
      detectedAt,
      acknowledgedAt,
      dispatchedAt,
      interventionStartedAt,
      repairCompletedAt,
      returnedToServiceAt,
      reason: 'Hydraulic Seal Rupture'
    });

    if (!downtimeRes.ok) throw new Error(`Downtime error: ${downtimeRes.error.message}`);
    expect(downtimeRes.ok).toBe(true);
    expect(downtimeRes.value.responseMinutes).toBe(15);
    expect(downtimeRes.value.diagnosticMinutes).toBe(10);
    expect(downtimeRes.value.trueRepairMinutes).toBe(75);
    expect(downtimeRes.value.totalDowntimeMinutes).toBe(120);
  });

  it('performs atomic stock reservation and records transaction ledger', async () => {
    await db.inventory.put({
      id: 'STK-SEAL-01',
      blueprintId: 'BLUE-SEAL-01',
      warehouseId: 'WH-MAIN',
      locationDetails: 'A1-R2',
      quantityCurrent: 10,
      updatedAt: new Date().toISOString()
    });

    const resResult = await workOrderKernelService.reserveMaterial({
      id: 'RES-001',
      stockItemId: 'STK-SEAL-01',
      blueprintId: 'BLUE-SEAL-01',
      workOrderId: 'WO-2026-001',
      quantityReserved: 3,
      reservedBy: 'STOREKEEPER-1',
      status: 'ACTIVE',
      reservedAt: new Date().toISOString()
    });

    if (!resResult.ok) throw new Error(`Reserve material error: ${resResult.error.message}`);
    expect(resResult.ok).toBe(true);

    const ledgers = await db.stockTransactionLedgers.toArray();
    expect(ledgers.length).toBe(1);
    expect(ledgers[0].transactionType).toBe('RESERVATION');
    expect(ledgers[0].quantity).toBe(3);

    // Issue material from stock
    const issueResult = await workOrderKernelService.recordStockTransaction({
      id: 'LEDGER-ISSUE-01',
      transactionType: 'ISSUE',
      stockItemId: 'STK-SEAL-01',
      blueprintId: 'BLUE-SEAL-01',
      workOrderId: 'WO-2026-001',
      quantity: 3,
      performedBy: 'STOREKEEPER-1',
      reason: 'Issued for WO-2026-001',
      timestamp: new Date().toISOString()
    });

    expect(issueResult.ok).toBe(true);

    const updatedStock = await db.inventory.get('STK-SEAL-01');
    expect(updatedStock?.quantityCurrent).toBe(7);
  });
});
