import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart2, Users, Menu, X, Settings, Database, LogOut, Mail, MessageCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LiveActivityFeed from './LiveActivityFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import ManagerProspek from './ManagerProspek';
import ManagerCustomer from './ManagerCustomer';
import ManagerInbox from './ManagerInbox';
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

  useEffect(() => {
    const handleCollapseSidebar = (e: any) => {
      if (e.detail !== undefined) {
        setSidebarCollapsed(e.detail);
      }
    };
    window.addEventListener('collapseSidebar', handleCollapseSidebar);
    return () => {
      window.removeEventListener('collapseSidebar', handleCollapseSidebar);
    };
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
      category: 'Menu Utama',
      items: [
        { to: '/manager/analytics', icon: <BarChart2 size={18} />, label: 'Dashbord' },
        { to: '/manager/customer', icon: <Users size={18} />, label: 'Data Customer' },
        { to: '/manager/prospek', icon: <Users size={18} />, label: 'Data Prospek' },
        { to: '/manager/activity', icon: <Activity size={18} />, label: 'Data Activity' },
        { to: '/manager/chat', icon: <MessageCircle size={18} />, label: 'Inbox' },
        { to: '/manager/inbox', icon: <Mail size={18} />, label: 'Info Tim' },
        { to: '/manager/settings', icon: <Settings size={18} />, label: 'Setting' },
        ...(isAdmin ? [{ to: '/manager/data', icon: <Database size={18} />, label: 'Data Management' }] : []),
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
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              width: '28px', 
              height: '28px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              transition: 'all 0.3s'
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuCategories.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              {!sidebarCollapsed && <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px 16px' }}>{cat.category}</div>}
              {cat.items.map(item => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} style={{ position: 'relative', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '14px 0' : '14px 16px' }}>
                  {item.icon} {!sidebarCollapsed && <span>{item.label}</span>}
                  {item.label === 'Inbox' && chatUnread > 0 && (
                    <span style={{ 
                      position: 'absolute', 
                      top: sidebarCollapsed ? '8px' : '12px', 
                      right: sidebarCollapsed ? '12px' : '16px', 
                      background: '#EF4444', color: '#fff', fontSize: '10px', 
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
          <div style={{ marginTop: 'auto', padding: '24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', opacity: 0.8 }}>
              v1.5.0-Shopee-Premium (08-05-26)
            </div>
          </div>
        )}
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="manager-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* NEW TOPBAR WITH PROFILE */}
        <header style={{ padding: '0 32px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} style={{ display: 'flex' }}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              PT. Industri Keluarga Timur
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
             {/* Profile Info */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{user.nama}</div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Login sebagai: {user.role}</div>
               </div>
               <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 900, fontSize: '16px', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.1)' }}>
                 {user.nama.charAt(0).toUpperCase()}
               </div>
             </div>
             
             {/* Logout Button */}
             <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}>
               <LogOut size={16} /> Keluar
             </button>
          </div>
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
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={24} color="#fff" />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#60A5FA', letterSpacing: '0.1em' }}>PESAN BARU</div>
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

        <main className="manager-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route index element={<LiveActivityFeed />} />
            <Route path="activity" element={<LiveActivityFeed />} />
            <Route path="analytics" element={<PerformanceAnalytics />} />
            <Route path="prospek" element={<ManagerProspek />} />
            <Route path="customer" element={<ManagerCustomer />} />
            <Route path="inbox" element={<ManagerInbox />} />
            <Route path="chat" element={<ManagerChat />} />
            <Route path="settings" element={<ManagerSettings />} />
            <Route path="data" element={<MasterDataSettings />} />
            <Route path="negotiations" element={<NegotiationsDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
