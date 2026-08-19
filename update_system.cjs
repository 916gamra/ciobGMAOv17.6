const fs = require('fs');

const content = fs.readFileSync('src/features/system/views/SystemSettingsView.tsx', 'utf8');
const newContent = content.replace(
  '{/* The 3 Standardized Action Cards inside the Main Shell */}\n          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">',
  '{/* The 3 Standardized Action Cards inside the Main Shell */}\n          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">'
);
fs.writeFileSync('src/features/system/views/SystemSettingsView.tsx', newContent);
