// src/core/services/AssetDomainService.ts
import { db, Plant, FunctionalLocation, Machine, InstalledComponent, Meter, MeterReading } from '../db';
import { 
  plantSchema, 
  functionalLocationSchema, 
  assetDigitalTwinSchema, 
  installedComponentSchema, 
  meterSchema, 
  meterReadingSchema,
  PlantInput,
  FunctionalLocationInput,
  AssetDigitalTwinInput,
  InstalledComponentInput,
  MeterInput,
  MeterReadingInput
} from '../schemas';
import { BaseService } from './BaseService';
import { Result } from '../error';

export class AssetDomainService extends BaseService {
  // --- 1. Plant Management ---
  async createPlant(input: PlantInput): Promise<Result<Plant>> {
    return this.executeAsync(async () => {
      const validated = plantSchema.parse({ ...input, code: input.code ? input.code.toUpperCase() : '' });
      await db.plants.put({ ...validated });
      return validated;
    }, 'createPlant');
  }

  async getPlants(): Promise<Result<Plant[]>> {
    return this.executeAsync(async () => {
      return await db.plants.toArray();
    }, 'getPlants');
  }

  // --- 2. Functional Locations (Plant -> Sector -> Location Hierarchy) ---
  async createFunctionalLocation(input: FunctionalLocationInput): Promise<Result<FunctionalLocation>> {
    return this.executeAsync(async () => {
      const validated = functionalLocationSchema.parse({ ...input, code: input.code ? input.code.toUpperCase() : '' });
      await db.functionalLocations.put({ ...validated });
      return validated;
    }, 'createFunctionalLocation');
  }

  async getFunctionalLocationsByPlant(plantId: string): Promise<Result<FunctionalLocation[]>> {
    return this.executeAsync(async () => {
      return await db.functionalLocations.where('plantId').equals(plantId).toArray();
    }, 'getFunctionalLocationsByPlant');
  }

  // --- 3. Asset Digital Twin ---
  async registerAssetDigitalTwin(input: AssetDigitalTwinInput): Promise<Result<Machine>> {
    return this.executeAsync(async () => {
      const validated = assetDigitalTwinSchema.parse(input);
      await db.machines.put({ ...validated } as Machine);
      return validated as Machine;
    }, 'registerAssetDigitalTwin');
  }

  async updateAssetLifecycle(
    assetId: string, 
    lifecycleState: Machine['lifecycleState'],
    healthIndex?: number
  ): Promise<Result<Machine>> {
    return this.executeAsync(async () => {
      const asset = await db.machines.get(assetId);
      if (!asset) {
        throw new Error(`Asset not found: ${assetId}`);
      }
      asset.lifecycleState = lifecycleState;
      if (healthIndex !== undefined) {
        asset.healthIndex = Math.max(0, Math.min(100, healthIndex));
      }
      await db.machines.put({ ...asset });
      return asset;
    }, 'updateAssetLifecycle');
  }

  // --- 4. Installed Components (Sub-assemblies) ---
  async installComponent(input: InstalledComponentInput): Promise<Result<InstalledComponent>> {
    return this.executeAsync(async () => {
      const validated = installedComponentSchema.parse(input);
      await db.installedComponents.put({ ...validated });
      return validated;
    }, 'installComponent');
  }

  async getComponentsByAsset(assetId: string): Promise<Result<InstalledComponent[]>> {
    return this.executeAsync(async () => {
      return await db.installedComponents.where('machineId').equals(assetId).toArray();
    }, 'getComponentsByAsset');
  }

  // --- 5. Meters & Readings ---
  async registerMeter(input: MeterInput): Promise<Result<Meter>> {
    return this.executeAsync(async () => {
      const validated = meterSchema.parse(input);
      await db.meters.put({ ...validated });
      return validated;
    }, 'registerMeter');
  }

