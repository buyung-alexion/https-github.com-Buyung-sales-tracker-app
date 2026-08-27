
const fs = require('fs');
const file = 'C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log(lines.slice(290, 430).join('\n'));

