import { useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, BarChart2, MessageSquare, X, LogOut, User as UserIcon, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Homepage from './HomepageV3';
import DashboardTarget from './DashboardTarget';
import ProspectingTool from './ProspectingTool';
import CustomerMaintenance from './CustomerMaintenance';
import ActivityHistory from './ActivityHistory';
import Profile from './Profile';
import ClientDetail from './ClientDetail';
import SalesChat from './SalesChat';
import MobileLeaderboard from './MobileLeaderboard';
import OrderHistory from './OrderHistory';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import ChatNotificationPopup from '../../components/ChatNotificationPopup';

export default function MobileShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount: chatUnread, newMsg, clearNewMsg } = useChatNotifications(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isEditingProfile = location.pathname === '/mobile/profile' && location.search.includes('edit=true');

  if (!user) return null;



  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar dari akun?')) {
      logout();
      setSidebarOpen(false);
    }
  };

  return (
    <div className="mobile-shell">
      <ChatNotificationPopup 
        newMsg={newMsg} 
        onClear={clearNewMsg} 
        onClick={() => {
          navigate('/mobile/chat');
          clearNewMsg();
        }} 
      />
      {/* 
          OVERLAY SIDEBAR (Premium Side Menu)
          Added to provide stable logout and navigation access from anywhere.
      */}
      {sidebarOpen && (
        <div 
          className="animate-fade-in" 
          onClick={() => setSidebarOpen(false)}
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(11, 8, 21, 0.8)', 
            backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex' 
          }}
        >
          <div 
            className="animate-slide-right"
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '80%', maxWidth: '320px', background: '#fff', height: '100%', 
              padding: '40px 24px', display: 'flex', flexDirection: 'column',
              boxShadow: '20px 0 50px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src="/assets/image/logo_ikt.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>PT. Industri <br/> Keluarga Timur</div>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '0 8px 16px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 950, fontSize: '16px' }}>{user.nama}</div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{user.role}</div>
              </div>

              {[
                { label: 'Profile Saya', icon: UserIcon, path: '/mobile/profile' },
                { label: 'Ranking Sales', icon: LayoutDashboard, path: '/mobile/rank' },
              ].map(item => (
                <button 
                  key={item.label}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className="tap-active"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                    borderRadius: '16px', border: 'none', background: 'transparent',
                    fontSize: '15px', fontWeight: 800, color: '#1E293B'
                  }}
                >
                  <item.icon size={20} color="#64748B" />
                  {item.label}
                </button>
              ))}
            </div>

            <button 
              onClick={handleLogout}
              className="tap-active"
              style={{ 
                marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '16px', 
                padding: '20px', borderRadius: '20px', border: 'none', background: '#FEF2F2',
                fontSize: '15px', fontWeight: 950, color: '#EF4444'
              }}
            >
              <LogOut size={22} />
              Keluar Sekarang
            </button>
          </div>
        </div>
      )}


      <main className={`mobile-main ${location.pathname.startsWith('/mobile/chat') ? 'no-scroll' : ''}`}>
        <Routes>
          <Route index element={<Homepage salesId={user.id} setSidebarOpen={setSidebarOpen} />} />
          <Route path="home" element={<Homepage salesId={user.id} setSidebarOpen={setSidebarOpen} />} />
          <Route path="analytic" element={<DashboardTarget salesId={user.id} />} />
          <Route path="prospek" element={<ProspectingTool salesId={user.id} />} />
          <Route path="customer" element={<CustomerMaintenance salesId={user.id} />} />
          <Route path="activity" element={<ActivityHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:type/:id" element={<ClientDetail />} />
          <Route path="chat" element={<SalesChat salesId={user.id} />} />
          <Route path="rank" element={<MobileLeaderboard />} />
          <Route path="order-history" element={<OrderHistory />} />
        </Routes>
      </main>

      {/* FAB is now integrated into Bottom Nav for perfect alignment */}
      {(!isEditingProfile) && (
        <nav className="bottom-nav shadow-premium wallet-nav-dark">
          <div 
            style={{ 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 10001,
              cursor: 'pointer'
            }}
            className="wallet-nav-fab tap-active" 
            onClick={() => navigate('/mobile/order-history')}
          >
            <ShoppingCart size={24} strokeWidth={2.5} color="#111827" />
          </div>

          {[
            { to: '/mobile/home',     Icon: LayoutDashboard, label: 'Home'      },
            { to: '/mobile/analytic', Icon: BarChart2,        label: 'Analytics' },
            { spacer: true },
            { to: '/mobile/activity', Icon: MapPin,           label: 'Activity'  },
            { to: '/mobile/chat',     Icon: MessageSquare,    label: 'Chat'      },
          ].map((item) => {
            if (item.spacer) return <div key="spacer" className="nav-item" style={{ visibility: 'hidden' }}></div>;
            
            const { to, Icon, label } = item as any;
            return (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                {() => (
                  <>
                    <span className="nav-icon-wrap">
                      <span className="nav-icon-bubble" />
                      <Icon size={20} className="nav-icon-svg" />
                      {label === 'Chat' && chatUnread > 0 && (
                        <span style={{ 
                          position: 'absolute', 
                          top: '-6px', 
                          right: '-8px', 
                          background: '#EF4444', 
                          color: '#fff', 
                          fontSize: '9px', 
                          fontWeight: 950, 
                          minWidth: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                        }}>
                          {chatUnread > 9 ? '9+' : chatUnread}
                        </span>
                      )}
                    </span>
                    <span className="nav-label">{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
