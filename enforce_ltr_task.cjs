const fs = require('fs');
let file = fs.readFileSync('src/features/preventive/views/TaskCatalogView.tsx', 'utf8');

file = file.replace(
  /<div className="flex flex-col h-full bg-\[#0a0a0f\] text-slate-200 custom-scrollbar overflow-y-auto">/g,
  '<div className="flex flex-col h-full bg-[#0a0a0f] text-slate-200 custom-scrollbar overflow-y-auto" dir="ltr">'
);
file = file.replace(/flex-row-reverse/g, 'flex-row');

fs.writeFileSync('src/features/preventive/views/TaskCatalogView.tsx', file);
