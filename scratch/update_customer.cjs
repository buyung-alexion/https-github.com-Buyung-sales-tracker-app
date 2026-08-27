const fs = require('fs');

let file = 'C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header
content = content.replace(
  /<h2 className="hero-premium-title" style={{ fontSize: '24px', margin: 0 }}>Customer<\/h2>/g, 
  '<h2 className="hero-premium-title" style={{ fontSize: '20px', margin: 0, color: \'#fff\' }}>Customer Maintenance</h2>'
);

// The top banner uses yellow-bg-top, let's make the text white for contrast if it's dark, or leave as is. 
// Ah, the user said "dibagian data customer headernya belum ada", probably because yellow-bg-top didn't have white text and was hard to read, or maybe the text was just "Customer" instead of "Customer Maintenance".

// Phone wrapping
content = content.replace(
  /<div style={{ fontSize: '13px', color: '#727272', fontWeight: 500, marginBottom: '2px', lineHeight: 1\.4 }}>/g, 
  '<div style={{ fontSize: \'13px\', color: \'#727272\', fontWeight: 500, marginBottom: \'2px\', lineHeight: 1.4, whiteSpace: \'nowrap\', overflow: \'hidden\', textOverflow: \'ellipsis\' }}>'
);

// Target KG
content = content.replace(
  /Rp\{\(\(c as any\)\.target_penjualan \|\| 5000000\)\.toLocaleString\('id-ID'\)\}/g, 
  '{((c as any).target_volume || 1000).toLocaleString(\'id-ID\')} Kg'
);

fs.writeFileSync(file, content);

let prospect = 'C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx';
let prospectContent = fs.readFileSync(prospect, 'utf8');
prospectContent = prospectContent.replace(
  /<div style={{ fontSize: '13px', color: '#727272', fontWeight: 500, marginBottom: '2px', lineHeight: 1\.4 }}>/g, 
  '<div style={{ fontSize: \'13px\', color: \'#727272\', fontWeight: 500, marginBottom: \'2px\', lineHeight: 1.4, whiteSpace: \'nowrap\', overflow: \'hidden\', textOverflow: \'ellipsis\' }}>'
);
fs.writeFileSync(prospect, prospectContent);

console.log('Customer and Prospect updated');
