const fs = require('fs');
let content = fs.readFileSync('src/shared/components/HeaderBentoCard.tsx', 'utf8');
content = content.replace(/\| 'slate';/, "| 'slate' | 'indigo';");
if (!content.includes('indigo: {')) {
  content = content.replace(/slate: \{/, "indigo: {\n    bgIcon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',\n    activeBg: 'bg-indigo-500/15 border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.25)]',\n    valueColor: 'text-indigo-400',\n  },\n  slate: {");
}
fs.writeFileSync('src/shared/components/HeaderBentoCard.tsx', content);
