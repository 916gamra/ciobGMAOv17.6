import re

with open('src/features/preventive/views/PreventiveRadarView.tsx', 'r') as f:
    content = f.read()

replacement = """
        const mBlueprintIds = partMappings.filter(pm => pm.machineId === m.id).map(pm => pm.blueprintId);
        const mPartTemplates = pdrBlueprints.filter(bp => mBlueprintIds.includes(bp.id)).map(bp => bp.templateId);
        const mPartFamilies = [...new Set(pdrTemplates.filter(t => mPartTemplates.includes(t.id)).map(t => t.familyId))];
        const mTasks = preventiveTasks.filter(task => {
          if (task.pdrTemplateId) return mPartTemplates.includes(task.pdrTemplateId);
          if (task.pdrFamilyId) return mPartFamilies.includes(task.pdrFamilyId);
          return false;
        });
"""

idx = content.find('const mTasks = machineTasks.filter(')
if idx != -1:
    end_idx = content.find(');', idx)
    end_idx += 2
    content = content[:idx] + replacement + content[end_idx:]

content = content.replace('    machineTasks,\n', '')

with open('src/features/preventive/views/PreventiveRadarView.tsx', 'w') as f:
    f.write(content)
