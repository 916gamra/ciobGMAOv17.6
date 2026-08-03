import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { useAuthSlots } from '@/features/auth/hooks/useAuthSlots';

export function useAnalyticsEngine() {
  const allSlots = useAuthSlots();
  const technicians = allSlots.filter(s => s.id.startsWith('TC'));
  
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const machines = useLiveQuery(() => db.machines.toArray(), []);
  const requisitions = useLiveQuery(() => db.partRequisitions.toArray(), []);
  const reqLines = useLiveQuery(() => db.partRequisitionLines.toArray(), []);
  const blueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);

  const isLoading = 
    inventory === undefined || 
    machines === undefined || 
    requisitions === undefined || 
    reqLines === undefined ||
    blueprints === undefined;

  // 1. KPIs
  const kpis = useMemo(() => {
    if (isLoading) return { totalStockVolume: 0, distinctParts: 0, totalReqsThisMonth: 0 };
    
    const totalStockVolume = inventory.reduce((sum, item) => sum + item.quantityCurrent, 0);
    const distinctParts = inventory.length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const totalReqsThisMonth = requisitions.filter(r => {
      const d = new Date(r.requestDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    return { totalStockVolume, distinctParts, totalReqsThisMonth };
  }, [inventory, requisitions, isLoading]);

  // 2. Top Consuming Machines
  const topMachines = useMemo(() => {
    if (isLoading) return [];
    
    const reqMap = new Map(); // reqId -> machineId
    requisitions.forEach(r => reqMap.set(r.id, r.machineId));

    const machineConsumption = new Map<string, number>(); // machineId -> total quantity

    reqLines.forEach(line => {
      const machineId = reqMap.get(line.requisitionId);
      if (machineId) {
        machineConsumption.set(machineId, (machineConsumption.get(machineId) || 0) + line.quantity);
      }
    });

    return Array.from(machineConsumption.entries())
      .map(([machineId, quantity]) => {
        const machine = machines.find(m => m.id === machineId);
        return {
          name: machine ? machine.referenceCode : 'Unknown',
          code: machine ? machine.referenceCode : 'N/A',
          quantity
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5
  }, [requisitions, reqLines, machines, isLoading]);

  // 3. Activity by Technician
  const techActivity = useMemo(() => {
    if (isLoading) return [];

    const activity = new Map<string, number>();
    requisitions.forEach(r => {
      activity.set(r.technicianId, (activity.get(r.technicianId) || 0) + 1);
    });

    return Array.from(activity.entries())
      .map(([techId, count]) => {
        const tech = technicians.find(t => t.id === techId);
        return {
          name: tech ? tech.name : 'Unknown',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 Handlers
  }, [requisitions, technicians, isLoading]);

  // 4. Stock Health
  const stockHealth = useMemo(() => {
    if (isLoading) return [];
    
    let healthy = 0;
    let low = 0;
    let out = 0;

    const bpMap = new Map();
    blueprints.forEach(bp => bpMap.set(bp.id, bp.minThreshold));

    inventory.forEach(item => {
      const threshold = bpMap.get(item.blueprintId) || 5; // fallback
      if (item.quantityCurrent === 0) {
        out++;
      } else if (item.quantityCurrent <= threshold) {
        low++;
      } else {
        healthy++;
      }
    });

    return [
      { name: 'Healthy Options', value: healthy, color: '#34D399' },
      { name: 'Low Stock', value: low, color: '#FBBF24' },
      { name: 'Out of Stock', value: out, color: '#F87171' }
    ];
  }, [inventory, blueprints, isLoading]);

  return {
    kpis,
    topMachines,
    techActivity,
    stockHealth,
    isLoading
  };
}
