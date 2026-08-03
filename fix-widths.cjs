const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else if (filePath.endsWith('.tsx') && filePath.includes('/views/')) {
      files.push(filePath);
    }
  }
  return files;
}

const files = getFiles('./src/features');
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/className="max-w-[567]xl mx-auto([^"]*)"/g, (match, p1) => {
    let classes = p1;
    if (!classes.includes('w-full')) {
      classes = ' w-full' + classes;
    }
    if (!classes.includes('lg:px-8') && !classes.includes('px-8')) {
        classes = classes + ' lg:px-8';
    }
    // ensure no double spaces
    classes = classes.replace(/\s+/g, ' ');
    return `className="${classes.trim()}"`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Modified:', file);
  }
}
console.log('Done, modified', changedCount, 'files');
