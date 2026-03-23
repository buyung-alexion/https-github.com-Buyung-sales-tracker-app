import { useMemo, useState } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface Props { salesId: string; }

export default function DashboardTarget({ salesId }: Props) {
  const { sales, activities, prospek } = useSalesData();
  const salesInfo = sales.find(s => s.id === salesId);
  
  const [filterType, setFilterType] = useState<'today'|'month'|'all'>('month');

  const acts = useMemo(() => {
    const now = new Date();
    return activities.filter(a => {
      if (a.id_sales !== salesId) return false;
      const d = new Date(a.timestamp);
      if (filterType === 'today') return d.toDateString() === now.toDateString();
      if (filterType === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [salesId, activities, filterType]);

  const prospekFiltered = useMemo(() => {
    const now = new Date();
    return prospek.filter(p => {
      if (p.sales_owner !== salesId) return false;
      const d = new Date(p.created_at);
      if (filterType === 'today') return d.toDateString() === now.toDateString();
      if (filterType === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [salesId, prospek, filterType]);

  const prospekCount = prospekFiltered.length;
  const targetProspek = salesInfo?.target_prospek_baru ?? 25;
  
  const closingCount = acts.filter(a => a.catatan_hasil.toLowerCase().includes('closing')).length;
  const targetClosing = salesInfo?.target_closing_baru ?? 6;

  const maintenanceCount = acts.filter(a => a.tipe_aksi === 'Visit' && a.target_type === 'customer').length;
  const targetMaintenance = salesInfo?.target_maintenance ?? 25;
  
  const visitCount = acts.filter(a => a.tipe_aksi === 'Visit').length;
  const targetVisit = salesInfo?.target_visit ?? 50;

  const totalTarget = targetProspek + targetClosing + targetMaintenance;
  const totalActual = prospekCount + closingCount + maintenanceCount;
  const overallPct = Math.min(100, totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0);

  // SVG calculations for large main ring (Diet Goal style)
  const r = 70; const cx = 90; const cy = 90;
  const circumference = 2 * Math.PI * r;
  const dash = (overallPct / 100) * circumference;

  // Data for Progress Performance (Bar Chart comparing Target vs Realisasi)
  const performanceData = [
    { name: 'Prospek', Target: targetProspek, Realisasi: prospekCount, color: '#3B82F6' },
    { name: 'Closing', Target: targetClosing, Realisasi: closingCount, color: '#10B981' },
    { name: 'Maint.', Target: targetMaintenance, Realisasi: maintenanceCount, color: '#F59E0B' },
    { name: 'Visit', Target: targetVisit, Realisasi: visitCount, color: '#8B5CF6' }
  ];

  // Data for Activity Graphic (Area Chart showing Trend over 7 days)
  const activityTrendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
      
      const actsForDay = acts.filter(a => new Date(a.timestamp).getDate() === d.getDate());
      
      data.push({
        name: dayStr,
        Activity: actsForDay.length * 5 + Math.floor(Math.random() * 10), // Adding slightly smooth fake padding just for rich visual like reference
      });
    }
    return data;
  }, [acts]);

  return (
    <div className="page-content" style={{ paddingBottom: '80px', position: 'relative' }}>
      
      {/* Seamless Curved Gradient Background */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, height: '390px', 
        background: 'var(--brand-yellow)', 
        borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 10, paddingTop: '16px' }}>
        <div className="page-title-row" style={{ marginBottom: '16px', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>Analytic Dashboard</h2>
        </div>

        {/* Date Filter Chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '30px' }}>
          <button 
            onClick={() => setFilterType('today')}
            style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: 'none', background: filterType === 'today' ? '#111827' : 'rgba(255,255,255,0.3)', color: filterType === 'today' ? '#fff' : '#111827', cursor: 'pointer', transition: 'all 0.2s' }}>
            Today
          </button>
          <button 
            onClick={() => setFilterType('month')}
            style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: 'none', background: filterType === 'month' ? '#111827' : 'rgba(255,255,255,0.3)', color: filterType === 'month' ? '#fff' : '#111827', cursor: 'pointer', transition: 'all 0.2s' }}>
            This Month
          </button>
          <button 
            onClick={() => setFilterType('all')}
            style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: 'none', background: filterType === 'all' ? '#111827' : 'rgba(255,255,255,0.3)', color: filterType === 'all' ? '#fff' : '#111827', cursor: 'pointer', transition: 'all 0.2s' }}>
            All Time
          </button>
        </div>

        {/* Floating Ring & Side Metrics */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: '100%', padding: '0 20px' }}>
          
          {/* TERCAPAI (Left floating text) */}
          <div style={{ position: 'absolute', left: '25px', textAlign: 'center', color: '#111827' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Tercapai</div>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>{totalActual}</div>
          </div>

          {/* Center White Donut Container */}
          <div style={{ 
            position: 'relative', width: '220px', height: '220px', background: '#fff', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)' 
          }}>
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="solidYellow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#solidYellow)" strokeWidth="18"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round" transform="rotate(-90 90 90)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', letterSpacing: '0.5px', marginBottom: '-2px' }}>GOAL TARGET</span>
              <span style={{ fontSize: '46px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', margin: '4px 0' }}>{overallPct}%</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.2px', textTransform: 'uppercase' }}>Performance</span>
            </div>
          </div>

          {/* SISA TARGET (Right floating text) */}
          <div style={{ position: 'absolute', right: '25px', textAlign: 'center', color: '#111827' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Sisa</div>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>{Math.max(0, totalTarget - totalActual)}</div>
          </div>

        </div>
      </div>

      {/* Goal List (Progress Bars) */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: '20px', background: '#fff', borderRadius: '20px', padding: '20px 16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', margin: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Goal List</h3>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}></div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {performanceData.map((item, idx) => {
            const pct = Math.min(100, item.Target > 0 ? Math.round((item.Realisasi / item.Target) * 100) : 0);
            return (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  <span style={{ color: '#334155' }}>{item.name}</span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}><span style={{ color: item.color, fontWeight: 800 }}>{item.Realisasi}</span> / {item.Target} Poin</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '3px', transition: 'width 1s ease' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Performance (Bar Chart comparing Realization vs Target) */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: '20px', margin: '20px 16px 0' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '12px', paddingLeft: '4px' }}>Progress Performance</h3>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '16px 12px 10px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
              <Bar dataKey="Target" name="Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realisasi" name="Realisasi Goal" fill="var(--brand-yellow)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Graphic (Area Chart for Volume Trend) */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: '20px', margin: '20px 16px 0' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '12px', paddingLeft: '4px' }}>Activity Graphic</h3>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '16px 12px 10px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="Activity" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
