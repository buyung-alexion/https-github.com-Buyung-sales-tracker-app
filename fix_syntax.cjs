const fs = require('fs');
let tsx = fs.readFileSync('src/pages/mobile/HomepageV2.tsx', 'utf8');
tsx = tsx.replace('{/* Horizontal Stats Slider *)}', '{/* Horizontal Stats Slider */}');
tsx = tsx.replace(/color: #64748b'/g, "color: '#64748b'");
fs.writeFileSync('src/pages/mobile/HomepageV2.tsx', tsx);
console.log('Fixed');