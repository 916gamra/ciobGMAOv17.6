with open('src/features/preventive/views/TaskCatalogView.tsx', 'r') as f:
    content = f.read()

idx = content.find('حفظ المهمة')
if idx != -1:
    end_idx = content.find('</AnimatePresence>', idx)
    if end_idx != -1:
        valid_part = content[:end_idx + 18] + '\n    </div>\n  );\n}\n'
        with open('src/features/preventive/views/TaskCatalogView.tsx', 'w') as f:
            f.write(valid_part)
