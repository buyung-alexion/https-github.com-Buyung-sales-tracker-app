import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, MapPin, BarChart2 } from 'lucide-react';
import { useCurrentSales, useSalesData } from '../../hooks/useSalesData';
import Homepage from './Homepage';
import DashboardTarget from './DashboardTarget';
import ProspectingTool from './ProspectingTool';
import CustomerMaintenance from './CustomerMaintenance';
import CheckInVisit from './CheckInVisit';
import Profile from './Profile';
import RencanaBesok from './RencanaBesok';
import TargetProfile from './TargetProfile';

export default function MobileShell() {
  const { currentSalesId, setSales } = useCurrentSales();
  const { sales: allSales } = useSalesData();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(!currentSalesId);

  if (showLogin || !currentSalesId) {
    return (
      <div className="mobile-login">
        <div className="login-card">
          <div className="login-logo">🥩</div>
          <h1>Sales Tracker</h1>
          <p>Pilih nama Anda untuk mulai</p>
          <div className="login-buttons">
            {allSales.map(s => (
              <button key={s.id} className="login-btn" onClick={() => { setSales(s.id); setShowLogin(false); navigate('/mobile/dashboard'); }}>
                <span className={`armada-badge arm-${s.armada.toLowerCase()}`}>Armada {s.armada}</span>
                <span className="login-name">{s.nama}</span>
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
          <Route path="profile/:type/:id" element={<TargetProfile />} />
          <Route path="rencana" element={<RencanaBesok salesId={currentSalesId} />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {[
          { to: '/mobile/home',     Icon: LayoutDashboard, label: 'Home'      },
          { to: '/mobile/analytic', Icon: BarChart2,        label: 'Analytic'  },
          { to: '/mobile/prospek',  Icon: Users,            label: 'Prospek'   },
          { to: '/mobile/customer', Icon: UserCheck,        label: 'Customer'  },
          { to: '/mobile/checkin',  Icon: MapPin,           label: 'Check-In'  },
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
    </div>
  );
}
