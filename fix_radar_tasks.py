import re

with open('src/features/preventive/views/PreventiveRadarView.tsx', 'r') as f:
    content = f.read()

# Replace machineTasks state
content = content.replace('const machineTasks = useLiveQuery(() => db.machineTasks.toArray(), []) || [];', '')

# Modify the logic inside derived data loop
replacement = """
        // Resolve tasks derived from parts
        const mBlueprintIds = partMappings.filter(pm => pm.machineId === m.id).map(pm => pm.blueprintId);
        const mPartTemplates = pdrBlueprints.filter(bp => mBlueprintIds.includes(bp.id)).map(bp => bp.templateId);
        const mPartFamilies = [...new Set(pdrTemplates.filter(t => mPartTemplates.includes(t.id)).map(t => t.familyId))];
        
        const mTasks = preventiveTasks.filter(task => {
          if (task.pdrTemplateId) return mPartTemplates.includes(task.pdrTemplateId);
          if (task.pdrFamilyId) return mPartFamilies.includes(task.pdrFamilyId);
          return false;
        });
        const taskIds = mTasks.map(t => t.id);
"""

# find where mTasks is defined
idx = content.find('const mTasks = machineTasks.filter(')
if idx != -1:
    end_idx = content.find('const taskIds = mTasks.map((mt) => mt.taskId);', idx)
    end_idx += len('const taskIds = mTasks.map((mt) => mt.taskId);')
    content = content[:idx] + replacement + content[end_idx:]

with open('src/features/preventive/views/PreventiveRadarView.tsx', 'w') as f:
    f.write(content)
