import { db } from '@/core/db';

export interface PerfBenchmarkResult {
  totalMachines: number;
  totalBlueprints: number;
  totalStockItems: number;
  totalAuditLogs: number;
  readAllMachinesMs: number;
  readAllBlueprintsMs: number;
  readAuditLogsMs: number;
  filteredStockQueryMs: number;
  overallPassSla: boolean; // < 1000ms target
}

export class PerformanceBenchmark {
  private results = new Map<string, number[]>();

  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    iterations = 5
  ): Promise<{ avg: number; min: number; max: number; results: number[] }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    this.results.set(name, times);

    return { avg, min, max, results: times };
  }

  report(): void {
    const tableData = Array.from(this.results.entries()).map(([name, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        Operation: name,
        'Avg (ms)': avg.toFixed(2),
        'Min (ms)': Math.min(...times).toFixed(2),
        'Max (ms)': Math.max(...times).toFixed(2),
        'SLA Pass (<1000ms)': times.every(t => t < 1000) ? '✅ PASS' : '❌ FAIL'
      };
    });
    console.table(tableData);
  }
}

export async function runOfflinePerformanceBenchmark(): Promise<PerfBenchmarkResult> {
  const bench = new PerformanceBenchmark();

  let totalMachines = 0;
  let totalBlueprints = 0;
  let totalAuditLogs = 0;
  let totalStockItems = 0;

  const mRes = await bench.measure('Read All Machines', async () => {
    const res = await db.machines.toArray();
    totalMachines = res.length;
  });

  const bRes = await bench.measure('Read All Blueprints', async () => {
    const res = await db.pdrBlueprints.toArray();
    totalBlueprints = res.length;
  });

  const aRes = await bench.measure('Query Audit Logs', async () => {
    const res = await db.auditLogs.reverse().sortBy('timestamp');
    totalAuditLogs = res.length;
  });

  const sRes = await bench.measure('Read Stock Items', async () => {
    const res = await db.inventory.toArray();
    totalStockItems = res.length;
  });

  bench.report();

  const totalTimeMs = mRes.avg + bRes.avg + aRes.avg + sRes.avg;

  return {
    totalMachines,
    totalBlueprints,
    totalStockItems,
    totalAuditLogs,
    readAllMachinesMs: Math.round(mRes.avg * 100) / 100,
    readAllBlueprintsMs: Math.round(bRes.avg * 100) / 100,
    readAuditLogsMs: Math.round(aRes.avg * 100) / 100,
    filteredStockQueryMs: Math.round(sRes.avg * 100) / 100,
    overallPassSla: totalTimeMs < 1000
  };
}
