const fs = require('fs');
let content = fs.readFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', 'utf-8');

// Fix the Hero Section colors manually
content = content.replace(/color: '#111827', opacity: 0.9 \}>Halo,/, "color: 'rgba(255,255,255,0.9)' }>Halo,");
content = content.replace(/color: '#111827', margin: 0, letterSpacing: '-0.5px' \}>/, "color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }>");
content = content.replace(/<Bell size=\{22\} color="#111827"/, "<Bell size={22} color=\"#FFFFFF\"");
content = content.replace(/<Menu size=\{22\} color="#111827"/, "<Menu size={22} color=\"#FFFFFF\"");
content = content.replace(/var\(--brand-yellow\)/g, "var(--brand-primary)");
content = content.replace(/className="wallet-balance-label">POIN BULAN INI<\/div>/, "className=\"wallet-balance-label\" style={{ color: 'rgba(255,255,255,0.9)' }}>POIN BULAN INI</div>");
content = content.replace(/className="wallet-balance-value">/, "className=\"wallet-balance-value\" style={{ color: '#FFFFFF' }}>");
content = content.replace(/<span style=\{\{ fontSize: '14px', fontWeight: 900, color: '#1e293b' \}\}>Sales Status<\/span>/, "<span style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF' }}>Sales Status</span>");
content = content.replace(/<div style=\{\{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' \}\}>Sales Status<\/div>/, "<div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginBottom: '4px' }}>Sales Status</div>");

fs.writeFileSync('C:/Sales Tracker/src/pages/mobile/HomepageV2.tsx', content);
