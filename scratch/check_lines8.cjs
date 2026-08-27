
const fs = require('fs');
const lines = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx', 'utf8').split('\n');
console.log(lines.slice(370, 385).join('\n'));

