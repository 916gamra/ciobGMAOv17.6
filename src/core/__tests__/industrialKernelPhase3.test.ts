import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { assetDomainService } from '../services/AssetDomainService';

describe('Industrial Kernel Phase 3 - Machine Telemetry & CBM Engine', () => {
  beforeEach(async () => {
    await db.plants.clear();
    await db.functionalLocations.clear();
    await db.machines.clear();
    await db.meters.clear();
    await db.meterReadings.clear();
    await db.workRequests.clear();
  });

  it('evaluates normal telemetry readings without raising work requests', async () => {
    await assetDomainService.registerAssetDigitalTwin({
      id: 'COMP-301',
      referenceCode: 'C-301',
      serialNumber: 'SN-COMP-01',
      manufacturingYear: 2024,
      sectorId: 'SEC-01',
      status: 'Active',
      healthIndex: 100
    });

    await assetDomainService.registerMeter({
      id: 'MTR-TEMP-01',
      assetId: 'COMP-301',
      name: 'Main Bearing Oil Temp',
      meterType: 'TEMPERATURE',
      unit: '°C',
      currentReading: 65,
      warningThresholdHigh: 85,
      criticalThresholdHigh: 95,
      lastReadingAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    const readingRes = await assetDomainService.recordMeterReading({
      id: 'RDG-TEMP-01',
      meterId: 'MTR-TEMP-01',
      assetId: 'COMP-301',
      readingValue: 70, // Normal value (< 85°C)
      recordedAt: new Date().toISOString(),
      recordedBy: 'IOT_SENSOR_01',
      source: 'IOT'
    });

    expect(readingRes.ok).toBe(true);

    const updatedMachine = await db.machines.get('COMP-301');
    expect(updatedMachine?.healthIndex).toBe(100);

    const requests = await db.workRequests.toArray();
    expect(requests.length).toBe(0);
  });

  it('triggers warning alert and degrades health index on warning threshold breach', async () => {
    await assetDomainService.registerAssetDigitalTwin({
      id: 'COMP-302',
      referenceCode: 'C-302',
      serialNumber: 'SN-COMP-02',
      manufacturingYear: 2024,
      sectorId: 'SEC-01',
      status: 'Active',
      healthIndex: 100
    });

    await assetDomainService.registerMeter({
      id: 'MTR-VIB-01',
      assetId: 'COMP-302',
      name: 'Drive Shaft Vibration',
      meterType: 'VIBRATION',
      unit: 'mm/s',
      currentReading: 2.1,
      warningThresholdHigh: 4.5,
      criticalThresholdHigh: 7.0,
      lastReadingAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    const readingRes = await assetDomainService.recordMeterReading({
      id: 'RDG-VIB-01',
      meterId: 'MTR-VIB-01',
      assetId: 'COMP-302',
      readingValue: 5.2, // Warning breach (> 4.5 mm/s)
      recordedAt: new Date().toISOString(),
      recordedBy: 'IOT_SENSOR_02',
      source: 'IOT'
    });

    expect(readingRes.ok).toBe(true);

    const updatedMachine = await db.machines.get('COMP-302');
    expect(updatedMachine?.healthIndex).toBe(90); // 100 - 10

    const requests = await db.workRequests.toArray();
    expect(requests.length).toBe(1);
    expect(requests[0].priority).toBe('HIGH');
    expect(requests[0].symptom).toContain('[CBM AUTO-WARNING]');
  });

  it('triggers emergency CBM work request on critical threshold breach', async () => {
    await assetDomainService.registerAssetDigitalTwin({
      id: 'HYD-PRESS-01',
      referenceCode: 'HP-01',
      serialNumber: 'SN-HP-99',
      manufacturingYear: 2022,
      sectorId: 'SEC-02',
      status: 'Active',
      healthIndex: 90
    });

    await assetDomainService.registerMeter({
      id: 'MTR-PRESS-01',
      assetId: 'HYD-PRESS-01',
      name: 'Hydraulic System Pressure',
      meterType: 'PRESSURE',
      unit: 'Bar',
      currentReading: 210,
      warningThresholdHigh: 250,
      criticalThresholdHigh: 280,
      lastReadingAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    const readingRes = await assetDomainService.recordMeterReading({
      id: 'RDG-PRESS-CRIT',
      meterId: 'MTR-PRESS-01',
      assetId: 'HYD-PRESS-01',
      readingValue: 295, // Critical breach (> 280 Bar)
      recordedAt: new Date().toISOString(),
      recordedBy: 'IOT_SENSOR_PRESS',
      source: 'IOT'
    });

    expect(readingRes.ok).toBe(true);

    const updatedMachine = await db.machines.get('HYD-PRESS-01');
    expect(updatedMachine?.healthIndex).toBe(65); // 90 - 25

    const requests = await db.workRequests.toArray();
    expect(requests.length).toBe(1);
    expect(requests[0].priority).toBe('EMERGENCY');
    expect(requests[0].symptom).toContain('[CBM AUTO-ALERT]');
    expect(requests[0].requestedBy).toBe('SYSTEM_IOT_CBM');
  });
});
