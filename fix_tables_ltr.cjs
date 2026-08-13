const fs = require('fs');
let file = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');

file = file.replace(/<table className="w-full text-left border-collapse">/g, '<table className="w-full text-left border-collapse" dir="ltr">');

fs.writeFileSync('src/features/organization/views/EngineeringLabView.tsx', file);
