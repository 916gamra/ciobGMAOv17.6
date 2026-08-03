with open('src/features/preventive/views/PreventiveRadarView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i == 155 and 'ct";' in line:
        # line 155 (1-based 156)
        # we know we need to just delete from 156 onwards because the file was duplicated!
        # Wait, if we delete from 156 onwards, we lose the REST of the component!
        pass
