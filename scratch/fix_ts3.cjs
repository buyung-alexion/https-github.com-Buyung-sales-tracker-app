const fs = require('fs');

let content = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV3.tsx', 'utf-8');
content = content.replace(/const totalSalesAmount =.*?\r?\n/g, '');
content = content.replace(/const salesTarget =.*?\r?\n/g, '');
content = content.replace(/const totalActivities =.*?\r?\n/g, '');
content = content.replace(/const activityTarget =.*?\r?\n/g, '');
fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV3.tsx', content);
