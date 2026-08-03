import * as fs from 'fs';

let content = fs.readFileSync('src/features/organization/components/MachineLibraryCard.tsx', 'utf8');

// Change existing indigo to blue
content = content.replace(/text-indigo-500/g, 'text-blue-500');
content = content.replace(/bg-indigo-500/g, 'bg-blue-500');
content = content.replace(/border-indigo-500/g, 'border-blue-500');
content = content.replace(/text-indigo-400/g, 'text-blue-400');

// Cyan to Indigo
content = content.replace(/cyan-600/g, 'indigo-600');
content = content.replace(/cyan-500/g, 'indigo-500');
content = content.replace(/cyan-400/g, 'indigo-400');

// Emerald to Violet
content = content.replace(/emerald-500/g, 'violet-500');
content = content.replace(/emerald-400/g, 'violet-400');

fs.writeFileSync('src/features/organization/components/MachineLibraryCard.tsx', content);

console.log('Fixed colors in MachineLibraryCard');
