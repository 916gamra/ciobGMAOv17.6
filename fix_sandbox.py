import re

with open('src/core/db/sandboxSeed.ts', 'r') as f:
    lines = f.readlines()

for i in range(len(lines)):
    line = lines[i]
    if 'db.pdrTemplates.clear()' in line:
        lines[i] = line.replace('db.pdrTemplates.clear()', 'db.standardComponents.clear()')
    if 'db.preventiveTasks.clear()' in line:
        lines[i] = line.replace('db.preventiveTasks.clear()', 'db.standardActions.clear()')

with open('src/core/db/sandboxSeed.ts', 'w') as f:
    f.writelines(lines)
