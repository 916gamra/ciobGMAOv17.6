import { db } from '@/core/db';

export function usePreventiveEngine() {
  
  const linkTaskToBlueprint = async (machineBlueprintId: string, taskId: string) => {
    const existing = await db.blueprintTasks.where({ machineBlueprintId, taskId }).first();
    if (existing) return;
    
    await db.transaction('rw', db.blueprintTasks, db.machineTasks, db.machines, async () => {
      // 1. Link to Blueprint
      await db.blueprintTasks.add({
        id: crypto.randomUUID(),
        machineBlueprintId,
        taskId,
        isEnabled: true,
        addedAt: new Date().toISOString()
      });

      // 2. Cascade down to all Machine Instances of this Blueprint
      const machines = await db.machines.where('blueprintId').equals(machineBlueprintId).toArray();
      const machineTaskPayloads = machines.map(m => ({
        id: crypto.randomUUID(),
        machineId: m.id,
        taskId,
        isInherited: true,
        isEnabled: true,
        addedAt: new Date().toISOString()
      }));

      if (machineTaskPayloads.length > 0) {
        await db.machineTasks.bulkAdd(machineTaskPayloads);
      }
    });
  };

  const unlinkTaskFromBlueprint = async (machineBlueprintId: string, taskId: string) => {
    await db.transaction('rw', db.blueprintTasks, db.machineTasks, db.machines, async () => {
      // 1. Remove from Blueprint
      const bt = await db.blueprintTasks.where({ machineBlueprintId, taskId }).first();
      if (bt) await db.blueprintTasks.delete(bt.id);

      // 2. Remove inherited tasks from child instances
      const machines = await db.machines.where('blueprintId').equals(machineBlueprintId).toArray();
      for (const m of machines) {
        const mt = await db.machineTasks.where({ machineId: m.id, taskId }).first();
        // Only remove if it was inherited
        if (mt && mt.isInherited) {
          await db.machineTasks.delete(mt.id);
        }
      }
    });
  };

  const toggleMachineTask = async (machineTaskId: string, isEnabled: boolean) => {
    await db.machineTasks.update(machineTaskId, { isEnabled });
  };

  const addCustomMachineTask = async (machineId: string, taskId: string) => {
    const existing = await db.machineTasks.where({ machineId, taskId }).first();
    if (existing) return;
    
    await db.machineTasks.add({
      id: crypto.randomUUID(),
      machineId,
      taskId,
      isInherited: false,
      isEnabled: true,
      addedAt: new Date().toISOString()
    });
  };

  return {
    linkTaskToBlueprint,
    unlinkTaskFromBlueprint,
    toggleMachineTask,
    addCustomMachineTask
  };
}
