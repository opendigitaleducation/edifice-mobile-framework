/**
 * Utility cli that removes all console.log statements, keeping all others console.* statements
 */

const fs = require('fs');

const files = process.argv.slice(2);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const updatedContent = content.replace(/console\.log\(.*?\);?/g, '');
  fs.writeFileSync(file, updatedContent, 'utf8');
});
