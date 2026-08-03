import { useEffect } from 'react';
import { db } from '../db';
import { INITIAL_DATA } from './seedData';
import { toast } from 'sonner';

export function runDatabaseSeed(force = false) {
  return async () => {
    try {
      const pdrFamilyCount = await db.pdrFamilies.count();
      const machineFamilyCount = await db.machineFamilies.count();
      const machineCount = await db.machines.count();

      try {
        // ALWAYS run this cleanup to remove corrupted/old seed V1 items
        const oldBlueprints = await db.machineBlueprints.toArray();
        // The old bad seeded items had -V1, or they were specified manually in the oldSeedIds list.
        const oldSeedIds = [
          'bp-mech-press-standard', 'bp-hyd-press-nc', 'bp-tourne-p-std', 
          'bp-scotcheuse-auto', 'bp-traitement-surf', 'bp-ravivage', 
          'bp-transpalette', 'bp-compresseur', 'bp-pompage', 'bp-elevateur', 
          'bp-transformateur', 'bp-visseuse', 'bp-poinconneuse', 
          'bp-sertissage-bec', 'bp-moteur-meule'
        ];
        const badBlueprints = oldBlueprints.filter(b => b.reference.includes('-V1') || oldSeedIds.includes(b.id));
        if (badBlueprints.length > 0) {
           const badIds = badBlueprints.map(b => b.id);
           await db.machineBlueprints.bulkDelete(badIds);
           console.log('[DatabaseSeeder] DELETED OLD BAD BLUEPRINTS:', badIds);
        }

        const oldMachines = await db.machines.toArray();
        const badMachines = oldMachines.filter(m => m.id.startsWith('mach-') && m.referenceCode.includes('20'));
        if (badMachines.length > 0) {
           const badIds = badMachines.map(m => m.id);
           await db.machines.bulkDelete(badIds);
           console.log('[DatabaseSeeder] DELETED OLD BAD MACHINES:', badIds);
        }

        // Cleanup old bad families
        await db.machineFamilies.bulkDelete(['fam-repoussage', 'fam-tournage', 'fam-trp']);

        const oldPdrBlueprints = await db.pdrBlueprints.toArray();
        const badPdrBlueprints = oldPdrBlueprints.filter(b => b.reference && b.reference.includes('-V1'));
        if (badPdrBlueprints.length > 0) {
           const badIds = badPdrBlueprints.map(b => b.id);
           await db.pdrBlueprints.bulkDelete(badIds);
           console.log('[DatabaseSeeder] DELETED OLD BAD PDR BLUEPRINTS:', badIds);
        }
      } catch (err) {
        console.error('Cleanup error:', err);
      }

       // Always force injection if force is true.
      if (force || machineCount === 0 || machineFamilyCount === 0 || pdrFamilyCount === 0) {
        console.log('[DatabaseSeeder] Enforcing master data synchronization...');
        
        await db.transaction('rw', [
          db.pdrFamilies, db.pdrTemplates, db.pdrBlueprints, 
          db.machineFamilies, db.machineTemplates, db.machineBlueprints,
          db.sectors, db.machines, db.standardActions, db.standardComponents,
          db.blueprintTasks, db.machineTasks, db.preventiveTasks
        ], async () => {
          // Inject/Update Master Data (Using bulkPut for idempotent sync)
          await db.pdrFamilies.bulkPut(INITIAL_DATA.pdrFamilies);
          await db.machineFamilies.bulkPut(INITIAL_DATA.machineFamilies);
          await db.machineTemplates.bulkPut(INITIAL_DATA.machineTemplates);
          await db.sectors.bulkPut(INITIAL_DATA.sectors);
          
          if (machineCount === 0) {
            await db.machines.bulkPut(INITIAL_DATA.machines);
          }
          await db.pdrTemplates.bulkPut(INITIAL_DATA.pdrTemplates);
          await db.pdrBlueprints.bulkPut(INITIAL_DATA.pdrBlueprints);

          if (INITIAL_DATA.machineBlueprints && INITIAL_DATA.machineBlueprints.length > 0) {
            await db.machineBlueprints.bulkPut(INITIAL_DATA.machineBlueprints);
          }

          // Seed default Actions Catalog if empty
          const actionCount = await db.standardActions.count();
          if (actionCount === 0) {
            const defaultActions = [
              { id: 'act-ctrl', name: 'Control / Inspection', code: 'CTRL', type: 'PREV', description: 'Scheduled visual and physical operational status sweep', createdAt: new Date().toISOString() },
              { id: 'act-clean', name: 'Cleaning / Nettoyage', code: 'CLN', type: 'PREV', description: 'Removal of grease, dust, and industrial blockages', createdAt: new Date().toISOString() },
              { id: 'act-lub', name: 'Lubrication / Lubrification', code: 'LUB', type: 'PREV', description: 'Ensuring fluid efficiency across moving metallic interfaces', createdAt: new Date().toISOString() },
              { id: 'act-prev-rep', name: 'Preventive Replacement', code: 'PREP', type: 'PREV', description: 'Model-scheduled swap-out of expiring elements', createdAt: new Date().toISOString() },
              { id: 'act-repair', name: 'Repair / Réparation', code: 'REP', type: 'CORR', description: 'Restoration of defective component to optimal operational baseline', createdAt: new Date().toISOString() },
              { id: 'act-emerg-rep', name: 'Emergency Replacement', code: 'EREP', type: 'CORR', description: 'Immediate reactive swap-out of fully ruptured organs', createdAt: new Date().toISOString() },
              { id: 'act-trouble', name: 'Troubleshooting / Diagnostic', code: 'DIAG', type: 'CORR', description: 'Technical analysis and sequence diagnostics on mechanical faults', createdAt: new Date().toISOString() },
              { id: 'act-adjust', name: 'Adjustment / Réglage', code: 'ADJ', type: 'BOTH', description: 'Fine-tuning of physical positioning, voltage thresholds, or hydraulic flow', createdAt: new Date().toISOString() },
              { id: 'act-montage', name: 'Montage / Installation', code: 'INST', type: 'BOTH', description: 'Initial or complete structural installation of components on machines', createdAt: new Date().toISOString() }
            ];
            await db.standardActions.bulkPut(defaultActions as any);
          }

          // WIPE OUT OLD MECHANISMS & ASSOCIATED PREVENTIVE DATA AS REQUESTED BY THE USER
          await db.standardComponents.clear();
          await db.blueprintTasks.clear();
          await db.machineTasks.clear();
        });

        console.log('[DatabaseSeeder] Master data successfully synchronized.');
      }

      // Decouple all existing machines from blueprints to fulfill user request
      try {
        const machines = await db.machines.toArray();
        const blueprints = await db.machineBlueprints.toArray();
        const blueprintMap = new Map(blueprints.map(b => [b.id, b.templateId]));
        
        let decoupledCount = 0;
        for (const machine of machines) {
          if (machine.blueprintId) {
            const templateId = machine.templateId || blueprintMap.get(machine.blueprintId);
            await db.machines.update(machine.id, {
              blueprintId: undefined,
              ...(templateId ? { templateId } : {})
            });
            decoupledCount++;
          }
        }
        if (decoupledCount > 0) {
          console.log(`[DatabaseSeeder] Decoupled ${decoupledCount} machines from blueprints on startup.`);
        }
      } catch (decoupleErr) {
        console.error('[DatabaseSeeder] Failed to decouple machines on startup:', decoupleErr);
      }

    } catch (error) {
      console.error('Failed to inject master data into Dexie', error);
      toast.error("Initialization Error", {
        description: "Failed to load master data.",
      });
    }
  };
}

// Hook alternative
export function useDatabaseSeeder() {
  useEffect(() => {
    runDatabaseSeed()();
  }, []);
}
