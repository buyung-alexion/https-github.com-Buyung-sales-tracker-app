import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPin, BarChart2, MessageSquare } from 'lucide-react';
import { useCurrentSales, useSalesData } from '../../hooks/useSalesData';
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

export default function MobileShell() {
  const { currentSalesId, setSales } = useCurrentSales();
  const { sales: allSales } = useSalesData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(!currentSalesId);
  
  const isEditingProfile = location.pathname === '/mobile/profile' && location.search.includes('edit=true');

  if (showLogin || !currentSalesId) {
    return (
      <div className="mobile-login" style={{ background: 'var(--bg-deep)' }}>
        <div className="login-card animate-scale shadow-premium" style={{ border: 'none', background: '#fff', borderRadius: '40px', padding: '48px 32px' }}>
          <div className="login-logo" style={{ fontSize: '72px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))', marginBottom: '24px' }}>🥩</div>
          <h1 style={{ fontSize: '32px', fontWeight: 950, letterSpacing: '-1px' }}>Sales Tracker</h1>
          <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 600, marginBottom: '40px' }}>Select your profile to begin</p>
          <div className="login-buttons" style={{ gap: '16px' }}>
            {allSales.map(s => (
              <button 
                key={s.id} 
                className="login-btn tap-active shadow-sm" 
                style={{ 
                  padding: '18px 24px', borderRadius: '24px', border: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', gap: '16px', background: '#fff'
                }}
                onClick={() => { setSales(s.id); setShowLogin(false); navigate('/mobile/home'); }}
              >
                <div className={`armada-badge arm-${s.armada.toLowerCase()}`} style={{ padding: '4px 12px', borderRadius: '10px' }}>{s.armada}</div>
                <span className="login-name" style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>{s.nama}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-shell">

      <main className="mobile-main">
        <Routes>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Homepage salesId={currentSalesId} />} />
          <Route path="analytic" element={<DashboardTarget salesId={currentSalesId} />} />
          <Route path="prospek" element={<ProspectingTool salesId={currentSalesId} />} />
          <Route path="customer" element={<CustomerMaintenance salesId={currentSalesId} />} />
          <Route path="checkin" element={<CheckInVisit salesId={currentSalesId} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:type/:id" element={<ClientDetail />} />
// Removed Rencana route
          <Route path="chat" element={<SalesChat salesId={currentSalesId} />} />
          <Route path="rank" element={<MobileLeaderboard />} />
        </Routes>
      </main>

      {!isEditingProfile && (
        <nav className="bottom-nav">
          {[
            { to: '/mobile/home',     Icon: LayoutDashboard, label: 'Home'      },
            { to: '/mobile/analytic', Icon: BarChart2,        label: 'Analytics' },
            { to: '/mobile/checkin',  Icon: MapPin,           label: 'Activity'  },
            { to: '/mobile/chat',     Icon: MessageSquare,    label: 'Chat'      },
          ].map(({ to, Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              {() => (
                <>
                  <span className="nav-icon-wrap">
                    <span className="nav-icon-bubble" />
                    <Icon size={20} className="nav-icon-svg" />
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
