
const fs = require('fs');
let file = 'C:/Sales Tracker/src/pages/mobile/MobileShell.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the bottom nav JSX
const newNav = 
      {(!isEditingProfile) && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #E8E8E8',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          height: '64px', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.03)'
        }}>
          {[
            { to: '/mobile/home',     Icon: LayoutDashboard, label: 'Beranda' },
            { to: '/mobile/customer', Icon: Users,           label: 'Customer' },
            { to: '/mobile/order-history', Icon: ShoppingCart, label: 'Pesanan' },
            { to: '/mobile/activity', Icon: MapPin,          label: 'Aktivitas' },
            { to: '/mobile/chat',     Icon: MessageSquare,   label: 'Chat' }
          ].map((item) => {
            const { to, Icon, label } = item;
            return (
              <NavLink key={to} to={to} style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', width: '100%', paddingTop: '8px', paddingBottom: '8px',
                    position: 'relative',
                    background: isActive ? '#E6F6EC' : 'transparent',
                    borderTop: isActive ? '3px solid #00AA13' : '3px solid transparent',
                    marginTop: isActive ? '-1px' : '0'
                  }}>
                    <Icon size={22} color={isActive ? '#00AA13' : '#727272'} style={{ marginBottom: '4px' }} />
                    <span style={{ 
                      fontSize: '11px', fontWeight: isActive ? 800 : 600, 
                      color: isActive ? '#00AA13' : '#727272' 
                    }}>
                      {label}
                    </span>
                    {label === 'Chat' && chatUnread > 0 && (
                      <span style={{ 
                        position: 'absolute', top: '4px', right: 'calc(50% - 16px)', 
                        background: '#EF4444', color: '#fff', fontSize: '9px', fontWeight: 950, 
                        minWidth: '16px', height: '16px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff'
                      }}>
                        {chatUnread > 9 ? '9+' : chatUnread}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      )}
;

content = content.replace(/\{\(\!isEditingProfile\) && \([\s\S]*?<\/nav>\n\s*\)\}/m, newNav);

fs.writeFileSync(file, content);
console.log('MobileShell.tsx updated');

