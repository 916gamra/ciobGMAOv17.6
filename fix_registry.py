with open('src/features/preventive/views/MachineRegistryView.tsx', 'r') as f:
    content = f.read()

replacement = """
  const preventiveTasks = useLiveQuery(() => db.preventiveTasks.toArray(), []);
  const pdrBlueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []);
  const partMappings = useLiveQuery(() => db.machinePartMappings.toArray(), []);
  const pdrTemplates = useLiveQuery(() => db.pdrTemplates.toArray(), []);

  const getMachineData = () => {
    if (!machines || !blueprints || !preventiveTasks || !pdrBlueprints || !partMappings || !pdrTemplates) return [];
    return machines.map(m => {
      const blueprint = blueprints.find(b => b.id === m.blueprintId);
      
      const mBlueprintIds = partMappings.filter(pm => pm.machineId === m.id).map(pm => pm.blueprintId);
      const mPartTemplates = pdrBlueprints.filter(bp => mBlueprintIds.includes(bp.id)).map(bp => bp.templateId);
      const mPartFamilies = [...new Set(pdrTemplates.filter(t => mPartTemplates.includes(t.id)).map(t => t.familyId))];
      
      const mTasks = preventiveTasks.filter(task => {
        if (task.pdrTemplateId) return mPartTemplates.includes(task.pdrTemplateId);
        if (task.pdrFamilyId) return mPartFamilies.includes(task.pdrFamilyId);
        return false;
      });
      const inheritedTasksCount = mTasks.length;
"""

idx = content.find('  const machineTasks = useLiveQuery(() => db.machineTasks.toArray(), []);\n  const getMachineData = () => {\n    if (!machines || !blueprints || !machineTasks) return [];\n    return machines.map(m => {\n      const blueprint = blueprints.find(b => b.id === m.blueprintId);\n      const inheritedTasksCount = machineTasks.filter(mt => mt.machineId === m.id && mt.isInherited).length;')
if idx != -1:
    end_idx = idx + len('  const machineTasks = useLiveQuery(() => db.machineTasks.toArray(), []);\n  const getMachineData = () => {\n    if (!machines || !blueprints || !machineTasks) return [];\n    return machines.map(m => {\n      const blueprint = blueprints.find(b => b.id === m.blueprintId);\n      const inheritedTasksCount = machineTasks.filter(mt => mt.machineId === m.id && mt.isInherited).length;')
    content = content[:idx] + replacement + content[end_idx:]

with open('src/features/preventive/views/MachineRegistryView.tsx', 'w') as f:
    f.write(content)
