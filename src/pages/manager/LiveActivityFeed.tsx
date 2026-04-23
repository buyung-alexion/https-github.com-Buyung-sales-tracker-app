import { useState, useEffect, useMemo } from 'react';
import { useSalesData } from '../../hooks/useSalesData';


import { MessageSquare, MapPin, Phone, Search, Image as ImageIcon, ShoppingCart, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';



const ACT_ICON: Record<string, React.ReactNode> = {
  WA: <MessageSquare size={14} />,
  Visit: <MapPin size={14} />,
  Call: <Phone size={14} />,
  Order: <ShoppingCart size={14} />,
};

const getActLabel = (tipe: string) => {
  if (tipe === 'WA' || tipe === 'Call') return 'Followup';
  if (tipe === 'Order') return 'Sales Order';
  return tipe;
};

const ACT_COLOR: Record<string, string> = { WA: 'act-followup', Visit: 'act-visit', Call: 'act-followup', Order: 'act-order' };

export default function LiveActivityFeed() {
  const { activities, sales, prospek: allProspek } = useSalesData();
  const [filterSales, setFilterSales] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [selectedImage, setSelectedImage] = useState<{ url: string, sales: string, store: string, timestamp: string, note: string } | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);
  const ITEMS_PER_PAGE = 20;

  const getSalesName = (id: string) => sales.find(s => s.id === id)?.nama || id;

  // Use a stable reference for "now" for data-binding logic
  const [now] = useState(new Date());
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekMs = todayMs - (7 * 86400000);
  const monthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const areas = useMemo(() => {
    const set = new Set<string>();
    (activities || []).forEach(a => { if (a.geotagging?.area) set.add(a.geotagging.area); });
    return Array.from(set).sort();
  }, [activities]);



  const filtered = useMemo(() => {
    const acts = activities || [];
    return acts
      .filter(a => filterSales === 'all' || a.id_sales === filterSales)
      .filter(a => {
        if (dateFilter === 'all') return true;
        const t = new Date(a.timestamp || 0).getTime();
        if (dateFilter === 'today') return t >= todayMs;
        if (dateFilter === 'week') return t >= weekMs;
        if (dateFilter === 'month') return t >= monthMs;
        return true;
      })
      .filter(a => selectedArea === 'all' || a.geotagging?.area === selectedArea)
      .filter(a => {
        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'Visit') return a.tipe_aksi === 'Visit';
        if (selectedCategory === 'Followup') return a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call';
        if (selectedCategory === 'Order') return a.tipe_aksi === 'Order';
        if (selectedCategory === 'Closing') return (a.catatan_hasil || '').toLowerCase().includes('closing');
        if (selectedCategory === 'Prospek') return false; 
        return true;
      })
      .filter(a => 
        (a.target_nama || '').toLowerCase().includes(search.toLowerCase()) || 
        getSalesName(a.id_sales).toLowerCase().includes(search.toLowerCase())
      );
  }, [activities, filterSales, dateFilter, selectedArea, selectedCategory, search, todayMs, weekMs, monthMs]);
  
  const filteredProspek = useMemo(() => {
    if (selectedCategory !== 'all' && selectedCategory !== 'Prospek') return [];
    
    return (allProspek || [])
      .filter(p => filterSales === 'all' || p.sales_owner === filterSales)
      .filter(p => {
        if (dateFilter === 'all') return true;
        const t = new Date(p.created_at || 0).getTime();
        if (dateFilter === 'today') return t >= todayMs;
        if (dateFilter === 'week') return t >= weekMs;
        if (dateFilter === 'month') return t >= monthMs;
        return true;
      })
      .filter(p => selectedArea === 'all' || p.area === selectedArea)
      .filter(p => 
        (p.nama_toko || '').toLowerCase().includes(search.toLowerCase()) ||
        (sales.find(s => s.id === p.sales_owner)?.nama || '').toLowerCase().includes(search.toLowerCase())
      );
  }, [allProspek, filterSales, dateFilter, selectedArea, selectedCategory, search, todayMs, weekMs, monthMs, sales]);

  // Pie Chart Data for Activity Breakdown
  const pieData = useMemo(() => [
    { name: 'Followup', value: filtered.filter(a => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length, color: '#60a5fa' }, // Sky Blue
    { name: 'Visit', value: filtered.filter(a => a.tipe_aksi === 'Visit').length, color: '#3b82f6' }, // Blue
    { name: 'Order', value: filtered.filter(a => a.tipe_aksi === 'Order').length, color: '#2563eb' }, // Royal Blue
    { name: 'Prospek', value: filteredProspek.length, color: '#1d4ed8' }, // Deep Blue
  ], [filtered, filteredProspek]);
  
  const totalActs = useMemo(() => pieData.reduce((acc, curr) => acc + curr.value, 0), [pieData]);
  
  
  


  const salesPerformanceData = useMemo(() => {
    return (sales || []).map(s => {
      const sActivities = filtered.filter(a => a.id_sales === s.id);
      
      const vCount = sActivities.filter(a => a.tipe_aksi === 'Visit').length;
      const fCount = sActivities.filter(a => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length;
      const oCount = sActivities.filter(a => a.tipe_aksi === 'Order').length;
      const pCount = filteredProspek.filter(p => p.sales_owner === s.id).length;

      return {
        id: s.id,
        name: s.nama,
        visit: vCount,
        followup: fCount,
        order: oCount,
        prospek: pCount,
        total: vCount + fCount + oCount + pCount
      };
    }).sort((a, b) => b.total - a.total).slice(0, 10); // Show top 10 sales
  }, [sales, filtered, allProspek, dateFilter, todayMs, weekMs, monthMs]);

  // UI Component for the Trend Bar
  const SalesTrendBar = ({ data, maxVal }: { data: any, maxVal: number }) => {
    const hTotal = data.total > 0 ? (data.total / maxVal) * 100 : 5;
    const hVisit = data.total > 0 ? (data.visit / data.total) * hTotal : 0;
    const hFollowup = data.total > 0 ? (data.followup / data.total) * hTotal : 0;
    const hOrder = data.total > 0 ? (data.order / data.total) * hTotal : 0;
    const hProspek = data.total > 0 ? (data.prospek / data.total) * hTotal : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minWidth: '80px' }}>
        {/* Total Activity Bubble */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.05)', 
          color: '#475569', 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '11px', 
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          opacity: data.total > 0 ? 1 : 0.3,
        }}>
          {data.total} Acts
        </div>

        <div style={{ 
          width: '32px', 
          height: '160px', 
          background: '#f8fafc', 
          borderRadius: '20px', 
          position: 'relative', 
          overflow: 'hidden',
          border: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
          {/* Prospek (Deep Blue) */}
          <div style={{ height: `${hProspek}%`, background: '#1d4ed8', width: '100%', transition: 'height 0.8s ease' }} />
          {/* Order (Royal Blue) */}
          <div style={{ height: `${hOrder}%`, background: '#2563eb', width: '100%', transition: 'height 0.8s ease' }} />
          {/* Visit (Blue) */}
          <div style={{ height: `${hVisit}%`, background: '#3b82f6', width: '100%', transition: 'height 0.8s ease' }} />
          {/* Followup (Sky Blue) */}
          <div style={{ height: `${hFollowup}%`, background: '#60a5fa', width: '100%', transition: 'height 0.8s ease' }} />
        </div>

        <div style={{ 
          background: '#fbbf24', 
          color: '#854d0e', 
          padding: '6px 12px', 
          borderRadius: '12px', 
          fontSize: '11px', 
          fontWeight: 900,
          textTransform: 'uppercase',
          boxShadow: '0 4px 6px rgba(251, 191, 36, 0.2)',
          whiteSpace: 'nowrap'
        }}>
          {data.name.split(' ')[0]}
        </div>
      </div>
    );
  };


  // Set Shell Title on Mount
  useEffect(() => {
    const event = new CustomEvent('setMgrTitle', { 
      detail: { title: 'Activity Center', sub: 'Pantau aktivitas tim dan pencatatan secara real-time' } 
    });
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="mgr-page" style={{ background: '#f4f7fa', padding: '0px 0 24px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 1. TOP: MASTER FILTER BAR (Now Moved Above Grid) */}
        <div style={{ 
          background: 'rgba(255,255,255,0.8)', 
          backdropFilter: 'blur(10px)', 
          padding: '16px 24px', 
          borderRadius: '20px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          border: '1px solid rgba(255,255,255,0.5)',
          flexWrap: 'wrap'
        }}>
          <div className="search-bar compact" style={{ flex: 1, minWidth: '200px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <Search size={14} color="#94a3b8" />
            <input 
              placeholder="Cari toko atau sales..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📅</span>
              <select 
                value={dateFilter} 
                onChange={(e) => {setDateFilter(e.target.value as any); setPage(1);}}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#475569' }}
              >
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>

            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>👤</span>
              <select 
                value={filterSales} 
                onChange={(e) => {setFilterSales(e.target.value); setPage(1);}}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#475569' }}
              >
                <option value="all">Semua Sales</option>
                {sales.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>

            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <select 
                value={selectedArea} 
                onChange={(e) => {setSelectedArea(e.target.value); setPage(1);}}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#475569' }}
              >
                <option value="all">Semua Wilayah</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🛠️</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => {setSelectedCategory(e.target.value); setPage(1);}}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#475569' }}
              >
                <option value="all">Semua Tipe</option>
                <option value="Visit">Visit</option>
                <option value="Followup">Followup</option>
                <option value="Order">Sales Order</option>
                <option value="Prospek">Prospek Baru</option>
                <option value="Closing">Closing</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. MIDDLE: DASHBOARD ANALYTICS GRID */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', 
          gap: '24px',
          width: '100%'
        }}>
          
          {/* Sales Activity Summary (Bar Chart) */}
          <div style={{ 
            background: 'white', 
            borderRadius: '32px', 
            padding: '32px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '450px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle Blue Tint Gradient for matching */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#1e293b', margin: 0 }}>Ringkasan Sales</h3>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>AKTIVITAS PER SALES</p>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {[
                { label: 'FOLLOWUP', color: '#60a5fa' },
                { label: 'VISIT', color: '#3b82f6' },
                { label: 'ORDER', color: '#2563eb' },
                { label: 'PROSPEK', color: '#1d4ed8' }
              ].map(cat => (
                <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 900, color: '#64748b' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: cat.color }} /> {cat.label}
                </div>
              ))}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              overflowX: 'auto', 
              padding: '20px 48px 40px 20px',
              scrollbarWidth: 'auto',
              marginTop: 'auto'
            }}>
              {salesPerformanceData.map(d => (
                <SalesTrendBar key={d.id} data={d} maxVal={Math.max(...salesPerformanceData.map(x => x.total), 1)} />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN WRAPPER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Activity Breakdown (Radial Gauge) - Polished Contrast */}
            <div style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
              borderRadius: '32px', 
              padding: '32px', 
              boxShadow: '0 20px 50px rgba(37, 99, 235, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
              minHeight: '450px',
              position: 'relative',
              overflow: 'hidden'
            }}>
               {/* Premium Decorative Mesh Pattern */}
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
               <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

               <div style={{ marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 950, color: '#fff', margin: 0 }}>Summary Aktivitas</h3>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: '4px' }}>KOMPOSISI TIPE AKSI</p>
               </div>

               <div style={{ 
                 flex: 1, 
                 position: 'relative', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center',
                 background: 'rgba(255,255,255,0.95)', // Slightly transparent white card
                 backdropFilter: 'blur(10px)',
                 borderRadius: '24px',
                 margin: '0 0 24px',
                 boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                 border: '1px solid #fff',
                 zIndex: 1
               }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={105}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={10}
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 800 }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '36px', fontWeight: 950, color: '#1e293b', lineHeight: 1 }}>{totalActs}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Acts</span>
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', position: 'relative', zIndex: 1 }}>
                  {pieData.map(d => {
                    const pct = totalActs > 0 ? Math.round((d.value / totalActs) * 100) : 0;
                    return (
                      <div key={d.name} style={{ 
                        background: 'rgba(255, 255, 255, 0.9)', 
                        padding: '12px', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.5)', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        backdropFilter: 'blur(5px)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{d.name}</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{pct}%</div>
                      </div>
                    );
                  })}
               </div>
            </div>

          </div>
        </div>




        {/* 3. BOTTOM: ACTIVITY TABLE */}
        <div style={{ 
          background: 'white', 
          borderRadius: '32px', 
          padding: '12px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
          overflow: 'hidden'
        }}>
          <div className="activity-table-wrap" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Sales</th>
                  <th>Tipe</th>
                  <th>Target</th>
                  <th>Note</th>
                  <th>Area</th>
                  <th style={{ textAlign: 'center' }}>Bukti</th>
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
                            <span className={`act-type-badge ${ACT_COLOR[a.tipe_aksi] || 'act-visit'}`}>
                            {ACT_ICON[a.tipe_aksi]} {getActLabel(a.tipe_aksi)}
                          </span>
                          </td>
                          <td>
                            <span className="target-name">{a.target_nama}</span>
                            <span className="target-type">{a.target_type}</span>
                          </td>
                          <td className="note-cell">{a.catatan_hasil}</td>
                          <td>{a.geotagging?.area || '—'}</td>
                          <td style={{ textAlign: 'center', width: '60px' }}>
                            {a.geotagging?.photo ? (
                              <button 
                                onClick={() => setSelectedImage({
                                  url: a.geotagging!.photo!,
                                  sales: getSalesName(a.id_sales),
                                  store: a.target_nama,
                                  timestamp: a.timestamp,
                                  note: a.catatan_hasil
                                })}
                                style={{
                                  padding: '8px 16px', borderRadius: '12px', border: '1px solid #f1f5f9',
                                  background: '#fff', fontSize: '12px', fontWeight: 800, color: '#1e293b',
                                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}
                              >
                                <ImageIcon size={14} color="#facc15" /> FOTO BUKTI
                              </button>
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', margin: '0 auto', border: '1px dashed #e2e8f0' }}>
                                <ImageIcon size={18} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#fcfcfc', borderTop: '1px solid #f1f5f9', borderRadius: '0 0 32px 32px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Menampilkan {viewAll ? filtered.length : Math.min(ITEMS_PER_PAGE, filtered.length - (page - 1) * ITEMS_PER_PAGE)} dari {filtered.length} aktivitas</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className="btn-outline" 
                  style={{ padding: '8px 16px', height: 'auto', minHeight: 'unset' }}
                  disabled={page === 1 || viewAll} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                
                {!viewAll && (
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                    {page} / {Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                  </span>
                )}
                
                <button 
                  className="btn-outline" 
                   style={{ padding: '8px 16px', height: 'auto', minHeight: 'unset' }}
                  disabled={page === Math.ceil(filtered.length / ITEMS_PER_PAGE) || viewAll} 
                  onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / ITEMS_PER_PAGE), p + 1))}
                >
                  Next
                </button>
                
                <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
                
                <button 
                  className={`filter-chip ${viewAll ? 'active' : ''}`}
                  style={{ margin: 0, padding: '8px 20px', fontWeight: 700, borderRadius: '12px' }}
                  onClick={() => { setViewAll(!viewAll); setPage(1); }}
                >
                  {viewAll ? 'Tampilkan Sebagian' : 'View All'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image View Modal (Premium) */}
      {selectedImage && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fade-in 0.3s ease', padding: '40px'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div 
            style={{ 
              background: '#fff', 
              width: '100%', maxWidth: '1000px', 
              borderRadius: '32px', 
              overflow: 'hidden', 
              display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 350px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              animation: 'scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              maxHeight: '90vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(15,23,42,0.1)', border: 'none', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            {/* Image Side */}
            <div style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>
               <img 
                 src={selectedImage.url} 
                 alt="Bukti Lapangan" 
                 style={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain' }} 
               />
            </div>

            {/* Content Side */}
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>History Live Activity</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>{selectedImage.store}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#facc15', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedImage.sales.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{selectedImage.sales}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Field Sales Agent</div>
                    </div>
                  </div>
               </div>

               <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }} />

               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <MapPin size={14} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Timestamp Feed</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#475569' }}>
                        {new Date(selectedImage.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • {new Date(selectedImage.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
               </div>

               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Insight / Laporan</div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '13px', lineHeight: 1.6, color: '#475569', fontWeight: 600 }}>
                    {selectedImage.note || 'Tidak ada catatan aktivias live feed.'}
                  </div>
               </div>

               <button 
                 onClick={() => setSelectedImage(null)}
                 style={{ background: '#1e293b', border: 'none', borderRadius: '16px', padding: '16px', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(30,41,59,0.1)' }}
               >
                 TUTUP
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
