const fs = require('fs');
let content = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');
console.log(content.substring(content.indexOf('fam.id === expandedFamilyId'), content.indexOf('fam.id === expandedFamilyId') + 2000));
