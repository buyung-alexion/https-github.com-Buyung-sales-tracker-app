import { useState, useMemo, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { Search, MapPin, Phone, AlertTriangle, CheckCircle, Image as ImageIcon, User, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as dateFnsId } from 'date-fns/locale';

const CustomerOverviewCharts = ({ customers, salesData }: { customers: any[], salesData: any[] }) => {
  // 1. Data Customer Per Salesman
  const salesStats = useMemo(() => {
    return salesData.map(s => {
      return {
        name: s.nama,
        count: customers.filter(c => c.sales_pic === s.id).length
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5); // top 5
  }, [customers, salesData]);

  // 2. Data Aktif vs Non Aktif
  const activeCount = customers.filter(c => c.daysSinceOrder <= 14 && c.contactCount > 0).length;
  const activePercent = customers.length > 0 ? Math.round((activeCount / customers.length) * 100) : 0;

  // 3. Data Customer Per Area
  const areaStats = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const a = c.area || 'Unknown';
      counts[a] = (counts[a] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [customers]);

  // 4. Data Customer Per Kategori
  const catStats = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const k = c.kategori || 'Uncategorized';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [customers]);

  // Max values for scaling
  const maxSales = Math.max(1, ...salesStats.map(s => s.count));
  const maxArea = Math.max(1, ...areaStats.map(s => s.count));
  const maxCat = Math.max(1, ...catStats.map(s => s.count));

  const cardStyle = { background: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' as const, minHeight: '260px', border: '1px solid #f8fafc' };
  const titleStyle = { fontSize: '15px', fontWeight: 800, color: '#1e293b', textAlign: 'center' as const, marginBottom: '24px' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
      
      {/* Chart 1: Customer Per Salesman (Vertical Bars) */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>Customer By Sales</h3>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px', marginTop: 'auto' }}>
          {salesStats.map((s, idx) => {
            const heightPercent = Math.max(10, (s.count / maxSales) * 100);
            return (
              <div key={s.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{s.count}</div>
                <div style={{ width: '12px', height: '100px', background: '#f1f5f9', borderRadius: '6px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                   <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${heightPercent}%`, background: idx === 0 ? 'linear-gradient(180deg, #334155 0%, #0f172a 100%)' : 'linear-gradient(180deg, #fde047 0%, #eab308 100%)', borderRadius: '6px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 -2px 6px rgba(0,0,0,0.15)' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', width: '30px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Aktif vs Non Aktif (Donut) */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>Active Status</h3>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', filter: 'drop-shadow(0px 8px 12px rgba(0,0,0,0.15))' }}>
              <defs>
                <linearGradient id="gradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="gradNon" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>
              {/* Background Track (Non-Active) */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              {/* NonActive Data (Dark Slate) */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradNon)" strokeWidth="12" strokeDasharray={`${((100 - activePercent) / 100) * 251.2} 251.2`} strokeLinecap="round" />
              {/* Active Data (Yellow) */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradActive)" strokeWidth="12" strokeDasharray={`${(activePercent / 100) * 251.2} 251.2`} strokeDashoffset={`-${((100 - activePercent) / 100) * 251.2}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', lineHeight: '1' }}>{customers.length}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textAlign: 'center', lineHeight: '1.2', marginTop: '4px' }}>Total<br/>Customer</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
               <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#facc15' }}></span> Aktif
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
               <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e293b' }}></span> Non
             </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Customer Per Area (Horizontal Bars) */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>Customer By Area</h3>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          {areaStats.map((a, idx) => {
             const widthPercent = Math.max(10, (a.count / maxArea) * 100);
             return (
               <div key={a.name}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                   <span>{a.name}</span>
                   <span>{a.count}</span>
                 </div>
                 <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                   <div style={{ height: '100%', width: `${widthPercent}%`, background: idx % 2 === 0 ? 'linear-gradient(90deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(90deg, #eab308 0%, #fde047 100%)', borderRadius: '3px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)' }} />
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* Chart 4: Customer Per Categori (Vertical Bars) */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>By Category</h3>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px', marginTop: 'auto' }}>
          {catStats.map((c, idx) => {
            const heightPercent = Math.max(10, (c.count / maxCat) * 100);
            return (
              <div key={c.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{c.count}</div>
                <div style={{ width: '16px', height: '100px', background: '#f1f5f9', borderRadius: '4px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                   <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${heightPercent}%`, background: idx === 0 ? 'linear-gradient(180deg, #334155 0%, #0f172a 100%)' : idx === 1 ? 'linear-gradient(180deg, #fde047 0%, #eab308 100%)' : 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)', borderRadius: '4px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 -2px 6px rgba(0,0,0,0.1)' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', width: '40px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default function ManagerCustomer() {
  const { customers, sales, activities } = useSalesData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'overdue' | 'untouched'>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterSales, setFilterSales] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: 'Data Master Customer', sub: 'Direktori seluruh customer beserta status retention (pembelian ulang)' } }));
    }, 50);
    return () => {
      clearTimeout(timer);
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  const ITEMS_PER_PAGE = 20;

  const getSalesName = (id: string) => sales.find(s => s.id === id)?.nama || 'Unknown';

  const customerWithStats = customers.map(c => {
    const act = activities.filter(a => a.target_id === c.id);
    act.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastActivity = act.length > 0 ? act[0] : null;

    const msSinceLastOrder = Date.now() - new Date(c.last_order_date).getTime();
    const daysSinceOrder = Math.floor(msSinceLastOrder / 86400000);
    
    return {
      ...c,
      contactCount: act.length,
      daysSinceOrder,
      lastActivity,
      salesName: getSalesName(c.sales_pic)
    };
  });

  const filtered = customerWithStats
    .filter(c => {
      if (filter === 'all') return true;
      if (filter === 'overdue') return c.daysSinceOrder > 14;
      if (filter === 'untouched') return c.contactCount === 0;
      return true;
    })
    .filter(c => {
      if (filterDate === 'all') return true;
      const t = new Date(c.created_at || c.last_order_date).getTime();
      const todayMs = new Date(new Date().setHours(0,0,0,0)).getTime();
      if (filterDate === 'today') return t >= todayMs;
      if (filterDate === 'week') return t >= (todayMs - 7 * 86400000);
      if (filterDate === 'month') return t >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      return true;
    })
    .filter(c => filterSales === 'All' || c.sales_pic === filterSales)
    .filter(c => c.nama_toko.toLowerCase().includes(search.toLowerCase()) || c.salesName.toLowerCase().includes(search.toLowerCase()));

  const overdueCount = customerWithStats.filter(c => c.daysSinceOrder > 14).length;
  const untouchedCount = customerWithStats.filter(c => c.contactCount === 0).length;

  return (
    <div className="mgr-page">
      {/* GLOBAL DROPDOWN FILTERS (Above Charts, Top Right) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Filter size={14} color="#94a3b8" />
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Waktu:</span>
          <select 
            value={filterDate} 
            onChange={e => {setFilterDate(e.target.value); setPage(1);}}
            style={{ border: 'none', padding: '0', outline: 'none', fontSize: '13px', fontWeight: 800, color: '#0f172a', background: 'transparent', cursor: 'pointer' }}
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Sales:</span>
          <select 
            value={filterSales} 
            onChange={e => {setFilterSales(e.target.value); setPage(1);}}
            style={{ border: 'none', padding: '0', outline: 'none', fontSize: '13px', fontWeight: 800, color: '#0f172a', background: 'transparent', cursor: 'pointer', maxWidth: '140px' }}
          >
            <option value="All">Semua Sales</option>
            {sales.map(s => (
              <option key={s.id} value={s.id}>{s.nama}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Status:</span>
          <select 
            value={filter} 
            onChange={e => {setFilter(e.target.value as any); setPage(1);}}
            style={{ border: 'none', padding: '0', outline: 'none', fontSize: '13px', fontWeight: 800, color: '#0f172a', background: 'transparent', cursor: 'pointer' }}
          >
            <option value="all">Semua Customer</option>
            <option value="overdue">Overdue &gt; 14 Hari</option>
            <option value="untouched">Belum Pernah Dikontak</option>
          </select>
        </div>
      </div>

      <CustomerOverviewCharts customers={customerWithStats} salesData={sales} />

      <div className="chart-card" style={{ background: 'white', borderTop: '4px solid #facc15' }}>
        
        {/* LIST FILTERS: SEARCH AND TABS */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* TAB FILTERS */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '30px', border: 'none', 
                 background: filter === 'all' ? '#facc15' : '#f8fafc', 
                 color: filter === 'all' ? '#000' : '#64748b',
                 fontWeight: filter === 'all' ? 800 : 700,
                 fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s', boxShadow: filter === 'all' ? '0 4px 10px rgba(250, 204, 21, 0.3)' : 'none'
               }}
               onClick={() => { setFilter('all'); setPage(1); }}
            >
              Semua Customer <span style={{ background: filter === 'all' ? '#000' : '#e2e8f0', color: filter === 'all' ? '#facc15' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>{customers.length}</span>
            </button>
            
            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '30px', border: 'none', 
                 background: filter === 'untouched' ? '#1e293b' : '#f8fafc', 
                 color: filter === 'untouched' ? '#fff' : '#64748b',
                 fontWeight: filter === 'untouched' ? 800 : 700,
                 fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s', boxShadow: filter === 'untouched' ? '0 4px 10px rgba(30, 41, 59, 0.3)' : 'none'
               }}
               onClick={() => { setFilter('untouched'); setPage(1); }}
            >
              Belum Pernah Dikontak <span style={{ background: filter === 'untouched' ? '#fff' : '#e2e8f0', color: filter === 'untouched' ? '#1e293b' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>{untouchedCount}</span>
            </button>
            
            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '30px', border: 'none', 
                 background: filter === 'overdue' ? '#ef4444' : '#f8fafc', 
                 color: filter === 'overdue' ? '#fff' : '#64748b',
                 fontWeight: filter === 'overdue' ? 800 : 700,
                 fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s', boxShadow: filter === 'overdue' ? '0 4px 10px rgba(239, 68, 68, 0.3)' : 'none'
               }}
               onClick={() => { setFilter('overdue'); setPage(1); }}
            >
              Lewat &gt; 14 Hari <span style={{ background: filter === 'overdue' ? '#fff' : '#e2e8f0', color: filter === 'overdue' ? '#ef4444' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>{overdueCount}</span>
            </button>
          </div>

          {/* SEARCH BOX */}
          <div style={{ 
            display: 'flex', alignItems: 'center', background: '#f8fafc', 
            border: '1px solid #e2e8f0', borderRadius: '14px', padding: '10px 20px', 
            gap: '12px', flex: 1
          }}>
             <Search size={18} color="#94a3b8" />
             <input 
               placeholder="Cari berdasarkan nama toko, area, atau nama sales..." 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
               style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '14px', color: '#1e293b' }} 
             />
          </div>
        </div>

        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Nama Toko</th>
                <th>Area</th>
                <th>Sales Maintained</th>
                <th>Order Terakhir</th>
                <th>Aktivitas Follow-up</th>
                <th>Status Retention</th>
                <th>Foto</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const sortedFiltered = filtered.sort((a, b) => b.daysSinceOrder - a.daysSinceOrder);
                const displayedData = viewAll ? sortedFiltered : sortedFiltered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

                return (
                  <>
                    {displayedData.map(c => {
                      let followupText = 'Belum di-followup';
                      let followupTime = '';
                      if (c.lastActivity) {
                        followupText = `Di ${c.lastActivity.tipe_aksi}`;
                        followupTime = formatDistanceToNow(new Date(c.lastActivity.timestamp), { addSuffix: true, locale: dateFnsId });
                      }

                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {c.foto_profil ? (
                                <img src={c.foto_profil} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f1f5f9' }} />
                              ) : (
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                  <User size={20} />
                                </div>
                              )}
                              <div>
                                <strong>{c.nama_toko}</strong>
                                <div className="time-sub">{c.no_wa}</div>
                              </div>
                            </div>
                          </td>
                          <td>{c.area}</td>
                          <td>{c.salesName}</td>
                          <td>
                            {new Date(c.last_order_date).toLocaleDateString('id-ID')}
                            <div className="time-sub">{c.daysSinceOrder} hari yang lalu</div>
                          </td>
                          <td>
                            {c.lastActivity ? (
                              <>
                                <div style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>{followupText}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{followupTime}</div>
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Belum ada</span>
                            )}
                          </td>
                          <td>
                            {c.daysSinceOrder > 14 ? (
                              <span className="alert-badge" style={{ display: 'inline-flex' }}><AlertTriangle size={12}/> Overdue</span>
                            ) : c.contactCount === 0 ? (
                              <span className="alert-badge" style={{ display: 'inline-flex', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', borderColor: '#ef4444' }}><AlertTriangle size={12}/> Belum Follow-up</span>
                            ) : (
                              <span className="status-badge status-hot" style={{ background: 'transparent', color: 'var(--emerald)', borderColor: 'var(--emerald)' }}><CheckCircle size={12}/> Aman</span>
                            )}
                          </td>
                          <td style={{ width: '50px' }}>
                            {c.lastActivity?.geotagging?.photo ? (
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer' }} onClick={() => window.open(c.lastActivity!.geotagging!.photo, '_blank')}>
                                <img src={c.lastActivity.geotagging.photo} alt="bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="empty-row">Tidak ada data customer.</td></tr>
                    )}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Menampilkan {viewAll ? filtered.length : Math.min(ITEMS_PER_PAGE, filtered.length - (page - 1) * ITEMS_PER_PAGE)} dari {filtered.length} customer</span>
            
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
      </div>
    </div>
  );
}
