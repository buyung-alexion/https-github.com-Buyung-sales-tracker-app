const fs = require('fs');
let tsx = fs.readFileSync('src/pages/mobile/HomepageV2.tsx', 'utf8');

const sliderHtml = `{/* Horizontal Stats Slider *)}
      <div style={{ margin: '0 0 24px 0', padding: '0 20px' }}>
         <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }} className="hide-scrollbar">
            <div style={{ minWidth: '140px', background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: #64748b', marginBottom: '8px' }}>Total Order (Bulan ini)</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>{totalSO}</div>
            </div>
            <div style={{ minWidth: '140px', background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Total Visit (Bulan ini)</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>{totalVisit}</div>
            </div>
            <div style={{ minWidth: '140px', background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Total Customer</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>{totalMyCustomer}</div>
            </div>
            <div style={{ minWidth: '140px', background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Total Prospek</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>{totalMyProspek}</div>
            </div>
         </div>
      </div>

      <div className="wallet-recent-section">`;

tsx = tsx.replace('<div className="wallet-recent-section">', sliderHtml);
fs.writeFileSync('src/pages/mobile/HomepageV2.tsx', tsx);
console.log('Fixed anchored replace');