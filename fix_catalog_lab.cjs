const fs = require('fs');
let content = fs.readFileSync('src/features/organization/views/PartsCatalogLabView.tsx', 'utf8');

// Replace all amber with cyan since PDR is cyan.
content = content.replace(/amber/g, 'cyan');

// Ensure neutral colors for main backgrounds and rows
// But I already did sed for bg-amber-500/10 etc to bg-white/10. Let's make sure there are no bg-cyan-500/10 except for icons.
content = content.replace(/bg-cyan-500\/\[0\.01\]/g, 'bg-white/[0.01]');
content = content.replace(/bg-cyan-500\/5/g, 'bg-white/5');

fs.writeFileSync('src/features/organization/views/PartsCatalogLabView.tsx', content);
