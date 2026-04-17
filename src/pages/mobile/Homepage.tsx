import { useState } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Clock, Target, MessageSquare, ShoppingCart, BarChart3, Users, User, MapPin, Trophy, X, AlertTriangle, Search, Loader2, CheckCircle } from 'lucide-react';
import { store } from '../../store/dataStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateSalesPoints } from '../../utils/points';


interface Props { salesId: string; }

export default function Homepage({ salesId }: Props) {
  const { user } = useAuth();
  const { activities = [], prospek = [], customers = [], sales = [], systemTargets = null } = useSalesData() || {};
  const currentSales = sales.find(s => s.id === salesId) || (user as any);
  const salesName = user?.nama || currentSales?.nama;
  const salesDisplayName = salesName?.split(' ')[0] || 'Sales';
  const navigate = useNavigate();
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<any>(null); // To be replaced by Customer after import check
  const [orderSearch, setOrderSearch] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  

  // Monthly filter for reset logic
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));


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

  const { totalActual: totalActualPoints, breakdown } = calculateSalesPoints(
    salesId,
    activities,
    prospek,
    systemTargets,
    'month'
  );

  const { order: totalSO, visitProspek: totalVisit } = breakdown;

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

  const handleQuickOrder = async () => {
    if (!selectedCust) return;
    setIsSubmittingOrder(true);
    try {
      await store.logOrder(salesId, selectedCust.id, selectedCust.nama_toko, salesName);
      setOrderSuccess(true);
      
      // Pure Direct Launcher Intent
      window.location.href = 'intent:#Intent;package=com.cpssoft.mobile.alpha;end';

      setTimeout(() => {
        setOrderModalOpen(false);
        setOrderSuccess(false);
        setSelectedCust(null);
        setOrderSearch('');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const myCustomers = customers.filter(c => c.sales_pic === salesId);
  const filteredCustomers = myCustomers.filter(c => 
    c.nama_toko.toLowerCase().includes(orderSearch.toLowerCase()) ||
    c.area.toLowerCase().includes(orderSearch.toLowerCase())
  );




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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div 
                className="tap-active"
                onClick={() => navigate('/mobile/profile')}
                style={{ 
                  width: '52px', height: '52px', borderRadius: '16px', 
                  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '2px solid #fff',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={(user as any)?.foto_profil || currentSales?.foto_profil || `https://ui-avatars.com/api/?name=${user?.nama || 'Sales'}&background=f1f5f9&color=64748b&bold=true`} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ fontSize: '10px', color: '#111827', fontWeight: 800, opacity: 0.6, letterSpacing: '0.05em' }}>ONLINE</span>
                 </div>
                 <h2 style={{ fontSize: '20px', fontWeight: 950, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
                   Halo, {salesDisplayName}!
                 </h2>
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
              { label: 'Activity', icon: MapPin, color: '#FFD700', bg: '#FFFBEB', path: '/mobile/activity' },
              { label: 'Prospek', icon: Target, color: '#F97316', bg: '#FFF7ED', path: '/mobile/prospek', badge: uncontactedProspekCount },
              { label: 'Customer', icon: Users, color: '#D97706', bg: '#FEF3C7', path: '/mobile/customer', badge: uncontactedCustomerCount },
              { label: 'Analytic', icon: BarChart3, color: '#a855f7', bg: '#FAF5FF', path: '/mobile/analytic' },
              { label: 'Chat', icon: MessageSquare, color: '#10b981', bg: '#ECFDF5', path: '/mobile/chat', badge: 0 },
              { label: 'Ranking', icon: Trophy, color: '#f59e0b', bg: '#FFFBEB', path: '/mobile/rank' },
              { label: 'Order', icon: ShoppingCart, color: '#ef4444', bg: '#FEF2F2', path: '/mobile/customer' },
              { label: 'Profile', icon: User, color: '#64748b', bg: '#F8FAFC', path: '/mobile/profile' },
            ].map((item) => (
              <div key={item.label} 
                className="tap-active" 
                onClick={() => {
                  if (item.label === 'Order') {
                    setOrderModalOpen(true);
                  } else {
                    navigate(item.path);
                  }
                }}
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

        {/* Dynamic Stats Grid - 2x2 (Premium Business Metrics with Vibrancy) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
          {/* Total Orders (Monthly Reset) - Royal Gold */}
          <div className="shadow-premium tap-active" 
            style={{ 
              background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', 
              borderRadius: '24px', padding: '18px 16px', color: '#111827',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <ShoppingCart size={14} color="#111827" strokeWidth={3} />
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#111827', opacity: 0.7, letterSpacing: '0.1em' }}>ORDERS (MO)</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '26px', fontWeight: 950, letterSpacing: '-0.5px' }}>{totalSO}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8 }}>Items</span>
             </div>
          </div>

          {/* Total Visits (Monthly Reset) - Emerald Glow */}
          <div className="shadow-premium tap-active" 
            style={{ 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
              borderRadius: '24px', padding: '18px 16px', color: '#fff',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <MapPin size={14} color="#fff" strokeWidth={3} />
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#fff', opacity: 0.8, letterSpacing: '0.1em' }}>VISITS (MO)</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '26px', fontWeight: 950, letterSpacing: '-0.5px' }}>{totalVisit}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8 }}>Sites</span>
             </div>
          </div>

          {/* Total Customers (Lifetime) - Indigo Nebula */}
          <div className="shadow-premium tap-active" 
            style={{ 
              background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)', 
              borderRadius: '24px', padding: '18px 16px', color: '#111827',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Users size={14} color="#fff" strokeWidth={3} />
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#fff', opacity: 0.8, letterSpacing: '0.1em' }}>CUSTOMER</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '26px', fontWeight: 950, letterSpacing: '-0.5px' }}>{totalCustomer}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8 }}>Stall</span>
             </div>
          </div>

          {/* Total Prospects (Lifetime) - Vibrant Sunset */}
          <div className="shadow-premium tap-active" 
            style={{ 
              background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)', 
              borderRadius: '24px', padding: '18px 16px', color: '#fff',
              boxShadow: '0 10px 25px rgba(244, 63, 94, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Target size={14} color="#fff" strokeWidth={3} />
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#fff', opacity: 0.8, letterSpacing: '0.1em' }}>PROSPEK</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '26px', fontWeight: 950, letterSpacing: '-0.5px' }}>{totalProspek}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8 }}>Leads</span>
             </div>
          </div>
        </div>

        {/* Urgent Alerts - Sleek Version */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#111827', letterSpacing: '-0.5px' }}>Butuh Perhatian</h3>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1' }}>Lihat Semua</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
             {/* Alert 1: Overdue Customers */}
             {overdueCustomers > 0 && (
               <div className="tap-active shadow-premium" onClick={() => navigate('/mobile/customer')} style={{ minWidth: '260px', background: '#fff', borderRadius: '24px', padding: '16px', border: '1px solid #fee2e2', display: 'flex', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <AlertTriangle size={24} color="#EF4444" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ fontSize: '14px', fontWeight: 950, color: '#111827', margin: 0 }}>Warning Customer</h4>
                     <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>{overdueCustomers} Toko belum order {'>'}14 hari</p>
                  </div>
               </div>
             )}

             {/* Alert 2: Overdue Prospects */}
             {overdueProspek > 0 && (
               <div className="tap-active shadow-premium" onClick={() => navigate('/mobile/prospek')} style={{ minWidth: '260px', background: '#fff', borderRadius: '24px', padding: '16px', border: '1px solid #ffedd5', display: 'flex', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Target size={24} color="#F97316" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ fontSize: '14px', fontWeight: 950, color: '#111827', margin: 0 }}>Warning Prospek</h4>
                     <p style={{ fontSize: '11px', color: '#f97316', fontWeight: 700, marginTop: '2px' }}>{overdueProspek} Butuh kunjungan ulang</p>
                  </div>
               </div>
             )}

             {/* Default Info if no alerts */}
             {overdueCustomers === 0 && overdueProspek === 0 && (
                <div style={{ minWidth: '100%', background: '#F0FDF4', borderRadius: '24px', padding: '16px', border: '1px solid #BBF7D0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <CheckCircle size={20} color="#10B981" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>Semua target aman! Terus tingkatkan performa.</span>
                </div>
             )}
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
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>🔔 Notifikasi</h3>
              <button className="tap-active" onClick={() => setNotificationsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800 }}>Update Sistem</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Fitur Quick Order kini tersedia langsung di Beranda!</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Order Drawer - Ergonomic 110px Padding */}
      {orderModalOpen && (
        <div className="modal-overlay" onClick={() => setOrderModalOpen(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ 
            maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
            padding: '24px 20px calc(110px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' 
          }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#FEE2E2', color: '#EF4444', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={20} strokeWidth={3} />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#111827', letterSpacing: '-0.5px' }}>Quick Order</h3>
              </div>
              <button className="tap-active" onClick={() => setOrderModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Customer Search Section */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Cari Nama Customer..." 
                  style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px 14px 14px 48px', fontWeight: 700, fontSize: '15px' }}
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                />
              </div>

              {/* Customer List Selection */}
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(c => (
                    <div 
                      key={c.id} 
                      className="tap-active"
                      onClick={() => setSelectedCust(c)}
                      style={{ 
                        padding: '14px 16px', borderRadius: '18px', border: '2px solid',
                        borderColor: selectedCust?.id === c.id ? 'var(--brand-yellow)' : '#f8fafc',
                        background: selectedCust?.id === c.id ? '#FFFBEB' : '#F8FAFC',
                        display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>🏢</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{c.nama_toko}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{c.area} • {c.kategori}</div>
                      </div>
                      {selectedCust?.id === c.id && <CheckCircle size={20} color="#059669" />}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <div style={{ fontSize: '12px', fontWeight: 800 }}>Customer Tidak Ditemukan</div>
                  </div>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <div style={{ marginTop: '20px' }}>
                <button 
                  className="tap-active" 
                  disabled={!selectedCust || isSubmittingOrder}
                  onClick={handleQuickOrder}
                  style={{ 
                    width: '100%', height: '62px', borderRadius: '18px', fontSize: '16px', fontWeight: 950,
                    background: isSubmittingOrder ? '#e2e8f0' : orderSuccess ? '#10b981' : 'var(--brand-yellow)',
                    color: orderSuccess ? '#fff' : '#111827', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 12px 24px rgba(255, 204, 0, 0.3)', transition: 'all 0.3s'
                  }}
                >
                  {isSubmittingOrder ? <Loader2 className="animate-spin" size={24} /> : orderSuccess ? <><CheckCircle size={24} /> Order Berhasil!</> : 'Konfirmasi & Kirim Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Version info footer */}
      <div style={{ 
        padding: '24px 20px 48px', 
        textAlign: 'center', 
        fontSize: '11px', 
        fontWeight: 800, 
        color: '#CBD5E1', 
        letterSpacing: '1px' 
      }}>
        vDeploy 1.0.24.0417
      </div>
    </div>
  );
}
