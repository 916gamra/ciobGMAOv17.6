const fs = require('fs');
let content = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');

// The user wants the engine color (indigo) to be used ONLY for small icons and active badges.
// The user wants neutral colors for active row selection and main card backgrounds.

// Fix Active Tabs to have an indigo bottom border or text for the engine signature
content = content.replace(/selectedPane === 'hierarchy'\s*\?\s*"bg-white text-slate-900 shadow-md"\s*:\s*"text-slate-400 hover:text-white"/g, 
  'selectedPane === \'hierarchy\' ? "bg-white/[0.08] text-white shadow-md border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"');
  
content = content.replace(/selectedPane === 'actions'\s*\?\s*"bg-white text-slate-900 shadow-md"\s*:\s*"text-slate-400 hover:text-white"/g, 
  'selectedPane === \'actions\' ? "bg-white/[0.08] text-white shadow-md border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"');

// Fix KPI Card icons back to indigo (they were mistakenly replaced with white/10)
// Find <Layers className="w-3.5 h-3.5" /> etc. 
// Wait, they are passed as `icon={<Component className="w-3.5 h-3.5" />}` to HeaderBentoCard which handles the color internally.
// HeaderBentoCard has `color="indigo"` prop, but earlier I saw `color="purple"`.
content = content.replace(/color="purple"/g, 'color="indigo"');
content = content.replace(/color="cyan"/g, 'color="indigo"');

// The active sidebar items MUST be neutral: bg-white/[0.08] border-white/20 (Already done by my sed)
// Let's make sure the background of the main container is Neutral Dark Glass: bg-slate-900/60 backdrop-blur-xl border-white/10
// Already done.

// Let's make sure all tables have the correct class.
content = content.replace(/bg-white\/\[0\.04\] border-b border-white\/10/g, 'bg-white/[0.04] border-b border-white/10'); // No-op, just checking it exists

// Make sure the tree icons have indigo backgrounds: 
// The folder/template icons in the tree:
content = content.replace(/bg-white\/10 border-white\/15 text-slate-300/g, 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400');
content = content.replace(/bg-white\/5 border-white\/10 text-slate-400/g, 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400');

fs.writeFileSync('src/features/organization/views/EngineeringLabView.tsx', content);
