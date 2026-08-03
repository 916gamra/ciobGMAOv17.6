with open('src/features/preventive/views/PreventiveRadarView.tsx', 'r') as f:
    lines = f.readlines()

new_content = 'import React, { useState, useMemo } from "react";\n'

for i, line in enumerate(lines):
    if i >= 156:
        new_content += line

with open('src/features/preventive/views/PreventiveRadarView.tsx', 'w') as f:
    f.write(new_content)
