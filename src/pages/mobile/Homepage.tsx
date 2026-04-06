import { useState } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, ChevronDown, Clock, Target, MessageSquare, ShoppingCart, BarChart3, Users, User, MapPin, Settings, Trophy, X, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


interface Props { salesId: string; }

export default function Homepage({ salesId }: Props) {
  const { sales, activities, prospek, customers, systemTargets } = useSalesData();
  const navigate = useNavigate();
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const salesInfo = sales.find(s => s.id === salesId);

  // Monthly filter for reset logic
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const monthlyActivities = activities.filter(a => a.id_sales === salesId && isCurrentMonth(a.timestamp));

  // Actual Performance Points Calculation (Resets monthly)
  const closingCount = monthlyActivities.filter(a => a.catatan_hasil.toLowerCase().includes('closing')).length;
  const maintenanceCount = monthlyActivities.filter(a => a.target_type === 'customer').length;
  const totalVisit = monthlyActivities.filter(a => a.tipe_aksi === 'Visit').length;
  const totalSO = monthlyActivities.filter(a => a.tipe_aksi === 'Order').length;
  const totalChatCall = monthlyActivities.filter(a => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length;

  // Prospek & Customer (Lifetime / Unreset)
  const totalProspek = prospek.filter(p => p.sales_owner === salesId).length;
  const totalCustomer = customers.filter(c => c.sales_pic === salesId).length;

  const overdueCustomers = customers.filter(c => c.sales_pic === salesId && (new Date().getTime() - new Date(c.last_order_date).getTime()) / 86400000 > 14).length;
  const overdueProspek = prospek.filter(p => p.sales_owner === salesId && (new Date().getTime() - new Date(p.created_at).getTime()) / 86400000 > 14).length;

  const uncontactedProspekCount = prospek.filter(p => 
    p.sales_owner === salesId && 
    !activities.some(act => act.target_id === p.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  const uncontactedCustomerCount = customers.filter(c => 
    c.sales_pic === salesId && 
    !activities.some(act => act.target_id === c.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  const totalActualPoints = 
    (totalVisit * (systemTargets?.b_visit ?? 5)) +
    (closingCount * (systemTargets?.b_closing ?? 15)) +
    (totalProspek * (systemTargets?.b_prospek ?? 5)) +
    (maintenanceCount * (systemTargets?.b_maint ?? 5)) +
    (totalSO * (systemTargets?.b_order ?? 20)) +
    (totalChatCall * (systemTargets?.b_chat ?? 5));

  // Recent Activities
  const recentActs = activities
    .filter(a => a.id_sales === salesId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  // Data Grafik (Last 7 Days) - Performed for specifically this Sales ID
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const count = activities.filter(act => 
      act.id_sales === salesId && 
      act.timestamp.split('T')[0] === date
    ).length;
    return {
      day: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count
    };
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 5);


  return (
    <div className="page-content" style={{ paddingBottom: '90px', background: 'var(--bg-deep)' }}>
      
      {/* Top Section - Premium Gradient Surface */}
      <div className="hero-gradient" style={{ padding: '32px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', filter: 'blur(30px)' }} />
        
        {/* Header - User & Icons */}
        <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 5, marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '22px', 
              background: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '26px', 
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
              border: '3px solid rgba(255,255,255,0.8)'
            }}>
              👤
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-1px' }}>{salesInfo?.nama || 'Sales'}</h2>
                 <ChevronRight size={18} color="rgba(17,24,39,0.3)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#111827', background: 'rgba(255,255,255,0.5)', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>{salesInfo?.armada || 'VAN'} FLEET</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857' }}>ONLINE</span>
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="tap-active" 
              onClick={() => navigate('/mobile/profile')}
              style={{ 
                width: '46px', height: '46px', borderRadius: '16px', 
                background: 'rgba(255,255,255,0.4)', border: '1.5px solid rgba(255,255,255,0.5)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Settings size={22} color="#111827" strokeWidth={2.5} />
            </button>
            <button 
              className="tap-active" 
              onClick={() => setNotificationsModalOpen(true)}
              style={{ 
                width: '46px', height: '46px', borderRadius: '16px', 
                background: 'rgba(255,255,255,0.4)', border: '1.5px solid rgba(255,255,255,0.5)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Bell size={22} color="#111827" strokeWidth={2.5} />
              <span style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', border: '2.5px solid #FFCC00', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}></span>
            </button>
          </div>
        </div>

        {/* Hero Score Display */}
        <div className="animate-fade-up" style={{ position: 'relative', zIndex: 5, animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '44px', fontWeight: 900, color: '#111827', letterSpacing: '-2px', margin: 0, lineHeight: 1 }}>
              {totalActualPoints.toLocaleString('id-ID')}
            </h1>
            <span style={{ fontSize: '44px', fontWeight: 900, color: '#111827', letterSpacing: '-2px', margin: 0, lineHeight: 1 }}>Poin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(17,24,39,0.1)', borderRadius: '12px', border: '1px solid rgba(17,24,39,0.05)' }}>
              <span style={{ fontSize: '13px', color: '#111827', opacity: 0.8, fontWeight: 800, letterSpacing: '0.05em' }}>PERFORMANCE SCORE</span>
              <ChevronDown size={14} strokeWidth={3} />
            </div>
            
            <div className="animate-pulse" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
              background: daysRemaining <= 5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.4)', 
              color: daysRemaining <= 5 ? '#DC2626' : '#92400E',
              borderRadius: '12px', border: `1px solid ${daysRemaining <= 5 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.5)'}`,
              boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap', backdropFilter: 'blur(5px)'
            }}>
              <Clock size={13} strokeWidth={3} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {daysRemaining === 0 ? 'Reset Besok!' : `Sisa ${daysRemaining} Hari`}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Glass Card */}
        <div className="glass-dark animate-fade-up shadow-premium" style={{ 
          borderRadius: '30px', padding: '28px 12px', 
          display: 'flex', justifyContent: 'space-between', 
          marginTop: '40px', position: 'relative', zIndex: 10,
          animationDelay: '0.2s'
        }}>
          {[
            { label: 'ORDERS', val: totalSO, color: '#fff', icon: ShoppingCart },
            { label: 'PROSPEK', val: totalProspek, color: '#fff', icon: Target },
            { label: 'CUST', val: totalCustomer, color: '#fff', icon: Users },
            { label: 'VISITS', val: totalVisit, color: '#fff', icon: MapPin }
          ].map((item, idx) => (
            <div key={item.label} style={{ 
              textAlign: 'center', flex: 1, 
              borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.12)' : 'none',
              padding: '0 4px', display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{ 
                fontSize: '22px', fontWeight: 950, marginBottom: '6px', color: item.color, 
                letterSpacing: '-0.5px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {item.val.toLocaleString('id-ID')}
              </div>
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Body - Bottom Sheet Style */}
      <div style={{ 
        background: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
        marginTop: '-32px', paddingTop: '36px', position: 'relative', zIndex: 10, 
        paddingBottom: '32px', borderTop: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.03)'
      }}>
        
        {/* Service Grid Section */}
        <div style={{ padding: '0 24px' }}>
          <div className="animate-fade-up shadow-premium" style={{ 
            background: '#F8FAF9', borderRadius: '36px', padding: '28px 20px', 
            border: '1px solid #f1f5f9', animationDelay: '0.3s'
          }}>
            <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '28px', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}>Main Services</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '28px 4px' }}>
              
              {[
                { label: 'Customer', icon: Users, color: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)', shadow: 'rgba(99, 102, 241, 0.4)', path: '/mobile/customer' },
                { label: 'Prospek', icon: Target, color: 'linear-gradient(135deg, #fdba74 0%, #f97316 100%)', shadow: 'rgba(249, 115, 22, 0.4)', path: '/mobile/prospek' },
                { label: 'Analytic', icon: BarChart3, color: 'linear-gradient(135deg, #d8b4fe 0%, #a855f7 100%)', shadow: 'rgba(168, 85, 247, 0.4)', path: '/mobile/analytic' },
                { label: 'Chat', icon: MessageSquare, color: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)', shadow: 'rgba(16, 185, 129, 0.4)', path: '/mobile/chat' },
                { label: 'Order', icon: ShoppingCart, color: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)', shadow: 'rgba(79, 70, 229, 0.4)', path: '/mobile/customer' },
                { label: 'Activity', icon: MapPin, color: 'linear-gradient(135deg, #fde047 0%, #eab308 100%)', shadow: 'rgba(234, 179, 8, 0.4)', path: '/mobile/checkin' },
                { label: 'Rank', icon: Trophy, color: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', shadow: 'rgba(217, 119, 6, 0.4)', path: '/mobile/rank' }
              ].map((item) => {
                let badgeCount = 0;
                if (item.label === 'Chat') badgeCount = 3; // Mock unread chat badge
                if (item.label === 'Customer') badgeCount = uncontactedCustomerCount;
                if (item.label === 'Prospek') badgeCount = uncontactedProspekCount;

                return (
                  <div key={item.label} 
                    className="tap-active" 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
                    onClick={() => item.path.includes('://') ? window.open(item.path, '_blank') : navigate(item.path)}
                  >
                    <div style={{ 
                      width: '56px', height: '56px', borderRadius: '24px', 
                      background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      marginBottom: '12px', boxShadow: `0 10px 20px -6px ${item.shadow}`, border: '3px solid #fff',
                      position: 'relative'
                    }}>
                      <item.icon size={26} color="#fff" strokeWidth={2.5} />
                      
                      {badgeCount > 0 && (
                        <div className="animate-pulse" style={{ 
                          position: 'absolute', top: '-6px', right: '-6px', background: '#EF4444', color: '#fff', 
                          fontSize: '11px', fontWeight: 900, minWidth: '22px', height: '22px', padding: '0 6px',
                          borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          border: '2.5px solid #fff', boxShadow: '0 4px 8px rgba(239, 68, 68, 0.4)' 
                        }}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trend Section */}
        <div className="animate-fade-up" style={{ padding: '0 24px', marginTop: '40px', animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#111827', margin: 0, letterSpacing: '-0.8px' }}>Performance Trend</h3>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Live activity (last 7 days)</p>
            </div>
            <div style={{ 
              background: '#E0F2FE', color: '#0369A1', padding: '6px 12px', 
              borderRadius: '10px', fontSize: '12px', fontWeight: 800, border: '1px solid #BAE6FD' 
            }}>
              +12.5%
            </div>
          </div>
          
          <div className="shadow-premium" style={{ 
            background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)', borderRadius: '30px', padding: '24px 16px 12px', 
            border: '1px solid rgba(0,0,0,0.03)', height: '230px', position: 'relative', overflow: 'hidden'
          }}>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide={true} domain={[0, maxCount + 2]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 800, background: '#111827', color: '#fff' }}
                    itemStyle={{ color: 'var(--brand-yellow)' }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '6 6' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" animationDuration={2000} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Urgent Announcements */}
        <div className="animate-fade-up" style={{ padding: '0 24px', marginTop: '32px', animationDelay: '0.45s' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#111827', letterSpacing: '-0.8px', marginBottom: '16px' }}>Pengumuman Penting</h3>
          
          <div className="tap-active" onClick={() => navigate('/mobile/customer')} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '24px', padding: '16px', border: '1px solid #f1f5f9', gap: '16px', marginBottom: '14px', boxShadow: '0 8px 25px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={32} color="#EF4444" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', marginBottom: '4px', letterSpacing: '-0.2px', lineHeight: 1.2 }}>Customer Non-Aktif</h4>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>Batas order lewat 14 hari</p>
            </div>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '4px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <span style={{ fontSize: '16px', fontWeight: 900, color: '#EF4444' }}>{overdueCustomers}</span>
            </div>
          </div>

          <div className="tap-active" onClick={() => navigate('/mobile/prospek')} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '24px', padding: '16px', border: '1px solid #f1f5f9', gap: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Target size={32} color="#F97316" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', marginBottom: '4px', letterSpacing: '-0.2px', lineHeight: 1.2 }}>Prospek Outstanding</h4>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>Terlantar lebih dari 14 hari</p>
            </div>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '4px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <span style={{ fontSize: '16px', fontWeight: 900, color: '#F97316' }}>{overdueProspek}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="animate-fade-up" style={{ padding: '0 24px', marginTop: '40px', marginBottom: '24px', animationDelay: '0.5s' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#111827', letterSpacing: '-0.8px', marginBottom: '24px' }}>Recent Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {recentActs.map(act => (
              <div key={act.id} style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="shadow-md" style={{ width: '44px', height: '44px', borderRadius: '16px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #F1F5F9' }}>
                    <Clock size={18} color="#64748b" strokeWidth={2.5} />
                  </div>
                  <div style={{ width: '3px', flex: 1, background: 'linear-gradient(to bottom, #F1F5F9 0%, transparent 100%)', marginTop: '4px', borderRadius: '3px' }}></div>
                </div>
                <div style={{ flex: 1, paddingBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827', letterSpacing: '-0.3px' }}>{act.tipe_aksi}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, background: '#F8FAFC', padding: '2px 8px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                      {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true, locale: enUS })}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', lineHeight: '1.6', fontWeight: 600 }}>{act.catatan_hasil}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#0369a1', background: '#E0F2FE', padding: '4px 10px', borderRadius: '8px', border: '1px solid #BAE6FD', textTransform: 'uppercase' }}>Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Notifications Drawer */}
      {notificationsModalOpen && (
        <div className="modal-overlay" onClick={() => setNotificationsModalOpen(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px 20px 48px', background: '#fff', border: 'none' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#111827', margin: 0, letterSpacing: '-1px' }}>Notifikasi</h3>
              <button 
                onClick={() => setNotificationsModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: 'Update Sistem', desc: 'Versi 2.5 telah aktif! Nikmati fitur filter baru di menu Customer dan Prospek.', time: '2h ago', icon: Settings, color: '#6366f1' },
                { title: 'Pesan Manager', desc: 'Tolong prioritaskan kunjungan ke wilayah Sepaku hari ini untuk mengejar target mingguan.', time: '5h ago', icon: User, color: '#f59e0b' },
                { title: 'Target Tercapai', desc: 'Selamat! Kamu telah mencapai 80% dari target poin bulan ini. Tetap semangat!', time: 'Yesterday', icon: Trophy, color: '#ec4899' }
              ].map((notif, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '20px', background: '#F8FAFC', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${notif.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <notif.icon size={22} color={notif.color} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>{notif.title}</h4>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{notif.time}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, margin: 0, lineHeight: '1.5' }}>{notif.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="tap-active"
              onClick={() => setNotificationsModalOpen(false)}
              style={{ width: '100%', marginTop: '32px', padding: '18px', borderRadius: '18px', background: 'var(--brand-yellow)', border: 'none', color: '#111827', fontSize: '15px', fontWeight: 900, boxShadow: '0 10px 20px rgba(255, 204, 0, 0.2)' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
