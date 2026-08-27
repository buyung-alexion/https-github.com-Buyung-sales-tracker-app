const fs = require('fs');
let content = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', 'utf-8');

// Update top header (wallet-hero) text to white
content = content.replace(/color: '#1e293b'/g, "color: '#FFFFFF'");
content = content.replace(/color: '#94a3b8'/g, "color: 'rgba(255, 255, 255, 0.8)'");
content = content.replace(/color: '#111827'/g, "color: '#111827'"); // keep dark for body text

// Update buttons in hero (like notifications)
content = content.replace(/background: '#f1f5f9'/g, "background: 'rgba(255,255,255,0.2)'");
content = content.replace(/color: '#64748b'/g, "color: '#FFFFFF'");

// Update Process Button color in Nego modal
content = content.replace(/background: 'var\(--brand-yellow\)'/g, "background: 'var(--brand-primary)'");
content = content.replace(/boxShadow: '0 4px 12px rgba\(255, 204, 0, 0\.3\)'/g, "boxShadow: '0 4px 12px rgba(0, 170, 19, 0.3)'");

fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', content);
