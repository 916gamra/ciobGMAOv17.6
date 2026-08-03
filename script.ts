import * as fs from 'fs';

let content = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');

content = content.replace(/import \{ Search, Folder, Layers, Hash, AlertCircle, Plus, Trash2, Database \} from 'lucide-react';/, "import { Search, Folder, Layers, Hash, AlertCircle, Plus, Trash2, Database, Wrench } from 'lucide-react';");

content = content.replace(/<Layers className="w-8 h-8 text-cyan-400" \/>/, '<Wrench className="w-8 h-8 text-indigo-400" />');

// Families: Cyan -> Indigo
// Templates: Indigo -> Blue
// Blueprints: Emerald -> Violet

// First, change existing indigo to blue (for templates)
content = content.replace(/text-indigo-500/g, 'text-blue-500');
content = content.replace(/bg-indigo-500/g, 'bg-blue-500');
content = content.replace(/border-indigo-500/g, 'border-blue-500');
content = content.replace(/text-indigo-400/g, 'text-blue-400');
// wait, we just made the main header Wrench indigo-400, let's fix it later.

// Change cyan to indigo
content = content.replace(/cyan-600/g, 'indigo-600');
content = content.replace(/cyan-500/g, 'indigo-500');
content = content.replace(/cyan-400/g, 'indigo-400');
content = content.replace(/text-cyan-400/g, 'text-indigo-400');

// Change emerald to violet
content = content.replace(/emerald-500/g, 'violet-500');
content = content.replace(/emerald-400/g, 'violet-400');

// Fix the main icon back to indigo
content = content.replace(/<Wrench className="w-8 h-8 text-blue-400" \/>/, '<Wrench className="w-8 h-8 text-indigo-400" />');

fs.writeFileSync('src/features/organization/views/EngineeringLabView.tsx', content);

console.log('Fixed colors in EngineeringLabView');
