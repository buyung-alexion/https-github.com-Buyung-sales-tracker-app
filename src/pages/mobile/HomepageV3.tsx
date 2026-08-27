// @ts-nocheck
import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageSquare, BarChart3, Users, Target, Clock, Trophy, Menu, ChevronLeft, ChevronRight, Timer, ShoppingCart } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../../brand-style.css'; // Sesuaikan lokasi import jika disatukan ke wallet-style.css

interface Props { salesId: string; setSidebarOpen?: (open: boolean) => void; }

export default function HomepageV3({ salesId, setSidebarOpen }: Props) {
  const { user } = useAuth();
  const { activities = [], prospek = [], customers = [], sales = [], orders = [] } = useSalesData() || {};
  const currentSales = sales.find(s => s.id === salesId) || (user as any);
  
  const navigate = useNavigate();

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.max(0, endOfMonth.getDate() - now.getDate());

  const thisMonthActivities = activities.filter(a => 
    a.id_sales === salesId && new Date(a.timestamp) >= currentMonthStart
  );
  const thisMonthOrders = orders.filter(o => 
    o.sales_id === salesId && new Date(o.created_at) >= currentMonthStart
  );

  let currentMonthPoints = 0;
  thisMonthActivities.forEach(a => {
    if (a.tipe_aksi === 'Visit') currentMonthPoints += 10;
    else if (a.tipe_aksi === 'Call') currentMonthPoints += 5;
    else if (a.tipe_aksi === 'WA') currentMonthPoints += 2;
  });
  thisMonthOrders.forEach(() => {
    currentMonthPoints += 50;
  });

  const totalSalesKg = thisMonthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const salesTargetKg = currentSales?.target_penjualan || 50000;
  const salesAchievedPct = Math.min(100, (totalSalesKg / salesTargetKg) * 100);

  const pointsTarget = 2000;
  const pointsAchievedPct = Math.min(100, (currentMonthPoints / pointsTarget) * 100);

  const myProspek = prospek.filter(p => p.sales_owner === salesId).length;
  const myCustomers = customers.filter(c => c.sales_pic === salesId).length;
  const myOrderan = thisMonthOrders.length;
  const uncontactedCustomerCount = customers.filter(c => c.sales_pic === salesId).filter(c => {
    const act = activities.find(a => a.target_id === c.id);
    return !act;
  }).length;
  const uncontactedProspekCount = prospek.filter(p => p.sales_owner === salesId).filter(p => p.status === 'Cold').length;

  const totalData = myProspek + myCustomers + myOrderan;
  
  const pieData = [
    { name: 'Prospek', value: myProspek, color: '#3B82F6' },
    { name: 'Customer', value: myCustomers, color: '#F59E0B' },
    { name: 'Orderan', value: myOrderan, color: '#F43F5E' }
  ];

  const customerVolumes = {};
  thisMonthOrders.forEach(o => {
    if(o.customer_id) {
       customerVolumes[o.customer_id] = (customerVolumes[o.customer_id] || 0) + (o.amount || 0);
    }
  });
  
  const topCustomers = Object.entries(customerVolumes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, vol], idx) => {
      const c = customers.find(c => c.id === id);
      return {
        id,
        name: c?.nama_toko || 'Unknown Customer',
        vol,
        rank: idx + 1
      };
    });
  const maxTopVol = topCustomers.length > 0 ? topCustomers[0].vol : 1;
  const dayRange = `1 ${now.toLocaleDateString('id-ID', { month: 'short' })} - ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
return (
    <div className="brand-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div className="brand-hero">
        <div className="brand-hero-top">
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '14px', color: '#fff', opacity: 0.9 }}>Selamat Datang,</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{user?.nama || 'Sales Team'}</div>
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

      
      {/* Timer Section (pertengahan antara Analisis dan Rank) */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ background: '#FEF3C7', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ width: '40px', height: '40px', background: '#F59E0B', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Timer color="#fff" size={24} />
             </div>
             <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400E' }}>Sisa Waktu Bulan Ini</div>
                <div style={{ fontSize: '12px', color: '#B45309', fontWeight: 600 }}>Kejar target sebelum bulan berakhir!</div>
             </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: '24px', fontWeight: 950, color: '#D97706', lineHeight: 1 }}>{daysLeft}</div>
             <div style={{ fontSize: '10px', fontWeight: 700, color: '#B45309' }}>HARI LAGI</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px' }}>
        
        {/* 1. Target VS Realisasi (Penjualan Kg & Target Poin) */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #E8E8E8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
             <div style={{ fontWeight: 800, color: '#1C1C1C', fontSize: '14px' }}>Target vs Realisasi</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#00AA13', fontWeight: 800 }}>
               <ChevronLeft size={14} /> {dayRange} <ChevronRight size={14} />
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
             {/* Left Col - Penjualan Kg */}
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>Volume (Kg)</div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', marginBottom: '8px' }}>{totalSalesKg.toLocaleString('id-ID')}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', fontWeight: 600 }}>
                  <span>Target: {salesTargetKg.toLocaleString('id-ID')}</span>
                </div>
                
                <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                   <div style={{ width: `${salesAchievedPct}%`, height: '100%', background: '#00AA13' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', fontWeight: 800 }}>
                   <span style={{ color: '#00AA13' }}>{salesAchievedPct.toFixed(1)}%</span>
                   <span style={{ color: '#F59E0B' }}>Sisa: {Math.max(0, salesTargetKg - totalSalesKg).toLocaleString('id-ID')}</span>
                </div>
             </div>
             
             {/* Divider */}
             <div style={{ width: '1px', background: '#F1F5F9' }}></div>
             
             {/* Right Col - Target Poin */}
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, marginBottom: '4px' }}>Target Poin</div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: '#1E293B', marginBottom: '8px' }}>{currentMonthPoints.toLocaleString('id-ID')}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginBottom: '4px', fontWeight: 600 }}>
                  <span>Target: {pointsTarget.toLocaleString('id-ID')}</span>
                </div>
                
                <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                   <div style={{ width: `${pointsAchievedPct}%`, height: '100%', background: '#3B82F6' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', fontWeight: 800 }}>
                   <span style={{ color: '#3B82F6' }}>{pointsAchievedPct.toFixed(1)}%</span>
                   <span style={{ color: '#EF4444' }}>Sisa: {Math.max(0, pointsTarget - currentMonthPoints).toLocaleString('id-ID')}</span>
                </div>
             </div>
          </div>
        </div>

        {/* 2. Performance Overview */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #E8E8E8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
             <div style={{ fontWeight: 800, color: '#1C1C1C', fontSize: '14px' }}>Performance Overview</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '110px', height: '110px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '18px', color: '#00AA13', fontWeight: 950 }}>{totalData}</span>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {pieData.map(item => {
                 const pct = totalData > 0 ? Math.round((item.value / totalData) * 100) : 0;
                 return (
                   <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                       <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: 700 }}>{item.name}</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{item.value}</span>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        {/* 3. Top Customer */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #E8E8E8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
             <div style={{ fontWeight: 800, color: '#1C1C1C', fontSize: '14px' }}>Top Customer (Bulan Ini)</div>
             <Trophy size={16} color="#F59E0B" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topCustomers.length > 0 ? topCustomers.map(tc => {
              const pct = Math.round((tc.vol / maxTopVol) * 100);
              let medalColor = '#F1F5F9';
              let txtColor = '#64748B';
              if (tc.rank === 1) { medalColor = '#FEF3C7'; txtColor = '#D97706'; } // Gold
              else if (tc.rank === 2) { medalColor = '#F1F5F9'; txtColor = '#64748B'; } // Silver
              else if (tc.rank === 3) { medalColor = '#FFEDD5'; txtColor = '#C2410C'; } // Bronze
              
              return (
                <div key={tc.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: medalColor, color: txtColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, flexShrink: 0 }}>
                    {tc.rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                       <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {tc.name}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ fontSize: '12px', fontWeight: 800, color: '#00AA13' }}>{tc.vol.toLocaleString('id-ID')} Kg</span>
                       </div>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: tc.rank === 1 ? '#00AA13' : tc.rank === 2 ? '#FBBF24' : '#3B82F6', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>Belum ada data penjualan.</div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
