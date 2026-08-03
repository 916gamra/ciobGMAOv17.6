with open('src/core/db/sandboxSeed.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'db.standardComponents.bulkAdd' in line:
        new_lines.append('// ' + line)
    else:
        new_lines.append(line)

with open('src/core/db/sandboxSeed.ts', 'w') as f:
    f.writelines(new_lines)
