import { useState, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';

import { MessageCircle, MapPin, Phone, Search, Filter, Image as ImageIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const ACT_ICON: Record<string, React.ReactNode> = {
  WA: <MessageCircle size={14} />,
  Visit: <MapPin size={14} />,
  Call: <Phone size={14} />,
};

const ACT_COLOR: Record<string, string> = { WA: 'act-wa', Visit: 'act-visit', Call: 'act-call' };
const CHART_COLORS: Record<string, string> = { WA: '#10B981', Visit: '#FACC15', Call: '#3B82F6', Bar: '#FACC15' };

export default function LiveActivityFeed() {
  const { activities, refresh, sales } = useSalesData();
  const [filterSales, setFilterSales] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => refresh(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const getSalesName = (id: string) => sales.find(s => s.id === id)?.nama || id;

  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekMs = todayMs - (7 * 86400000);
  const monthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filtered = activities
    .filter(a => filterSales === 'All' || a.id_sales === filterSales)
    .filter(a => {
      if (dateFilter === 'all') return true;
      const t = new Date(a.timestamp).getTime();
      if (dateFilter === 'today') return t >= todayMs;
      if (dateFilter === 'week') return t >= weekMs;
      if (dateFilter === 'month') return t >= monthMs;
      return true;
    })
    .filter(a => a.target_nama.toLowerCase().includes(search.toLowerCase()) || getSalesName(a.id_sales).toLowerCase().includes(search.toLowerCase()));

  // Pie Chart Data
  const pieData = [
    { name: 'Visit', value: filtered.filter(a => a.tipe_aksi === 'Visit').length, color: 'url(#colorVisitGradient)' },
    { name: 'WA', value: filtered.filter(a => a.tipe_aksi === 'WA').length, color: 'url(#colorWAGradient)' },
    { name: 'Call', value: filtered.filter(a => a.tipe_aksi === 'Call').length, color: 'url(#colorCallGradient)' },
  ].filter(d => d.value > 0);
  
  const totalActs = pieData.reduce((acc, curr) => acc + curr.value, 0);

  // Area Chart Data (Trend by hour or day)
  let chartData: any[] = [];
  if (dateFilter === 'today') {
    const hours = Array.from({length: 24}, (_, i) => i);
    chartData = hours.map(h => {
      const acts = filtered.filter(a => new Date(a.timestamp).getHours() === h);
      return {
        label: `${h}:00`,
        total: acts.length
      }
    });
  } else {
    const days = 7; 
    chartData = Array.from({length: days}).map((_, i) => {
      const d = new Date(now.getTime() - ((days - 1 - i) * 86400000));
      const acts = filtered.filter(a => new Date(a.timestamp).toDateString() === d.toDateString());
      return {
        label: d.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}),
        total: acts.length
      }
    });
  }

  // Best Performance
  const salesCount: Record<string, number> = {};
  filtered.forEach(a => {
    const name = getSalesName(a.id_sales);
    salesCount[name] = (salesCount[name] || 0) + 1;
  });
  const bestPerfData = Object.entries(salesCount)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // High elevation drop shadow style for "timbul" effect matching Top Column
  const floatingCardStyle = {
    padding: '24px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
    border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)',
    borderRadius: '24px'
  };

  return (
    <div className="mgr-page">
      {/* HEADER: Live Activity Feed -> aligned with Auto Refresh */}
      <div className="mgr-page-header" style={{ alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <h1 className="mgr-title">Live Activity Feed</h1>
          <p className="mgr-sub">Pantau aktivitas tim dan pencatatan secara real-time</p>
        </div>
        <div className="mgr-header-stats">
          <button className={`auto-refresh-btn ${autoRefresh ? 'on' : 'off'}`} onClick={() => setAutoRefresh(r => !r)}>
            {autoRefresh ? '🟢' : '⚪'} Auto-refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: Filters, Table, Activity Trend */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          <div className="mgr-filters" style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar compact" style={{ flex: 1, minWidth: '200px' }}>
              <Search size={14} />
              <input placeholder="Cari toko atau sales..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-row">
              <Filter size={13} />
              <span>Waktu:</span>
              <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }} value={dateFilter} onChange={e => {setDateFilter(e.target.value); setPage(1);}}>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">Bulan Ini</option>
                <option value="all">Semua Waktu</option>
              </select>
              <span className="divider">|</span>
              <span>Sales:</span>
              <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }} value={filterSales} onChange={e => {setFilterSales(e.target.value); setPage(1);}}>
                <option value="All">Semua Sales</option>
                {sales.map(s => (
                  <option key={s.id} value={s.id}>{s.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="activity-table-wrap" style={{ boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.7)', padding: '12px', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Sales</th>
                  <th>Tipe</th>
                  <th>Target</th>
                  <th>Catatan</th>
                  <th>Area</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayedData = viewAll ? filtered : filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
                  return (
                    <>
                      {displayedData.map(a => (
                        <tr key={a.id} className={`act-row ${new Date(a.timestamp).toDateString() === new Date().toDateString() ? 'today-row' : ''}`}>
                          <td className="time-cell">
                            <span>{new Date(a.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                            <span className="time-sub">{new Date(a.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td><span className="sales-pill">{getSalesName(a.id_sales)}</span></td>
                          <td>
                            <span className={`act-type-badge ${ACT_COLOR[a.tipe_aksi]}`}>{ACT_ICON[a.tipe_aksi]} {a.tipe_aksi}</span>
                          </td>
                          <td>
                            <span className="target-name">{a.target_nama}</span>
                            <span className="target-type">{a.target_type}</span>
                          </td>
                          <td className="note-cell">{a.catatan_hasil}</td>
                          <td>{a.geotagging?.area || '—'}</td>
                          <td style={{ width: '50px' }}>
                            {a.geotagging?.photo ? (
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer' }} onClick={() => window.open(a.geotagging?.photo, '_blank')}>
                                <img src={a.geotagging.photo} alt="bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={7} className="empty-row">Tidak ada aktivitas ditemukan.</td></tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', borderTop: '1px solid #f1f5f9', borderRadius: '24px', boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.7)', marginTop: '-12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Menampilkan {viewAll ? filtered.length : Math.min(ITEMS_PER_PAGE, filtered.length - (page - 1) * ITEMS_PER_PAGE)} dari {filtered.length} aktivitas</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="btn-outline" 
                  style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  disabled={page === 1 || viewAll} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                
                {!viewAll && (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', margin: '0 8px' }}>
                    Hal {page} / {Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                  </span>
                )}
                
                <button 
                  className="btn-outline" 
                  style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  disabled={page === Math.ceil(filtered.length / ITEMS_PER_PAGE) || viewAll} 
                  onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / ITEMS_PER_PAGE), p + 1))}
                >
                  Next
                </button>
                
                <div style={{ width: '1px', height: '24px', background: '#cbd5e1', margin: '0 8px' }}></div>
                
                <button 
                  className={`filter-chip ${viewAll ? 'active' : ''}`}
                  style={{ margin: 0, padding: '6px 16px', fontWeight: 600 }}
                  onClick={() => { setViewAll(!viewAll); setPage(1); }}
                >
                  {viewAll ? 'Tampilkan Sebagian' : 'View All'}
                </button>
              </div>
            </div>
          )}

          <div className="content-card" style={{ ...floatingCardStyle, height: '320px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>Activity Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.Visit} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.Visit} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="total" stroke={CHART_COLORS.Visit} strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* RIGHT COLUMN: Activity Report, Top Sales */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="content-card" style={{ ...floatingCardStyle }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Activity Report</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Overview of Types</p>
            </div>
            
            <div style={{ height: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="colorVisitGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fde047"/>
                      <stop offset="100%" stopColor={CHART_COLORS.Visit}/>
                    </linearGradient>
                    <linearGradient id="colorWAGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34d399"/>
                      <stop offset="100%" stopColor={CHART_COLORS.WA}/>
                    </linearGradient>
                    <linearGradient id="colorCallGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa"/>
                      <stop offset="100%" stopColor={CHART_COLORS.Call}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{totalActs}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginTop: '2px' }}>Total Acts</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
              {pieData.map(d => {
                const pct = totalActs > 0 ? Math.round((d.value / totalActs) * 100) : 0;
                const rawColor = d.name === 'Visit' ? CHART_COLORS.Visit : d.name === 'WA' ? CHART_COLORS.WA : CHART_COLORS.Call;
                return (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: rawColor }}></div>
                    <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{d.name}</span>
                      <span style={{ fontSize: '13px', color: '#111827', fontWeight: 800 }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginTop: '8px', marginBottom: '-8px' }}>Top Sales Performance</h3>
          
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', paddingTop: '16px' }}>
            {[...bestPerfData, {name: '-', total: 0}, {name: '-', total: 0}, {name: '-', total: 0}].slice(0,3).map((sales, i) => (
               <div key={`winner-${i}`} style={{ 
                 minWidth: '130px',
                 flex: 1,
                 borderRadius: '24px', 
                 padding: '24px 16px', 
                 display: 'flex', 
                 flexDirection: 'column', 
                 background: i === 0 ? '#1e293b' : i === 1 ? '#facc15' : '#ef4444', 
                 color: i === 1 ? '#111827' : '#ffffff',
                 boxShadow: '0 15px 35px -10px ' + (i===0?'rgba(30,41,59,0.5)':i===1?'rgba(250,204,21,0.5)':'rgba(239,68,68,0.5)'),
                 transition: 'transform 0.2s',
                 border: '1px solid rgba(255,255,255,0.15)'
               }}>
                 <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '20px' }}>
                   {sales.total} <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: 700 }}>Acts</span>
                 </div>
                 
                 <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '4px 0 24px 0', border: '1px solid rgba(255,255,255,0.2)' }}>
                   {i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}
                 </div>

                 <div style={{ fontSize: '14px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {sales.name}
                 </div>
               </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
