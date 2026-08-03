with open('src/features/organization/components/MachineDigitalIdModal.tsx', 'r') as f:
    content = f.read()

# remove duplicate pdrTemplates
lines = content.split('\n')
seen_pdrTemplates = False
new_lines = []
for line in lines:
    if 'const pdrTemplates = useLiveQuery' in line:
        if seen_pdrTemplates:
            continue
        seen_pdrTemplates = True
    new_lines.append(line)

content = '\n'.join(new_lines)

# update mapping
content = content.replace('Assigned Tasks ({machineTasks.length})', 'Derived Component Tasks ({derivedTasks.length})')
content = content.replace('machineTasks.map(mt =>', 'derivedTasks.map(taskDef =>')
content = content.replace('const taskDef = allTasks.find(t => t.id === mt.taskId);', '')
content = content.replace('mt.id', 'taskDef.id')
content = content.replace('machineTasks.length', 'derivedTasks.length')

with open('src/features/organization/components/MachineDigitalIdModal.tsx', 'w') as f:
    f.write(content)
