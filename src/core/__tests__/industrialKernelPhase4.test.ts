import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { reliabilityKernelService } from '../services/ReliabilityKernelService';

describe('Industrial Kernel Phase 4 - Reliability Engineering, RAMS, OEE & Cost Analytics Engine', () => {
  beforeEach(async () => {
    await db.machines.clear();
    await db.downtimeEvents.clear();
    await db.failureTaxonomyRecords.clear();
    await db.maintenanceCostLedgers.clear();
    await db.rcmAnalyses.clear();
  });

  it('calculates RAMS metrics (MTBF, MTTR, Availability, Reliability) accurately', async () => {
    await db.machines.put({
      id: 'MACH-COMP-01',
      referenceCode: 'COMP-01',
      serialNumber: 'SN-C-01',
      manufacturingYear: 2022,
      sectorId: 'SEC-MAIN',
      status: 'Active'
    });

    // Add 2 downtime events with 60 mins (1 hr) true repair time each, total downtime 120 mins (2 hrs)
    await db.downtimeEvents.put({
      id: 'DT-01',
      assetId: 'MACH-COMP-01',
      detectedAt: '2026-08-01T08:00:00Z',
      trueRepairMinutes: 60,
      totalDowntimeMinutes: 120
    });

    await db.downtimeEvents.put({
      id: 'DT-02',
      assetId: 'MACH-COMP-01',
      detectedAt: '2026-08-15T10:00:00Z',
      trueRepairMinutes: 60,
      totalDowntimeMinutes: 120
    });

    const ramsRes = await reliabilityKernelService.calculateAssetRamsMetrics('MACH-COMP-01', 30); // 30 days = 720 hrs
    expect(ramsRes.ok).toBe(true);

    const metrics = ramsRes.value!;
    expect(metrics.failureCount).toBe(2);
    expect(metrics.totalDowntimeHours).toBe(4); // 240 mins / 60
    expect(metrics.mttrHours).toBe(1); // 120 true repair mins / 2 / 60
    expect(metrics.mtbfHours).toBe(358); // (720 - 4) / 2
    expect(metrics.availabilityPercentage).toBeGreaterThan(99);
    expect(metrics.reliabilityPercentage).toBeGreaterThan(90);
  });

  it('calculates Overall Equipment Effectiveness (OEE) with Availability, Performance, and Quality rates', async () => {
    await db.machines.put({
      id: 'MACH-PRESS-01',
      referenceCode: 'PRESS-01',
      serialNumber: 'SN-P-01',
      manufacturingYear: 2023,
      sectorId: 'SEC-PRESS',
      status: 'Active'
    });

    // 1 hour downtime in a 10 hour shift (90% availability)
    await db.downtimeEvents.put({
      id: 'DT-PRESS-1',
      assetId: 'MACH-PRESS-01',
      detectedAt: '2026-08-10T08:00:00Z',
      totalDowntimeMinutes: 60
    });

    // Planned 10 hrs, Ideal cycle time 30s per unit, Total produced 900 units, Good 855 units
    const oeeRes = await reliabilityKernelService.calculateOeeMetrics(
      'MACH-PRESS-01',
      10,   // planned hours
      30,   // ideal cycle time 30s
      900,  // total units
      855   // good units
    );

    expect(oeeRes.ok).toBe(true);
    const oee = oeeRes.value!;

    expect(oee.availabilityRate).toBe(90); // 9h / 10h
    expect(oee.qualityRate).toBe(95); // 855 / 900
    expect(oee.performanceRate).toBeGreaterThan(80);
    expect(oee.oeePercentage).toBeGreaterThan(60);
  });

  it('generates Bad-Actor Pareto ranking across plant assets', async () => {
    await db.machines.put({ id: 'M-1', referenceCode: 'BAD-ACTOR-1', serialNumber: 'SN-1', manufacturingYear: 2021, sectorId: 'SEC-01', status: 'Active' });
    await db.machines.put({ id: 'M-2', referenceCode: 'GOOD-ASSET-2', serialNumber: 'SN-2', manufacturingYear: 2024, sectorId: 'SEC-01', status: 'Active' });

    // Major downtime and cost for M-1
    await db.downtimeEvents.put({ id: 'DT-M1-1', assetId: 'M-1', detectedAt: '2026-08-01', totalDowntimeMinutes: 500 });
    await db.maintenanceCostLedgers.put({
      id: 'COST-M1-1',
      assetId: 'M-1',
      sectorId: 'SEC-01',
      laborCost: 5000,
      materialCost: 10000,
      externalServiceCost: 0,
      downtimeLossCost: 15000,
      totalCost: 30000,
      currency: 'MAD',
      recordedAt: '2026-08-01'
    });

    // Minor downtime and cost for M-2
    await db.downtimeEvents.put({ id: 'DT-M2-1', assetId: 'M-2', detectedAt: '2026-08-02', totalDowntimeMinutes: 20 });
    await db.maintenanceCostLedgers.put({
      id: 'COST-M2-1',
      assetId: 'M-2',
      sectorId: 'SEC-01',
      laborCost: 200,
      materialCost: 300,
      externalServiceCost: 0,
      downtimeLossCost: 0,
      totalCost: 500,
      currency: 'MAD',
      recordedAt: '2026-08-02'
    });

    const paretoRes = await reliabilityKernelService.generateBadActorPareto('SEC-01', 5);
    expect(paretoRes.ok).toBe(true);

    const ranking = paretoRes.value!;
    expect(ranking.length).toBe(2);
    expect(ranking[0].assetId).toBe('M-1'); // Top bad actor
    expect(ranking[0].totalCost).toBe(30000);
    expect(ranking[0].paretoPercentage).toBeGreaterThan(90);
  });

  it('calculates Risk Priority Number (RPN) in RCM Analysis', async () => {
    const rcmRes = await reliabilityKernelService.createRcmAnalysis({
      id: 'RCM-HYD-01',
      assetId: 'MACH-COMP-01',
      functionDescription: 'Maintain hydraulic pressure at 210 Bar +/- 5 Bar',
      functionalFailure: 'Loss of hydraulic system pressure below 180 Bar',
      failureMode: 'Main pump piston seal rupture',
      failureEffect: 'Immediate mill line emergency trip & loss of production',
      severityScore: 9,   // Critical safety/production impact
      occurrenceScore: 4, // Moderate occurrence
      detectionScore: 3,  // High detection capability via pressure sensor
      rpn: 108,           // 9 * 4 * 3 = 108
      mitigationStrategy: 'PREDICTIVE',
      createdAt: new Date().toISOString()
    });

    expect(rcmRes.ok).toBe(true);
    expect(rcmRes.value?.rpn).toBe(108);

    const savedRcm = await db.rcmAnalyses.get('RCM-HYD-01');
    expect(savedRcm?.mitigationStrategy).toBe('PREDICTIVE');
  });
});
