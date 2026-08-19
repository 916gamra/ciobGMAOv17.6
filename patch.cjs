const fs = require('fs');
const code = fs.readFileSync('src/main.tsx', 'utf8');
const newCode = `
window.addEventListener('error', e => {
  fetch('/api/log', { method: 'POST', body: String(e.error?.stack || e.message) }).catch(() => {});
});
` + code;
fs.writeFileSync('src/main.tsx', newCode);
