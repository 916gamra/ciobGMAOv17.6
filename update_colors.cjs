const fs = require('fs');
const files = [
  'src/features/organization/views/EngineeringLabView.tsx',
  'src/features/organization/views/PartsCatalogLabView.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace active selection cards
  content = content.replace(/"bg-white\/10 border-white\/30 text-white font-extrabold shadow-md"/g, 
    '"bg-white/[0.08] border-white/20 text-white font-extrabold shadow-md relative overflow-hidden before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-white"');
  content = content.replace(/"bg-white\/10 border-white\/30 text-white font-extrabold shadow-sm"/g, 
    '"bg-white/[0.08] border-white/20 text-white font-extrabold shadow-md relative overflow-hidden before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-white"');

  // Replace flash indigo/cyan with neutral glass for badges
  content = content.replace(/bg-indigo-500\/15 text-indigo-400 font-bold px-1\.5 py-0\.5 rounded border border-indigo-500\/20/g, 
    'bg-white/10 text-white border-white/15 px-1.5 py-0.5 rounded border');
  
  content = content.replace(/bg-cyan-500\/10 px-1 py-0\.5 rounded border border-cyan-500\/20/g, 
    'bg-white/10 px-1 py-0.5 rounded border border-white/15');

  content = content.replace(/bg-cyan-500\/10 text-cyan-400 border border-cyan-500\/20/g,
    'bg-white/10 text-white border border-white/15');
    
  content = content.replace(/bg-indigo-500\/10 text-indigo-400 border border-indigo-500\/20/g,
    'bg-white/10 text-white border border-white/15');
    
  content = content.replace(/text-cyan-400 bg-cyan-500\/10 px-1\.5 py-0\.5 rounded border border-cyan-500\/30/g,
    'text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15');

  content = content.replace(/text-xs font-mono bg-indigo-500\/10 text-indigo-400 px-1\.5 py-0\.5 rounded border border-indigo-500\/30/g,
    'text-xs font-mono bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15');

  // Any remaining loose text-indigo-400 or text-cyan-400 inside font-mono should be text-white
  content = content.replace(/text-cyan-400/g, 'text-slate-300');
  content = content.replace(/text-indigo-400/g, 'text-slate-300');
  
  // Specific fix for slate-300 inside font-mono, making it white might be better but slate-300 is fine
  // Or we just replace it globally.
  
  // Let's replace bg-indigo-500/10 with bg-white/5
  content = content.replace(/bg-indigo-500\/10/g, 'bg-white/5');
  content = content.replace(/border-indigo-500\/20/g, 'border-white/10');
  content = content.replace(/border-indigo-500\/30/g, 'border-white/15');
  
  content = content.replace(/bg-cyan-500\/10/g, 'bg-white/5');
  content = content.replace(/border-cyan-500\/20/g, 'border-white/10');
  content = content.replace(/border-cyan-500\/30/g, 'border-white/15');

  fs.writeFileSync(file, content, 'utf8');
});
