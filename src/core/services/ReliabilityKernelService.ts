import { db, MaintenanceCostLedger, RcmAnalysis } from '../db';
import { 
  maintenanceCostLedgerSchema, 
  MaintenanceCostLedgerInput, 
  rcmAnalysisSchema, 
  RcmAnalysisInput 
} from '../schemas';
import { BaseService, Result } from './BaseService';

export interface RamsMetrics {
  assetId: string;
  mtbfHours: number;
  mttrHours: number;
  availabilityPercentage: number;
  reliabilityPercentage: number;
  failureCount: number;
  totalDowntimeHours: number;
}

export interface OeeMetrics {
  availabilityRate: number;
  performanceRate: number;
  qualityRate: number;
  oeePercentage: number;
}

export interface BadActorSummary {
  assetId: string;
  referenceCode: string;
  failureCount: number;
  totalDowntimeMinutes: number;
  totalCost: number;
  paretoPercentage: number;
}

export class ReliabilityKernelService extends BaseService {
  /**
   * Calculate RAMS (Reliability, Availability, Maintainability, Safety) metrics
   */
  async calculateAssetRamsMetrics(assetId: string, periodDays: number = 30): Promise<Result<RamsMetrics>> {
    return this.executeAsync(async () => {
      const machine = await db.machines.get(assetId);
      const totalPeriodHours = periodDays * 24;

      const downtimeEvents = await db.downtimeEvents.where('assetId').equals(assetId).toArray();
      const failureTaxonomies = await db.failureTaxonomyRecords.where('assetId').equals(assetId).toArray();

      const failureCount = Math.max(downtimeEvents.length, failureTaxonomies.length);

      let totalDowntimeMinutes = 0;
      let totalTrueRepairMinutes = 0;

      for (const event of downtimeEvents) {
        totalDowntimeMinutes += (event.totalDowntimeMinutes || 0);
        totalTrueRepairMinutes += (event.trueRepairMinutes || 0);
      }

      const totalDowntimeHours = totalDowntimeMinutes / 60;
      const operatingHours = Math.max(1, totalPeriodHours - totalDowntimeHours);

      const mtbfHours = failureCount > 0 
        ? Math.round((operatingHours / failureCount) * 10) / 10 
        : totalPeriodHours;

      const mttrHours = failureCount > 0 
        ? Math.round(((totalTrueRepairMinutes / failureCount) / 60) * 10) / 10 
        : 0;

      const availabilityPercentage = Math.round((operatingHours / totalPeriodHours) * 1000) / 10;

      // Exponential reliability formula R(t=24h) = e^(-24 / MTBF)
      const reliabilityPercentage = failureCount === 0 
        ? 100 
        : Math.round(Math.exp(-24 / Math.max(mtbfHours, 1)) * 100);

      return {
        assetId,
        mtbfHours,
        mttrHours,
        availabilityPercentage: Math.min(100, availabilityPercentage),
        reliabilityPercentage: Math.min(100, reliabilityPercentage),
        failureCount,
        totalDowntimeHours: Math.round(totalDowntimeHours * 10) / 10
      };
    }, 'calculateAssetRamsMetrics');
  }

