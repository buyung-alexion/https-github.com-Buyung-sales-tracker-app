const fs = require('fs');
let home2 = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', 'utf-8');
if (!home2.includes("import '../../brand-style.css';")) {
    home2 = home2.replace(/import \{.*\} from 'react';/, "$&\nimport '../../brand-style.css';");
    fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', home2);
}
