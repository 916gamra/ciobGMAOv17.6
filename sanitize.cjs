const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let newContent = content;
      // remove neon glows
      newContent = newContent.replace(/drop-shadow-\[.*?\]/g, '');
      // replace animate-pulse which is often used for hacker-y blinking cursors
      // newContent = newContent.replace(/animate-pulse/g, '');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Removed glow from ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Sanitization of glows complete.');