  /**
   * Calculate Overall Equipment Effectiveness (OEE)
   */
  async calculateOeeMetrics(
    assetId: string, 
    plannedHours: number, 
    idealCycleTimeSec: number, 
    totalUnits: number, 
    goodUnits: number
  ): Promise<Result<OeeMetrics>> {
    return this.executeAsync(async () => {
      const downtimeEvents = await db.downtimeEvents.where('assetId').equals(assetId).toArray();
      let totalDowntimeMinutes = 0;
      for (const ev of downtimeEvents) {
        totalDowntimeMinutes += (ev.totalDowntimeMinutes || 0);
      }

      const totalDowntimeHours = totalDowntimeMinutes / 60;
      const actualOperatingHours = Math.max(0.1, plannedHours - totalDowntimeHours);

      // 1. Availability Rate (%)
      const availabilityRate = Math.min(100, Math.round((actualOperatingHours / plannedHours) * 1000) / 10);

      // 2. Performance Rate (%)
      const idealOperatingTimeSec = totalUnits * idealCycleTimeSec;
      const actualOperatingTimeSec = actualOperatingHours * 3600;
      const performanceRate = Math.min(100, Math.round((idealOperatingTimeSec / actualOperatingTimeSec) * 1000) / 10);

      // 3. Quality Rate (%)
      const qualityRate = totalUnits > 0 ? Math.round((goodUnits / totalUnits) * 1000) / 10 : 100;

      // Overall OEE
      const oeePercentage = Math.round(((availabilityRate / 100) * (performanceRate / 100) * (qualityRate / 100)) * 100);

      return {
        availabilityRate,
        performanceRate,
        qualityRate,
        oeePercentage
      };
    }, 'calculateOeeMetrics');
  }

  /**
   * Generate Bad-Actor Pareto Ranking analysis
   */
  async generateBadActorPareto(sectorId?: string, limit: number = 10): Promise<Result<BadActorSummary[]>> {
    return this.executeAsync(async () => {
      let machines = await db.machines.toArray();
      if (sectorId) {
        machines = machines.filter(m => m.sectorId === sectorId);
      }

      const summaries: BadActorSummary[] = [];

      for (const m of machines) {
        const downtimeEvents = await db.downtimeEvents.where('assetId').equals(m.id).toArray();
        const costEntries = await db.maintenanceCostLedgers.where('assetId').equals(m.id).toArray();

        let totalDowntime = 0;
        for (const ev of downtimeEvents) {
          totalDowntime += (ev.totalDowntimeMinutes || 0);
        }

        let totalCost = 0;
        for (const c of costEntries) {
          totalCost += c.totalCost;
        }

        summaries.push({
          assetId: m.id,
          referenceCode: m.referenceCode || m.id,
          failureCount: downtimeEvents.length,
          totalDowntimeMinutes: totalDowntime,
          totalCost,
          paretoPercentage: 0
        });
      }

      // Sort descending by total downtime + cost weighting
      summaries.sort((a, b) => (b.totalDowntimeMinutes + b.totalCost) - (a.totalDowntimeMinutes + a.totalCost));

      const grandTotalImpact = summaries.reduce((acc, curr) => acc + curr.totalDowntimeMinutes + curr.totalCost, 0);

      let runningCumulative = 0;
      for (const s of summaries) {
        const impact = s.totalDowntimeMinutes + s.totalCost;
        runningCumulative += impact;
        s.paretoPercentage = grandTotalImpact > 0 ? Math.round((runningCumulative / grandTotalImpact) * 100) : 0;
      }

      return summaries.slice(0, limit);
    }, 'generateBadActorPareto');
  }

  /**
   * Record Maintenance Financial Cost
   */
  async recordMaintenanceCost(input: MaintenanceCostLedgerInput): Promise<Result<MaintenanceCostLedger>> {
    return this.executeAsync(async () => {
      const validated = maintenanceCostLedgerSchema.parse(input);
      await db.maintenanceCostLedgers.put(validated);
      return validated;
    }, 'recordMaintenanceCost');
  }

  /**
   * Create RCM (Reliability Centered Maintenance) Risk Analysis
   */
  async createRcmAnalysis(input: RcmAnalysisInput): Promise<Result<RcmAnalysis>> {
    return this.executeAsync(async () => {
      const validated = rcmAnalysisSchema.parse(input);
      const computedRpn = validated.severityScore * validated.occurrenceScore * validated.detectionScore;
      const record: RcmAnalysis = {
        ...validated,
        rpn: computedRpn
      };
      await db.rcmAnalyses.put(record);
      return record;
    }, 'createRcmAnalysis');
  }
}

export const reliabilityKernelService = new ReliabilityKernelService();
