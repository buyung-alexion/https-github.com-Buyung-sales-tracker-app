import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPin, BarChart2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Homepage from './Homepage';
import DashboardTarget from './DashboardTarget';
import ProspectingTool from './ProspectingTool';
import CustomerMaintenance from './CustomerMaintenance';
import CheckInVisit from './CheckInVisit';
import Profile from './Profile';
// removed import
import ClientDetail from './ClientDetail';
import SalesChat from './SalesChat';
import MobileLeaderboard from './MobileLeaderboard';
import { useChatNotifications } from '../../hooks/useChatNotifications';

export default function MobileShell() {
  const { user } = useAuth();
  const location = useLocation();
  const chatUnread = useChatNotifications(user?.id);
  
  const isEditingProfile = location.pathname === '/mobile/profile' && location.search.includes('edit=true');

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="mobile-shell">

      <main className="mobile-main">
        <Routes>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Homepage salesId={user.id} />} />
          <Route path="analytic" element={<DashboardTarget salesId={user.id} />} />
          <Route path="prospek" element={<ProspectingTool salesId={user.id} />} />
          <Route path="customer" element={<CustomerMaintenance salesId={user.id} />} />
          <Route path="checkin" element={<CheckInVisit salesId={user.id} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:type/:id" element={<ClientDetail />} />
// Removed Rencana route
          <Route path="chat" element={<SalesChat salesId={user.id} />} />
          <Route path="rank" element={<MobileLeaderboard />} />
        </Routes>
      </main>

      {!isEditingProfile && (
        <nav className="bottom-nav">
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
