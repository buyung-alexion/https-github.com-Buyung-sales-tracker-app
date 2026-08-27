import { useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, MessageSquare, X, LogOut, User as UserIcon, ShoppingCart, Users } from 'lucide-react';
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
              <NavLink key={to} to={to} style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center', height: '100%' }}>
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
    </div>
  );
}
