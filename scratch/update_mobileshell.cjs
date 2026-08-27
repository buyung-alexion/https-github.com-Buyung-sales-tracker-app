const fs = require('fs');
let file = 'C:/Sales Tracker/src/pages/mobile/MobileShell.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/import Homepage from '\.\/HomepageV2';/g, "import Homepage from './HomepageV3';");
fs.writeFileSync(file, content);
console.log('Updated MobileShell.tsx');