  async recordMeterReading(input: MeterReadingInput): Promise<Result<MeterReading>> {
    return this.executeAsync(async () => {
      const validated = meterReadingSchema.parse(input);
      
      // Atomic transaction: update meter current reading, evaluate CBM thresholds, and save historical log
      await db.transaction('rw', [db.meters, db.meterReadings, db.machines, db.workRequests], async () => {
        const meter = await db.meters.get(validated.meterId);
        if (meter) {
          meter.currentReading = validated.readingValue;
          meter.lastReadingAt = validated.recordedAt;
          await db.meters.put({ ...meter });

          const machine = await db.machines.get(validated.assetId);
          if (machine) {
            // Sync running hours
            if (meter.meterType === 'RUNNING_HOURS') {
              machine.runningHours = validated.readingValue;
            }

            // CBM Threshold Evaluation
            let anomalyLevel: 'NONE' | 'WARNING' | 'CRITICAL' = 'NONE';
            let anomalyReason = '';

            if (meter.criticalThresholdHigh !== undefined && validated.readingValue >= meter.criticalThresholdHigh) {
              anomalyLevel = 'CRITICAL';
              anomalyReason = `High Critical Threshold Exceeded: ${validated.readingValue} ${meter.unit} >= ${meter.criticalThresholdHigh} ${meter.unit}`;
            } else if (meter.criticalThresholdLow !== undefined && validated.readingValue <= meter.criticalThresholdLow) {
              anomalyLevel = 'CRITICAL';
              anomalyReason = `Low Critical Threshold Exceeded: ${validated.readingValue} ${meter.unit} <= ${meter.criticalThresholdLow} ${meter.unit}`;
            } else if (meter.warningThresholdHigh !== undefined && validated.readingValue >= meter.warningThresholdHigh) {
              anomalyLevel = 'WARNING';
              anomalyReason = `High Warning Threshold Exceeded: ${validated.readingValue} ${meter.unit} >= ${meter.warningThresholdHigh} ${meter.unit}`;
            } else if (meter.warningThresholdLow !== undefined && validated.readingValue <= meter.warningThresholdLow) {
              anomalyLevel = 'WARNING';
              anomalyReason = `Low Warning Threshold Exceeded: ${validated.readingValue} ${meter.unit} <= ${meter.warningThresholdLow} ${meter.unit}`;
            }

            // Process CBM Anomaly Actions
            if (anomalyLevel === 'CRITICAL') {
              machine.healthIndex = Math.max(0, (machine.healthIndex ?? 100) - 25);

              const autoReq = {
                id: `WR-CBM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                requestCode: `WR-CBM-${meter.meterType}`,
                assetId: machine.id,
                sectorId: machine.sectorId || 'SEC-01',
                symptom: `[CBM AUTO-ALERT] ${meter.name} ${anomalyReason}`,
                requestedBy: 'SYSTEM_IOT_CBM',
                priority: 'EMERGENCY' as const,
                status: 'PENDING' as const,
                createdAt: validated.recordedAt
              };
              await db.workRequests.put({ ...autoReq });

            } else if (anomalyLevel === 'WARNING') {
              machine.healthIndex = Math.max(0, (machine.healthIndex ?? 100) - 10);

              const autoReq = {
                id: `WR-CBM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                requestCode: `WR-CBM-${meter.meterType}`,
                assetId: machine.id,
                sectorId: machine.sectorId || 'SEC-01',
                symptom: `[CBM AUTO-WARNING] ${meter.name} ${anomalyReason}`,
                requestedBy: 'SYSTEM_IOT_CBM',
                priority: 'HIGH' as const,
                status: 'PENDING' as const,
                createdAt: validated.recordedAt
              };
              await db.workRequests.put({ ...autoReq });
            }

            await db.machines.put({ ...machine });
          }
        }
        await db.meterReadings.put({ ...validated });
      });

      return validated;
    }, 'recordMeterReading');
  }
}

export const assetDomainService = new AssetDomainService();
