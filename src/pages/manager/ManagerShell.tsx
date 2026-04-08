import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Activity, BarChart2, Users, Menu, X, Settings, Trophy, Database, LogOut, Mail, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LiveActivityFeed from './LiveActivityFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import ManagerProspek from './ManagerProspek';
import ManagerCustomer from './ManagerCustomer';
import ManagerInbox from './ManagerInbox';
import Leaderboard from './Leaderboard';
import ManagerSettings from './ManagerSettings';
import DataManagement from './DataManagement';
import ManagerChat from './ManagerChat';

export default function ManagerShell() {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shellTitle, setShellTitle] = useState('');
  const [shellSub, setShellSub] = useState('');

  useEffect(() => {
    const handleSetTitle = (e: any) => {
      setShellTitle(e.detail.title);
      setShellSub(e.detail.sub);
    };
    window.addEventListener('setMgrTitle', handleSetTitle);
    return () => window.removeEventListener('setMgrTitle', handleSetTitle);
  }, []);

  const handleLogout = (e: any) => {
    e.preventDefault();
    if(window.confirm('Yakin ingin keluar?')) {
      logout();
    }
  };

  if (!user) return null;

  const menuCategories = [
    {
      category: 'Main Menu',
      items: [
        { to: '/manager/activity', icon: <Activity size={18} />, label: 'Live Activity' },
        { to: '/manager/prospek', icon: <Users size={18} />, label: 'Data Prospek' },
        { to: '/manager/customer', icon: <Users size={18} />, label: 'Data Customer' },
        { to: '/manager/inbox', icon: <Mail size={18} />, label: 'Info Tim' },
        { to: '/manager/chat', icon: <MessageCircle size={18} />, label: 'Live Chat' },
      ]
    },
    {
      category: 'Analytic',
      items: [
        { to: '/manager/analytics', icon: <BarChart2 size={18} />, label: 'Analytics' },
        { to: '/manager/leaderboard', icon: <Trophy size={18} />, label: 'Leaderboard' },
      ]
    },
    {
      category: 'Menu Setting',
      items: [
        { to: '/manager/settings', icon: <Settings size={18} />, label: 'Setting' },
        { to: '/manager/data', icon: <Database size={18} />, label: 'Data Management' },
        { to: 'logout', icon: <LogOut size={18} />, label: 'Logout', action: true },
      ]
    }
  ];

  return (
    <div className="manager-shell">
      {/* Sidebar */}
      <aside className={`manager-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src="/assets/image/logo_ikt.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="logo-title" style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Industri Keluarga Timur</div>
            <div className="logo-sub">Manager Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuCategories.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(17,24,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px 16px' }}>{cat.category}</div>
              {cat.items.map(item => item.action ? (
                <a key={item.to} href="#" className="sidebar-link" onClick={handleLogout} style={{ color: '#ef4444' }}>
                  {item.icon} <span style={{ color: '#ef4444' }}>{item.label}</span>
                </a>
              ) : (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                  {item.icon} <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>


        <div className="sidebar-footer">
          <Users size={14} />
          <a href="/mobile" target="_blank" rel="noopener noreferrer">Buka App Sales →</a>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="manager-main">
        <header className="manager-topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          {shellTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px', marginRight: 'auto', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {shellTitle === 'Activity Stream' && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      background: 'rgba(239, 68, 68, 0.08)', 
                      padding: '2px 10px', 
                      borderRadius: '100px',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      height: '24px'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} className="pulse" />
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.5px' }}>LIVE</span>
                    </div>
                  )}
                  <h1 className="mgr-title" style={{ fontSize: '22px', fontWeight: 950, margin: 0, padding: 0, lineHeight: 1, letterSpacing: '-0.5px', color: '#1e293b' }}>{shellTitle}</h1>
                </div>
                {shellSub && <p className="mgr-sub" style={{ margin: 0, fontSize: '11px', marginTop: '2px', opacity: 0.7, fontWeight: 600 }}>{shellSub}</p>}
              </div>
            </div>
          ) : (
            <div id="mgr-topbar-center" style={{ flex: 1, display: 'flex', alignItems: 'center', marginLeft: '16px', marginRight: 'auto' }} />
          )}

          <nav className="topbar-nav">
            {menuCategories.flatMap(c => c.items).filter(i => !i.action).map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
                {item.icon} <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="topbar-right">
            <span className="live-dot" /> <span className="live-label">Live</span>
          </div>
        </header>

        <main className="manager-content">
          <Routes>
            <Route index element={<LiveActivityFeed />} />
            <Route path="activity" element={<LiveActivityFeed />} />
            <Route path="analytics" element={<PerformanceAnalytics />} />
            <Route path="prospek" element={<ManagerProspek />} />
            <Route path="customer" element={<ManagerCustomer />} />
            <Route path="inbox" element={<ManagerInbox />} />
            <Route path="chat" element={<ManagerChat />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="settings" element={<ManagerSettings />} />
            <Route path="data" element={<DataManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
