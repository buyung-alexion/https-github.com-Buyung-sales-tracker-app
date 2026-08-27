import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Target, MessageSquare, ShoppingCart, BarChart3, Users, Trophy, Menu, Clock } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../brand-style.css'; // Sesuaikan lokasi import jika disatukan ke wallet-style.css

interface Props { salesId: string; setSidebarOpen?: (open: boolean) => void; }

export default function HomepageV3({ salesId, setSidebarOpen }: Props) {
  const { user } = useAuth();
  const { activities = [], prospek = [], customers = [], sales = [], orders = [] } = useSalesData() || {};
  const currentSales = sales.find(s => s.id === salesId) || (user as any);
  const navigate = useNavigate();

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter current month activities
  const thisMonthActivities = activities.filter(a => 
    a.id_sales === salesId && new Date(a.timestamp) >= currentMonthStart
  );

  // Filter current month orders
  const thisMonthOrders = orders.filter(o => 
    o.sales_id === salesId && new Date(o.created_at) >= currentMonthStart
  );

  // Calculate Points
  let currentMonthPoints = 0;
  thisMonthActivities.forEach(a => {
    if (a.tipe_aksi === 'Visit') currentMonthPoints += 10;
    else if (a.tipe_aksi === 'Call') currentMonthPoints += 5;
    else if (a.tipe_aksi === 'WA') currentMonthPoints += 2;
  });
  thisMonthOrders.forEach(() => {
    currentMonthPoints += 50;
  });

  // Calculate Sales Performance
      
  // Calculate Activity Performance
      
    // Calculate Chart Data for all sales
  const chartData = sales.map(s => {
    const sActs = activities.filter(a => a.id_sales === s.id && new Date(a.timestamp) >= currentMonthStart);
    const sOrders = orders.filter(o => o.sales_id === s.id && new Date(o.created_at) >= currentMonthStart);
    return {
      name: s.nama.split(' ')[0], // First name
      Visit: sActs.filter(a => a.tipe_aksi === 'Visit').length,
      Order: sOrders.length,
      Closing: sOrders.length // Sync with order count for now
    };
  });

  const recentActs = activities
    .filter(a => a.id_sales === salesId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const uncontactedProspekCount = prospek.filter(p => 
    p.sales_owner === salesId && 
    !activities.some(act => act.target_id === p.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  const uncontactedCustomerCount = customers.filter(c => 
    c.sales_pic === salesId && 
    !activities.some(act => act.target_id === c.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  return (
    <div className="brand-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div className="brand-hero">
        <div className="brand-hero-top">
          <div className="brand-search-bar" onClick={() => navigate('/mobile/prospek')} style={{ cursor: 'pointer' }}>
            <Search size={18} color="var(--brand-text-gray)" />
            <input type="text" placeholder="Cari pelanggan, prospek..." readOnly style={{ cursor: 'pointer' }} />
          </div>
          <div className="brand-avatar" onClick={() => setSidebarOpen?.(true)}>
            <img 
              src={(user as any)?.foto_profil || currentSales?.foto_profil || `https://ui-avatars.com/api/?name=${user?.nama || 'Sales'}&background=f1f5f9&color=64748b&bold=true`} 
              alt="Profile" 
            />
          </div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="brand-wallet-card">
        <div className="brand-wallet-header">
          <div>
            <div className="brand-wallet-balance-title">
              <span style={{ width: '18px', height: '18px', background: 'var(--brand-primary)', borderRadius: '4px', display: 'inline-block' }}></span>
              Poin Bulan Ini
            </div>
            <div className="brand-wallet-balance-amount" style={{ marginTop: '4px' }}>
              {(currentMonthPoints).toLocaleString('id-ID')} <span style={{ fontSize: '14px', color: 'var(--brand-text-gray)' }}>pts</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Status Sales</div>
            <div style={{ background: '#F0FDF4', color: '#16A34A', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>Aktif</div>
          </div>
        </div>
        
        <div className="brand-wallet-actions">
          <button className="brand-wallet-action-btn" onClick={() => navigate('/mobile/analytic')}>
            <div className="brand-wallet-action-icon"><BarChart3 size={18} /></div>
            <span className="brand-wallet-action-label">Analisis</span>
          </button>
          
          <button className="brand-wallet-action-btn" onClick={() => navigate('/mobile/rank')}>
            <div className="brand-wallet-action-icon"><Trophy size={20} strokeWidth={2.5} /></div>
            <span className="brand-wallet-action-label">Ranking</span>
          </button>
        </div>
      </div>

      {/* Service Icons Grid (No Market) */}
      <div className="brand-services-grid">
        {[
          { label: 'Order', icon: ShoppingCart, bg: 'service-color-1', path: '/mobile/order-history' },
          { label: 'Activity', icon: MapPin, bg: 'service-color-2', path: '/mobile/activity' },
          { label: 'Chat', icon: MessageSquare, bg: 'service-color-3', path: '/mobile/chat' },
          { label: 'Laporan', icon: BarChart3, bg: 'service-color-4', path: '/mobile/analytic' },
          { label: 'Customer', icon: Users, bg: 'service-color-5', path: '/mobile/customer', badge: uncontactedCustomerCount },
          { label: 'Prospek', icon: Target, bg: 'service-color-6', path: '/mobile/prospek', badge: uncontactedProspekCount },
          { label: 'Ranking', icon: Trophy, bg: 'service-color-7', path: '/mobile/rank' },
          { label: 'Lainnya', icon: Menu, bg: '', path: '', isGray: true, action: () => setSidebarOpen?.(true) },
        ].map((item, idx) => (
          <div key={idx} className="brand-service-item" onClick={() => item.path ? navigate(item.path) : item.action?.()} style={{ cursor: 'pointer' }}>
            <div className={`brand-service-circle ${item.bg}`} style={{ background: item.isGray ? '#E8E8E8' : '', color: item.isGray ? 'var(--brand-text-dark)' : '#fff' }}>
              <item.icon size={26} strokeWidth={2} />
              {item.badge !== undefined && item.badge > 0 && (
                <div className="brand-badge">{item.badge}</div>
              )}
            </div>
            <span className="brand-service-label">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Promo Banner */}
      <div className="brand-promo-section">
        <div onClick={() => navigate('/mobile/prospek')} style={{ background: '#fff', borderRadius: '24px', padding: '24px', color: 'var(--brand-text-dark)', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '1px solid #E8E8E8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}>Siap capai target?</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--brand-text-gray)', lineHeight: 1.5, maxWidth: '80%', fontWeight: 600 }}>Cek prospek baru yang belum dihubungi hari ini.</p>
          </div>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', color: 'var(--brand-primary)', opacity: 0.2 }}>
            <Target size={120} />
          </div>
        </div>
      </div>

      {/* Grafik Aktivitas Sales */}
      <div style={{ padding: '0 20px 24px' }}>
        <h3 className="brand-feed-title" style={{ marginBottom: '16px', textAlign: 'center' }}>Grafik Aktivitas Sales</h3>
        <div style={{ fontSize: '12px', color: '#727272', textAlign: 'center', marginBottom: '16px' }}>Periode: Bulan Ini</div>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '20px 10px 10px 0', border: '1px solid #E8E8E8', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#f5f5f5" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" scale="band" tick={{ fontSize: 10, fill: '#727272' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#727272' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
              <Bar dataKey="Order" fill="#2563EB" barSize={15} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Visit" fill="#00AA13" barSize={15} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Closing" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feed (Recent Activities) */}
      <div className="brand-feed-section">
        <h3 className="brand-feed-title">Aktivitas Terakhir</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recentActs.map(act => (
            <div key={act.id} className="brand-feed-card">
              <div className="brand-feed-icon">
                <Clock size={20} color="#64748b" />
              </div>
              <div className="brand-feed-content">
                <div className="brand-feed-header">
                  <span className="brand-feed-title-text">{act.tipe_aksi}</span>
                  <span className="brand-feed-time">
                    {act.timestamp ? (() => {
                      try { return formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }); }
                      catch(e) { return 'Baru saja'; }
                    })() : 'Baru saja'}
                  </span>
                </div>
                <p className="brand-feed-subtitle">
                  {act.catatan_hasil.length > 50 ? act.catatan_hasil.substring(0, 50) + '...' : act.catatan_hasil}
                </p>
              </div>
            </div>
          ))}
          {recentActs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Belum ada aktivitas tercatat.</div>
          )}
        </div>
      </div>
    </div>
  );
}

