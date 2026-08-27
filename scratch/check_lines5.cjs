
const fs = require('fs');
const lines = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx', 'utf8').split('\n');
console.log(lines.slice(360, 430).join('\n'));

