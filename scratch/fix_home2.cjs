const fs = require('fs');

let shell = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/MobileShell.tsx', 'utf-8');
shell = shell.replace("import Homepage from './HomepageV3';", "import Homepage from './HomepageV2';");
fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/MobileShell.tsx', shell);

let home2 = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', 'utf-8');
home2 = home2.replace(/background:\s*'(var\(--brand-yellow\)|#FBBF24)'/g, "background: 'var(--gojek-green)'");
home2 = home2.replace(/\{ icon: Target, label: 'Target', path: '\/mobile\/target', color: 'text-red-500', bg: 'bg-red-50' \},\r?\n/g, "");
fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', home2);
