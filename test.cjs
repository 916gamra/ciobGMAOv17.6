const fs = require('fs');
let content = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');
let idx = content.indexOf('pdrFamilies.map(fam => {');
if (idx === -1) idx = content.indexOf('pdrFamilies?.map(fam => {');
console.log(content.substring(idx, idx + 4000));
