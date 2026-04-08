import { useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, BarChart2, MessageSquare, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Homepage from './Homepage';
import DashboardTarget from './DashboardTarget';
import ProspectingTool from './ProspectingTool';
import CustomerMaintenance from './CustomerMaintenance';
import CheckInVisit from './CheckInVisit';
import Profile from './Profile';
import ClientDetail from './ClientDetail';
import SalesChat from './SalesChat';
import MobileLeaderboard from './MobileLeaderboard';
import { useChatNotifications } from '../../hooks/useChatNotifications';

export default function MobileShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const chatUnread = useChatNotifications(user?.id);
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
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>Industri <br/> Keluarga Timur</div>
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

      {/* Header with Menu Trigger - Integrated with Homepage via props or absolute overlay */}
      <div style={{ 
        position: 'fixed', top: '16px', left: '20px', zIndex: 1000,
        display: location.pathname === '/mobile/home' ? 'block' : 'none' 
      }}>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="tap-active"
          style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <Menu size={22} color="#111827" strokeWidth={3} />
        </button>
      </div>

      <main className="mobile-main">
        <Routes>
          <Route index element={<Homepage salesId={user.id} />} />
          <Route path="home" element={<Homepage salesId={user.id} />} />
          <Route path="analytic" element={<DashboardTarget salesId={user.id} />} />
          <Route path="prospek" element={<ProspectingTool salesId={user.id} />} />
          <Route path="customer" element={<CustomerMaintenance salesId={user.id} />} />
          <Route path="checkin" element={<CheckInVisit salesId={user.id} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:type/:id" element={<ClientDetail />} />
          <Route path="chat" element={<SalesChat salesId={user.id} />} />
          <Route path="rank" element={<MobileLeaderboard />} />
        </Routes>
      </main>

      {!isEditingProfile && (
        <nav className="bottom-nav shadow-premium">
          {[
            { to: '/mobile/home',     Icon: LayoutDashboard, label: 'Home'      },
            { to: '/mobile/analytic', Icon: BarChart2,        label: 'Analytics' },
            { to: '/mobile/checkin',  Icon: MapPin,           label: 'Visit'     },
            { to: '/mobile/chat',     Icon: MessageSquare,    label: 'Chat'      },
          ].map(({ to, Icon, label }) => (
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
          ))}
        </nav>
      )}
    </div>
  );
}
