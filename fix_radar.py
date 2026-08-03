with open('src/features/preventive/views/PreventiveRadarView.tsx', 'r') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'compObj?.linkedPartTemplateIds && compObj.linkedPartTemplateIds.length > 0' in lines[i]:
        lines[i] = lines[i].replace('compObj?.linkedPartTemplateIds && compObj.linkedPartTemplateIds.length > 0', 'compObj')
    elif 'const relevantBps = pdrBlueprints.filter(bp => compObj.linkedPartTemplateIds?.includes(bp.templateId));' in lines[i]:
        lines[i] = lines[i].replace('compObj.linkedPartTemplateIds?.includes(bp.templateId)', 'bp.templateId === compObj.id')

with open('src/features/preventive/views/PreventiveRadarView.tsx', 'w') as f:
    f.writelines(lines)
