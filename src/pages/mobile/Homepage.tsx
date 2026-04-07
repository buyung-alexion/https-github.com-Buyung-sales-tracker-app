import { useState } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Clock, Target, MessageSquare, ShoppingCart, BarChart3, Users, User, MapPin, Trophy, X, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


interface Props { salesId: string; }

export default function Homepage({ salesId }: Props) {
  const { activities = [], prospek = [], customers = [], systemTargets = null } = useSalesData() || {};
  const navigate = useNavigate();
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

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
  // totalCustomer filtered here for component use below if needed, but we use customers.filter(c => c.sales_pic === salesId).length directly usually.
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
    (totalChatCall * (systemTargets?.b_chat ?? 5)) || 0;

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
    <div className="page-content" style={{ paddingBottom: '100px', background: '#F8FAFC', paddingTop: 0 }}>
      
      {/* Top Section - Compact GrabFood Style Header */}
      <div className="hero-compact" style={{ 
        padding: 'calc(16px + env(safe-area-inset-top)) 20px 48px', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'var(--brand-yellow)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        {/* Subtle Decoration */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', filter: 'blur(40px)' }} />
        
        <div style={{ position: 'relative', zIndex: 5, paddingBottom: '16px' }}>
          {/* Top Bar - Identity & Icons - Compact Premium */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div 
                className="tap-active"
                onClick={() => navigate('/mobile/profile')}
                style={{ 
                  width: '40px', height: '40px', borderRadius: '12px', 
                  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '18px', boxShadow: '0 6px 12px rgba(0,0,0,0.06)', border: '2px solid rgba(255,255,255,0.8)'
                }}
              >
                👤
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
                  Halo Sales 👋
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <span style={{ fontSize: '9px', color: '#047857', fontWeight: 900 }}>• ONLINE</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="tap-active" 
                onClick={() => setNotificationsModalOpen(true)}
                style={{ 
                  width: '38px', height: '38px', borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.4)', border: 'none', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                }}
              >
                <Bell size={18} color="#111827" strokeWidth={2.5} />
                <span style={{ position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', background: '#EF4444', borderRadius: '50%', border: '2px solid #FFCC00' }}></span>
              </button>
            </div>
          </div>

          {/* Quick Score Card - Compact Premium Version */}
          <div className="glass-dark" style={{ borderRadius: '24px', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>POIN BULAN INI</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '32px', fontWeight: 950, color: '#fff', letterSpacing: '-1.2px' }}>{totalActualPoints.toLocaleString('id-ID')}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-yellow)' }}>Poin</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div className="animate-pulse" style={{ background: daysRemaining <= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: daysRemaining <= 5 ? '#FCA5A5' : '#fff', padding: '5px 10px', borderRadius: '10px', fontSize: '9px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>{daysRemaining === 0 ? 'RESET BESOK' : `SISA ${daysRemaining} HARI`}</div>
               <div className="tap-active" onClick={() => navigate('/mobile/analytic')} style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', color: 'var(--brand-yellow)', fontSize: '10px', fontWeight: 800 }}>Lihat Detail <ChevronRight size={12} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        marginTop: '-24px', position: 'relative', zIndex: 10,
        padding: '0 16px'
      }}>
        
        {/* Service Grid - 4 Column Padat (Grab Style) */}
        <div className="shadow-premium" style={{ 
          background: '#fff', borderRadius: '28px', padding: '24px 12px 20px',
          border: '1px solid rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 8px' }}>
            {[
              { label: 'Check-In', icon: MapPin, color: '#FFD700', bg: '#FFFBEB', path: '/mobile/checkin' },
              { label: 'Prospek', icon: Target, color: '#F97316', bg: '#FFF7ED', path: '/mobile/prospek', badge: uncontactedProspekCount },
              { label: 'Customer', icon: Users, color: '#6366f1', bg: '#EEF2FF', path: '/mobile/customer', badge: uncontactedCustomerCount },
              { label: 'Analytic', icon: BarChart3, color: '#a855f7', bg: '#FAF5FF', path: '/mobile/analytic' },
              { label: 'Chat', icon: MessageSquare, color: '#10b981', bg: '#ECFDF5', path: '/mobile/chat', badge: 0 },
              { label: 'Ranking', icon: Trophy, color: '#f59e0b', bg: '#FFFBEB', path: '/mobile/rank' },
              { label: 'Order', icon: ShoppingCart, color: '#ef4444', bg: '#FEF2F2', path: '/mobile/customer' },
              { label: 'Profile', icon: User, color: '#64748b', bg: '#F8FAFC', path: '/mobile/profile' },
            ].map((item) => (
              <div key={item.label} 
                className="tap-active" 
                onClick={() => navigate(item.path)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <div style={{ 
                  width: '52px', height: '52px', borderRadius: '18px', 
                  background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', border: '1px solid rgba(0,0,0,0.02)'
                }}>
                  <item.icon size={24} color={item.color} strokeWidth={2.5} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <div style={{ 
                      position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#fff', 
                      fontSize: '10px', fontWeight: 900, minWidth: '18px', height: '18px', borderRadius: '9px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff'
                    }}>
                      {item.badge}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Stats Row */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <div className="shadow-premium" style={{ flex: 1, background: '#111827', borderRadius: '24px', padding: '20px', color: '#fff' }}>
             <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>TOTAL ORDERS</span>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: 950, color: 'var(--brand-yellow)' }}>{totalSO}</span>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>Items</span>
             </div>
          </div>
          <div className="shadow-premium" style={{ flex: 1, background: '#fff', borderRadius: '24px', padding: '20px', border: '1px solid #f1f5f9' }}>
             <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>TOTAL VISITS</span>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: 950, color: '#111827' }}>{totalVisit}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>Sites</span>
             </div>
          </div>
        </div>

        {/* Urgent Alerts - Sleek Version */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#111827', letterSpacing: '-0.5px' }}>Butuh Perhatian</h3>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1' }}>Lihat Semua</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
             {/* Alert 1 */}
             <div className="tap-active shadow-premium" onClick={() => navigate('/mobile/customer')} style={{ minWidth: '240px', background: '#fff', borderRadius: '24px', padding: '16px', border: '1px solid #fee2e2', display: 'flex', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <AlertTriangle size={24} color="#EF4444" />
                </div>
                <div>
                   <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', margin: 0 }}>Customer Non-Aktif</h4>
                   <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>{overdueCustomers} Belum order {'>'}14 hari</p>
                </div>
             </div>
             {/* Alert 2 */}
             <div className="tap-active shadow-premium" onClick={() => navigate('/mobile/prospek')} style={{ minWidth: '240px', background: '#fff', borderRadius: '24px', padding: '16px', border: '1px solid #ffedd5', display: 'flex', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Target size={24} color="#F97316" />
                </div>
                <div>
                   <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', margin: 0 }}>Prospek Terlantar</h4>
                   <p style={{ fontSize: '11px', color: '#f97316', fontWeight: 700, marginTop: '2px' }}>{overdueProspek} Membutuhkan follow-up</p>
                </div>
             </div>
          </div>
        </div>

        {/* Activity Chart Area */}
        <div style={{ marginTop: '32px' }}>
           <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#111827', letterSpacing: '-0.5px', marginBottom: '16px' }}>Tren Performa</h3>
           <div className="shadow-premium" style={{ background: '#fff', borderRadius: '28px', padding: '24px 16px 12px', height: '220px', border: '1px solid #f1f5f9' }}>
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFCC00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FFCC00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                    <YAxis hide={true} domain={[0, maxCount + 2]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 800 }} />
                    <Area type="monotone" dataKey="count" stroke="#FFCC00" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Logs List */}
        <div style={{ marginTop: '32px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#111827', letterSpacing: '-0.5px' }}>Log Aktivitas</h3>
             <ChevronRight size={20} color="#94a3b8" />
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {recentActs.map(act => (
               <div key={act.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Clock size={18} color="#64748b" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{act.tipe_aksi}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                          {act.timestamp ? (() => {
                            try { return formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }); }
                            catch(e) { return 'Baru saja'; }
                          })() : 'Baru saja'}
                        </span>
                     </div>
                     <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, margin: '2px 0 0' }}>{act.catatan_hasil.length > 40 ? act.catatan_hasil.substring(0, 40) + '...' : act.catatan_hasil}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Notifications Drawer (Simplified) */}
      {notificationsModalOpen && (
        <div className="modal-overlay" onClick={() => setNotificationsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Notifikasi</h3>
              <X size={24} color="#64748b" onClick={() => setNotificationsModalOpen(false)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800 }}>Update Sistem</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Fitur GrabFood aesthetic baru telah diaktifkan!</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
