const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'services', 'geminiService.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove the problematic lines
// Pattern: any amount of whitespace + "memorizationTip: """ + newline + whitespace + "});" + newline
content = content.replace(/\s+memorizationTip: ""\r?\n\s+\}\);?\r?\n/g, '\r\n');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed! Lines removed from geminiService.ts');
console.log('Please restart your dev server if it hasn\'t auto-reloaded.');
