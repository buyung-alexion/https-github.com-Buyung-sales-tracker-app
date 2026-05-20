const fs = require('fs');

let shellTsx = fs.readFileSync('src/pages/mobile/MobileShell.tsx', 'utf8');

const shellSearch = `        <nav className="bottom-nav shadow-premium wallet-nav-dark">
          {[
            { to: '/mobile/home',     Icon: LayoutDashboard, label: 'Home'      },
            { to: '/mobile/analytic', Icon: BarChart2,        label: 'Analytics' },
            { to: '/mobile/activity', Icon: MapPin,           label: 'Activity'  },
            { to: '/mobile/chat',     Icon: MessageSquare,    label: 'Chat'      },
          ].map(({ to, Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              {() => (`;

const shellReplace = `        <nav className="bottom-nav shadow-premium wallet-nav-dark">
          {[
            { to: '/mobile/home',     Icon: LayoutDashboard, label: 'Home'      },
            { to: '/mobile/analytic', Icon: BarChart2,        label: 'Analytics' },
            { spacer: true },
            { to: '/mobile/activity', Icon: MapPin,           label: 'Activity'  },
            { to: '/mobile/chat',     Icon: MessageSquare,    label: 'Chat'      },
          ].map((item, idx) => {
            if (item.spacer) return <div key="spacer" style={{ width: '48px', flexShrink: 0 }}></div>;
            const { to, Icon, label } = item;
            return (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              {() => (`;

shellTsx = shellTsx.replace(shellSearch, shellReplace);

const shellSearchEnd = `              )}
            </NavLink>
          ))}
        </nav>`;

const shellReplaceEnd = `              )}
            </NavLink>
            );
          })}
        </nav>`;

shellTsx = shellTsx.replace(shellSearchEnd, shellReplaceEnd);
fs.writeFileSync('src/pages/mobile/MobileShell.tsx', shellTsx);

let homeTsx = fs.readFileSync('src/pages/mobile/HomepageV2.tsx', 'utf8');

const homeSearch = `{/* Horizontal Stats Slider */}
      <div style={{ margin: '0 0 24px 0', padding: '0 20px' }}>
         <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }} className="hide-scrollbar">
            <div style={{ minWidth: '140px', background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Total Order (Bulan ini)</div>
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
      </div>`;

const homeReplace = `{/* Horizontal Stats Slider */}
      <div style={{ margin: '0 0 24px 0', padding: '0 20px' }}>
         <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }} className="hide-scrollbar">
            <div style={{ minWidth: '140px', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #C7D2FE' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', marginBottom: '8px' }}>Total Order (Bulan ini)</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#312E81' }}>{totalSO}</div>
            </div>
            <div style={{ minWidth: '140px', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FDE68A' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#D97706', marginBottom: '8px' }}>Total Visit (Bulan ini)</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#78350F' }}>{totalVisit}</div>
            </div>
            <div style={{ minWidth: '140px', background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #A7F3D0' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>Total Customer</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#064E3B' }}>{totalMyCustomer}</div>
            </div>
            <div style={{ minWidth: '140px', background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #FECACA' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>Total Prospek</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#7F1D1D' }}>{totalMyProspek}</div>
            </div>
         </div>
      </div>`;

homeTsx = homeTsx.replace(homeSearch, homeReplace);
fs.writeFileSync('src/pages/mobile/HomepageV2.tsx', homeTsx);

console.log('Fixed shell and home');
