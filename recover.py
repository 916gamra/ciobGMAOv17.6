with open('src/features/preventive/views/PreventiveRadarView.tsx', 'r') as f:
    content = f.read()

idx = content.find('ct";\nimport { useLiveQuery }')
if idx == -1:
    idx = content.find('ct";import { useLiveQuery }')

if idx != -1:
    recovered = 'import React, { useState, useMemo } from "react";\n' + content[idx + 4:]
    with open('src/features/preventive/views/PreventiveRadarView.tsx', 'w') as f:
        f.write(recovered)
