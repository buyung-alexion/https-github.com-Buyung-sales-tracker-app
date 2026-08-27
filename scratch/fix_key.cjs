const fs = require('fs');

let content = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx', 'utf8');
content = content.replace(/<div key=\{\}>/g, '<div key={c.id}>');
fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx', content);

let content2 = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx', 'utf8');
content2 = content2.replace(/<div key=\{\}>/g, '<div key={p.id}>');
fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx', content2);

console.log("Fixed key");
