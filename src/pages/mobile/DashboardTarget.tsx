import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';


import { Trophy, Menu, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../../brand-style.css'; 

interface Props { salesId: string; setSidebarOpen?: (open: boolean) => void; }

export default function DashboardTarget({ salesId, setSidebarOpen }: Props) {
  const { user } = useAuth();
  const { activities = [], prospek = [], customers = [], sales = [], orders = [] } = useSalesData() || {};
  const currentSales = sales.find(s => s.id === salesId) || (user as any);
  

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

  // Calculate Sales Performance (Kg)
  const totalSalesKg = thisMonthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const salesTargetKg = currentSales?.target_penjualan || 50000; // default 50.000 kg
  const salesAchievedPct = Math.min(100, (totalSalesKg / salesTargetKg) * 100);

  // Target Poin
  const pointsTarget = 2000; // Example target poin
  const pointsAchievedPct = Math.min(100, (currentMonthPoints / pointsTarget) * 100);

  // Data for Sales Activity Chart (Gambar 2)
  // Get last 7 days
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const activityData = last7Days.map(date => {
    const dayStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const dayActs = thisMonthActivities.filter(a => new Date(a.timestamp).toDateString() === date.toDateString());
    const dayOrders = thisMonthOrders.filter(o => new Date(o.created_at).toDateString() === date.toDateString());
    return {
      name: dayStr,
      Order: dayOrders.length,
      Visit: dayActs.filter(a => a.tipe_aksi === 'Visit').length,
      Closing: dayOrders.length // Simplification
    };
  });

  // Data for Performance Overview (Gambar 3)
  const myProspek = prospek.filter(p => p.sales_owner === salesId).length;
  const myCustomers = customers.filter(c => c.sales_pic === salesId).length;
  const myOrderan = thisMonthOrders.length;
  const totalData = myProspek + myCustomers + myOrderan;
  
  const pieData = [
    { name: 'Prospek', value: myProspek, color: '#3B82F6' },
    { name: 'Customer', value: myCustomers, color: '#F59E0B' },
    { name: 'Orderan', value: myOrderan, color: '#F43F5E' }
  ];

  // Data for Top Customers (Gambar 4)
  const customerVolumes: Record<string, number> = {};
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
    <div className="page-content" style={{ padding: 0, background: '#F4F7F6', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header - Full Margin */}
      <div className="gojek-bg-top" style={{ 
        padding: 'calc(16px + env(safe-area-inset-top)) 20px 24px', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        zIndex: 50
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 6, marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 className="hero-premium-title" style={{ fontSize: '24px', margin: 0, color: '#FFFFFF' }}>Analisis</h2>
            </div>
            <div className="hero-premium-subtitle" style={{ color: '#FFFFFF', opacity: 0.9 }}>Performance Overview</div>
          </div>
          {setSidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '-12px', position: 'relative', zIndex: 60, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 1. Target VS Realisasi (Penjualan Kg & Target Poin) - Gambar 1 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8E8E8' }}>
          {/* Date Range Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
             <div style={{ fontWeight: 700, color: '#1C1C1C', fontSize: '13px' }}>Target vs Realisasi</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#00AA13', fontWeight: 700 }}>
               <ChevronLeft size={14} /> {dayRange} <ChevronRight size={14} />
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
             {/* Left Col - Penjualan Kg */}
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#1C1C1C', fontWeight: 800, marginBottom: '8px' }}>Penjualan (Kg)</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#1C1C1C', marginBottom: '12px' }}>{totalSalesKg.toLocaleString('id-ID')} Kg</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#727272', marginBottom: '4px' }}>
                  <span>Target: {salesTargetKg.toLocaleString('id-ID')}</span>
                  <span>Sisa: {Math.max(0, salesTargetKg - totalSalesKg).toLocaleString('id-ID')}</span>
                </div>
                
                <div style={{ width: '100%', height: '16px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                   <div style={{ width: `${salesAchievedPct}%`, height: '100%', background: '#00AA13' }}></div>
                   <div style={{ width: `${100 - salesAchievedPct}%`, height: '100%', background: '#FCD34D' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', fontWeight: 700 }}>
                   <span style={{ color: '#00AA13' }}>{salesAchievedPct.toFixed(1)}%</span>
                   <span style={{ color: '#F59E0B' }}>{(100 - salesAchievedPct).toFixed(1)}%</span>
                </div>
             </div>
             
             {/* Divider */}
             <div style={{ width: '1px', background: '#F1F5F9' }}></div>
             
             {/* Right Col - Target Poin */}
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#1C1C1C', fontWeight: 800, marginBottom: '8px' }}>Target Poin</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#1C1C1C', marginBottom: '12px' }}>{currentMonthPoints.toLocaleString('id-ID')} Pts</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#727272', marginBottom: '4px' }}>
                  <span>Target: {pointsTarget.toLocaleString('id-ID')}</span>
                  <span>Sisa: {Math.max(0, pointsTarget - currentMonthPoints).toLocaleString('id-ID')}</span>
                </div>
                
                <div style={{ width: '100%', height: '16px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                   <div style={{ width: `${pointsAchievedPct}%`, height: '100%', background: '#3B82F6' }}></div>
                   <div style={{ width: `${100 - pointsAchievedPct}%`, height: '100%', background: '#EF4444' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', fontWeight: 700 }}>
                   <span style={{ color: '#3B82F6' }}>{pointsAchievedPct.toFixed(1)}%</span>
                   <span style={{ color: '#EF4444' }}>{(100 - pointsAchievedPct).toFixed(1)}%</span>
                </div>
             </div>
          </div>
        </div>

        {/* 2. Grafik Aktivitas Sales (Order, Visit, Closing) - Gambar 2 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8E8E8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
             <div style={{ fontWeight: 700, color: '#1C1C1C', fontSize: '13px' }}>Aktivitas Sales (7 Hari)</div>
             <Clock size={16} color="#727272" />
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activityData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#727272' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#727272' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Visit" fill="#A7F3D0" barSize={20} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Order" fill="#FCA5A5" barSize={20} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Closing" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Grafik Performance Overview - Gambar 3 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8E8E8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
             <div style={{ fontWeight: 700, color: '#1C1C1C', fontSize: '13px' }}>Performance Overview</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#00AA13', fontWeight: 700 }}>
               <ChevronLeft size={14} /> {dayRange} <ChevronRight size={14} />
             </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '120px', height: '120px', position: 'relative' }}>
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
                <span style={{ fontSize: '11px', color: '#727272', fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: '18px', color: '#00AA13', fontWeight: 900 }}>{totalData}</span>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {pieData.map(item => {
                 const pct = totalData > 0 ? Math.round((item.value / totalData) * 100) : 0;
                 return (
                   <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></div>
                       <span style={{ fontSize: '12px', color: '#1C1C1C', fontWeight: 600 }}>{item.name}</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '13px', fontWeight: 800, color: '#1C1C1C' }}>{item.value}</span>
                       <span style={{ fontSize: '10px', background: `${item.color}20`, color: item.color, padding: '2px 6px', borderRadius: '12px', fontWeight: 800, minWidth: '36px', textAlign: 'center' }}>
                         {pct}%
                       </span>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', color: '#727272', marginTop: '12px' }}>
            <Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}/> 
            Data per hari ini
          </div>
        </div>

        {/* 4. Grafik Top Customer Order - Gambar 4 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8E8E8', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
             <div style={{ fontWeight: 700, color: '#1C1C1C', fontSize: '13px' }}>Penjualan Pelanggan (Top 5)</div>
             <Trophy size={16} color="#F59E0B" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topCustomers.length > 0 ? topCustomers.map(tc => {
              const pct = Math.round((tc.vol / maxTopVol) * 100);
              let medalColor = '#E8E8E8';
              let txtColor = '#727272';
              if (tc.rank === 1) { medalColor = '#FBBF24'; txtColor = '#fff'; } // Gold
              else if (tc.rank === 2) { medalColor = '#9CA3AF'; txtColor = '#fff'; } // Silver
              else if (tc.rank === 3) { medalColor = '#D97706'; txtColor = '#fff'; } // Bronze
              
              return (
                <div key={tc.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: medalColor, color: txtColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, flexShrink: 0 }}>
                    {tc.rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                       <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1C1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {tc.name}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ fontSize: '12px', fontWeight: 800, color: '#1C1C1C' }}>{tc.vol.toLocaleString('id-ID')} Kg</span>
                       </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: tc.rank === 1 ? '#00AA13' : tc.rank === 2 ? '#FBBF24' : '#3B82F6', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#727272', fontSize: '12px' }}>Belum ada data penjualan pelanggan.</div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
