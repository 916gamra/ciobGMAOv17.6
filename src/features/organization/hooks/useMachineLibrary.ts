import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';

export function useMachineLibrary() {
  const blueprints = useLiveQuery(() => db.machineBlueprints.toArray(), []);
  const families = useLiveQuery(() => db.machineFamilies.toArray(), []);
  const templates = useLiveQuery(() => db.machineTemplates.toArray(), []);

  const isLoading = blueprints === undefined || families === undefined || templates === undefined;

  const templateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (templates) {
      templates.forEach(t => {
        counts.set(t.familyId, (counts.get(t.familyId) || 0) + 1);
      });
    }
    return counts;
  }, [templates]);

  const blueprintCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (blueprints) {
      blueprints.forEach(b => {
        counts.set(b.templateId, (counts.get(b.templateId) || 0) + 1);
      });
    }
    return counts;
  }, [blueprints]);

  return {
    families: families || [],
    templates: templates || [],
    blueprints: blueprints || [],
    templateCounts,
    blueprintCounts,
    isLoading,
  };
}
