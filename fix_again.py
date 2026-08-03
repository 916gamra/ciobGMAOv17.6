with open('src/features/preventive/views/PreventiveRadarView.tsx', 'r') as f:
    content = f.read()

idx = content.find('import { useLiveQuery } from "dexie-react-hooks";')
if idx != -1:
    recovered = 'import React, { useState, useMemo } from "react";\n' + content[idx:]
    with open('src/features/preventive/views/PreventiveRadarView.tsx', 'w') as f:
        f.write(recovered)
