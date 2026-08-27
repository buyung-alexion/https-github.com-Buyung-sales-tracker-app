const fs = require('fs');

let content = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/DashboardTarget.tsx', 'utf-8');
content = content.replace(/import \{ useState, useEffect \} from 'react';\r?\n?/g, '');
fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/DashboardTarget.tsx', content);

let content2 = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV3.tsx', 'utf-8');
content2 = content2.replace(/import \{ useState, useEffect \} from 'react';\r?\n?/g, '');
content2 = content2.replace(/const salesAchievedPct =.*?\r?\n/g, '');
content2 = content2.replace(/const activityAchievedPct =.*?\r?\n/g, '');
fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV3.tsx', content2);
