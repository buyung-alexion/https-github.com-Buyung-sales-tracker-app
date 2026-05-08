import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart2, Users, Menu, X, Settings, Trophy, Database, LogOut, Mail, MessageCircle, MessageSquare, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LiveActivityFeed from './LiveActivityFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import ManagerProspek from './ManagerProspek';
import ManagerCustomer from './ManagerCustomer';
import ManagerInbox from './ManagerInbox';
import Leaderboard from './Leaderboard';
import ManagerSettings from './ManagerSettings';
import MasterDataSettings from './MasterDataSettings';
import ManagerChat from './ManagerChat';
import NegotiationsDashboard from './NegotiationsDashboard';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import ChatNotificationPopup from '../../components/ChatNotificationPopup';

export default function ManagerShell() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount: chatUnread, newMsg, clearNewMsg } = useChatNotifications(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shellTitle, setShellTitle] = useState('');

  useEffect(() => {
    const handleSetTitle = (e: any) => {
      setShellTitle(e.detail.title);
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

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!user) return null;

  const isAdmin = (user?.role || '').toLowerCase().includes('admin');

  const menuCategories = [
    {
      category: 'Main Menu',
      items: [
        { to: '/manager/activity', icon: <Activity size={18} />, label: 'Activity' },
        { to: '/manager/prospek', icon: <Users size={18} />, label: 'Data Prospek' },
        { to: '/manager/customer', icon: <Users size={18} />, label: 'Data Customer' },
        { to: '/manager/inbox', icon: <Mail size={18} />, label: 'Info Tim' },
        { to: '/manager/chat', icon: <MessageCircle size={18} />, label: 'Inbox' },
        { to: '/manager/negotiations', icon: <ShoppingBag size={18} />, label: 'Marketplace' },
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
        ...(isAdmin ? [{ to: '/manager/data', icon: <Database size={18} />, label: 'Data Management' }] : []),
        { to: 'logout', icon: <LogOut size={18} />, label: 'Logout', action: true },
      ]
    }
  ];

  return (
    <div className="manager-shell">
      <ChatNotificationPopup 
        newMsg={newMsg} 
        onClear={clearNewMsg} 
        onClick={() => {
          navigate('/manager/chat');
          clearNewMsg();
        }} 
      />
      {/* Sidebar */}
      <aside className={`manager-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src="/assets/image/logo_ikt.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div className="logo-title" style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>PT. INDUSTRI KELUARGA TIMUR</div>
              <div className="logo-sub">Manager Dashboard</div>
            </div>
          )}
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ 
              marginLeft: sidebarCollapsed ? '0' : 'auto', 
              background: 'rgba(0,0,0,0.05)', 
              borderRadius: '8px', 
              width: '28px', 
              height: '28px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#111827',
              transition: 'all 0.3s'
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuCategories.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              {!sidebarCollapsed && <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(17,24,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px 16px' }}>{cat.category}</div>}
              {cat.items.map(item => item.action ? (
                <a key={item.to} href="#" className="sidebar-link" onClick={handleLogout} style={{ color: '#EE4D2D', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '14px 0' : '14px 16px' }}>
                  {item.icon} {!sidebarCollapsed && <span style={{ color: '#EE4D2D' }}>{item.label}</span>}
                </a>
              ) : (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} style={{ position: 'relative', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '14px 0' : '14px 16px' }}>
                  {item.icon} {!sidebarCollapsed && <span>{item.label}</span>}
                  {item.label === 'Inbox' && chatUnread > 0 && (
                    <span style={{ 
                      position: 'absolute', 
                      top: sidebarCollapsed ? '8px' : '12px', 
                      right: sidebarCollapsed ? '12px' : '16px', 
                      background: '#EE4D2D', color: '#fff', fontSize: '10px', 
                      fontWeight: 900, minWidth: '18px', height: '18px', 
                      borderRadius: '50%', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', border: '2px solid #fff' 
                    }}>
                      {chatUnread > 9 ? '9+' : chatUnread}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>




        {!sidebarCollapsed && (
          <div style={{ marginTop: 'auto', padding: '24px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', opacity: 0.8 }}>
              v1.1.0-DynamicRoles (23-04-23)
            </div>
          </div>
        )}
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="manager-main">
        <header className="manager-topbar" style={{ 
          display: shellTitle ? 'flex' : (window.innerWidth <= 768 ? 'flex' : 'none'),
          padding: shellTitle ? '20px 32px 10px' : '10px 16px'
        }}>
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          <div id="mgr-topbar-center" style={{ flex: 1, display: 'flex', alignItems: 'center', marginLeft: '16px', marginRight: 'auto' }} />

          <nav className="topbar-nav">
            {menuCategories.flatMap(c => c.items).filter(i => !i.action).map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
                {item.icon} <span>{item.label}</span>
                {item.label === 'Inbox' && chatUnread > 0 && (
                  <span style={{ 
                    position: 'absolute', top: '-4px', right: '-4px', 
                    background: '#EE4D2D', color: '#fff', fontSize: '10px', 
                    fontWeight: 900, minWidth: '18px', height: '18px', 
                    borderRadius: '50%', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', border: '2px solid #fff' 
                  }}>
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

        </header>

        {/* NOTIFICATION TOAST (New Message) */}
        {newMsg && (
          <div 
            className="animate-slide-down" 
            onClick={() => { navigate('/manager/chat'); clearNewMsg(); }}
            style={{ 
              position: 'fixed', top: '24px', right: '24px', 
              background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)',
              borderRadius: '20px', padding: '16px 20px', zIndex: 10000,
              display: 'flex', alignItems: 'center', gap: '16px', color: '#fff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', width: '380px'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EE4D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={24} color="#fff" />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#EE4D2D', letterSpacing: '0.1em' }}>PESAN BARU</div>
                <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>BARU SAJA</div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{newMsg.sender_name || 'Tim'}: {newMsg.text}</div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); clearNewMsg(); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <main className="manager-content" style={{ paddingTop: shellTitle ? '10px' : '0' }}>
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
            <Route path="data" element={<MasterDataSettings />} />
            <Route path="negotiations" element={<NegotiationsDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
