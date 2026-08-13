const fs = require('fs');
let file = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');

// 1. Add dir="ltr" to root
file = file.replace(
  /<div className="flex flex-col h-full bg-\[#0a0a0f\] text-slate-200 custom-scrollbar overflow-y-auto">/g,
  '<div className="flex flex-col h-full bg-[#0a0a0f] text-slate-200 custom-scrollbar overflow-y-auto" dir="ltr">'
);

// 2. Change flex-row-reverse back to flex-row for the split pane so that in LTR it flows naturally 1st child Left, 2nd child Right
file = file.replace(
  /<div className="flex flex-col lg:flex-row-reverse flex-1 min-h-0 gap-6">/g,
  '<div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-6">'
);

// 3. Ensure any inner flex-row-reverse is just flex-row (I did this earlier but just in case)
file = file.replace(/flex-row-reverse/g, 'flex-row');

// 4. Change Right Sidebar comment to Left Sidebar since it will be on the left now
file = file.replace(/Right Sidebar/g, 'Left Sidebar');
file = file.replace(/Left Main Workspace/g, 'Right Main Workspace');

fs.writeFileSync('src/features/organization/views/EngineeringLabView.tsx', file);
