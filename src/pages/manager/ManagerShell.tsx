import { useState, ReactNode, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart2, Users, Menu, X, Settings, Newspaper, Trophy, FileText, Database, LogOut, Mail, MessageCircle } from 'lucide-react';
import LiveActivityFeed from './LiveActivityFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import ManagerProspek from './ManagerProspek';
import ManagerCustomer from './ManagerCustomer';
import ManagerInbox from './ManagerInbox';
import Leaderboard from './Leaderboard';
import Summary from './Summary';
import ManagerSettings from './ManagerSettings';
import DataManagement from './DataManagement';
import ManagerChat from './ManagerChat';

type ManagerShellProps = {
  children: ReactNode;
};

export default function ManagerShell({ children }: ManagerShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
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

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if(window.confirm('Yakin ingin keluar?')) {
      localStorage.removeItem('st_user');
      window.location.href = '/';
    }
  };

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
        { to: '/manager/summary', icon: <FileText size={18} />, label: 'Summary' },
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
          <span className="logo-icon">🥩</span>
          <div>
            <div className="logo-title">Sales Tracker</div>
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
          
          {shellTitle && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '16px', marginRight: 'auto', textAlign: 'left' }}>
              <h1 className="mgr-title" style={{ fontSize: '20px', margin: 0, padding: 0, lineHeight: 1.2 }}>{shellTitle}</h1>
              {shellSub && <p className="mgr-sub" style={{ margin: 0, fontSize: '12px', marginTop: '2px', opacity: 0.8 }}>{shellSub}</p>}
            </div>
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
            <Route path="summary" element={<Summary />} />
            <Route path="settings" element={<ManagerSettings />} />
            <Route path="data" element={<DataManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
