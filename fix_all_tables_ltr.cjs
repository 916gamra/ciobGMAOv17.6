const fs = require('fs');
const glob = require('glob'); // Need to check if glob is available, or use a simple recursive function

const { execSync } = require('child_process');
const files = execSync('grep -rl "<table" src/features/').toString().trim().split('\n');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace <table ...> with <table dir="ltr" ...>
  // carefully not to duplicate dir="ltr"
  content = content.replace(/<table((?!dir="ltr").)*?>/g, (match) => {
     if (match.includes('dir="ltr"')) return match;
     return match.replace('<table', '<table dir="ltr"');
  });

  // Also replace text-right on table related tags with text-left if needed, 
  // but let's be careful. The user specifically mentioned the tables.
  
  // For the thead, th, td, we can ensure text-left
  content = content.replace(/<th([^>]*)text-right([^>]*)>/g, '<th$1text-left$2>');
  content = content.replace(/<td([^>]*)text-right([^>]*)>/g, '<td$1text-left$2>');
  content = content.replace(/<table([^>]*)text-right([^>]*)>/g, '<table$1text-left$2>');
  content = content.replace(/<thead([^>]*)text-right([^>]*)>/g, '<thead$1text-left$2>');
  
  fs.writeFileSync(file, content);
}
console.log('Fixed tables in ' + files.length + ' files.');
