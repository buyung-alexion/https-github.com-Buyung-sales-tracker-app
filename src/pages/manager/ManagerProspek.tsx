import { useState } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { Search, ShieldAlert, CheckCircle2, User, Image as ImageIcon, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';


const ProspectOverviewBars = ({ closing, active, overdue, total }: { closing: number, active: number, overdue: number, total: number }) => {
  const bars = [
    { label: 'Total Prospek', count: total, color: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', hideBar: true, tColor: '#3b82f6' },
    { label: 'Prospek Overdue', count: overdue, color: 'linear-gradient(90deg, #e11d48 0%, rgba(225,29,72,0.4) 100%)', tColor: '#e11d48' },
    { label: 'Belum Closing', count: active, color: 'linear-gradient(90deg, #f59e0b 0%, rgba(245,158,11,0.4) 100%)', tColor: '#f59e0b' },
    { label: 'Total Closing', count: closing, color: 'linear-gradient(90deg, #1e293b 0%, rgba(30,41,59,0.4) 100%)', tColor: '#1e293b' }
  ];

  return (
    <div className="content-card" style={{ padding: '24px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', borderRadius: '20px', minWidth: '320px', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Prospek Overview</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {bars.map((b) => (
          <div key={b.label} style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
               <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{b.label}</span>
               <span style={{ fontSize: '14px', fontWeight: 900, color: b.tColor }}>{b.count} <span style={{fontSize:'11px', color:'#94a3b8', fontWeight: 600}}>Toko</span></span>
             </div>
             {!b.hideBar && (
               <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                 <div style={{ height: '100%', width: `${total > 0 ? (b.count / total) * 100 : 0}%`, background: b.color, borderRadius: '8px' }}></div>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};


export default function ManagerProspek() {
  const { prospek, customers, sales, activities } = useSalesData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'nocontact' | 'old30'>('all');
  const [filterSales, setFilterSales] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('all');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);
  const ITEMS_PER_PAGE = 20;

  const getSalesName = (id: string) => sales.find(s => s.id === id)?.nama || 'Unknown';

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = new Date().getTime();

  const prospekWithStats = prospek.map(p => {
    const prospectActs = activities.filter(a => a.target_id === p.id);
    prospectActs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const lastActivity = prospectActs.length > 0 ? prospectActs[0] : null;
    const ageMs = nowMs - new Date(p.created_at).getTime();

    return {
      ...p,
      contactCount: prospectActs.length,
      lastActivity,
      ageMs,
      salesName: getSalesName(p.sales_owner)
    };
  });

  const nocontactCount = prospekWithStats.filter(p => p.contactCount === 0).length;
  const old30Count = prospekWithStats.filter(p => p.ageMs > thirtyDaysMs).length;

  const closingCount = customers.length;
  const activeCount = prospek.length;
  const totalCount = closingCount + activeCount;

  const todayMs = new Date(new Date().setHours(0,0,0,0)).getTime();
  const weekMs = todayMs - (7 * 86400000);
  const monthMs = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const filtered = prospekWithStats
    .filter(p => {
      if (filterType === 'all') return true;
      if (filterType === 'nocontact') return p.contactCount === 0;
      if (filterType === 'old30') return p.ageMs > thirtyDaysMs;
      return true;
    })
    .filter(p => filterSales === 'All' || p.sales_owner === filterSales)
    .filter(p => {
      if (filterDate === 'all') return true;
      const t = new Date(p.created_at).getTime();
      if (filterDate === 'today') return t >= todayMs;
      if (filterDate === 'week') return t >= weekMs;
      if (filterDate === 'month') return t >= monthMs;
      return true;
    })
    .filter(p => p.nama_toko.toLowerCase().includes(search.toLowerCase()) || p.salesName.toLowerCase().includes(search.toLowerCase()));

  const sortedFiltered = filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const totalPages = Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE);
  const displayedData = viewAll ? sortedFiltered : sortedFiltered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="mgr-page">
      <div className="mgr-page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="mgr-title">Data Master Prospek</h1>
          <p className="mgr-sub">Direktori seluruh data prospek beserta aktivitas followup dan kategorinya</p>
        </div>
      </div>
          
      <div style={{ marginBottom: '24px' }}>
         <ProspectOverviewBars closing={closingCount} active={activeCount} overdue={old30Count} total={totalCount} />
      </div>

      <div className="chart-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)' }}>
        
        {/* TABS MENU */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 24px 0 24px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <button 
             style={{ 
               padding: '12px 20px', borderRadius: '12px 12px 0 0', border: 'none', 
               background: filterType === 'all' ? '#facc15' : 'transparent', 
               color: filterType === 'all' ? '#000' : '#64748b',
               fontWeight: filterType === 'all' ? 800 : 600,
               fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
               transition: 'all 0.2s', position: 'relative', bottom: '-1px'
             }}
             onClick={() => {setFilterType('all'); setPage(1);}}
          >
            Semua Prospek <span style={{ background: filterType === 'all' ? '#000' : '#f1f5f9', color: filterType === 'all' ? '#facc15' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>{totalCount}</span>
          </button>
          
          <button 
             style={{ 
               padding: '12px 20px', borderRadius: '12px 12px 0 0', border: 'none', 
               background: filterType === 'nocontact' ? '#facc15' : 'transparent', 
               color: filterType === 'nocontact' ? '#000' : '#64748b',
               fontWeight: filterType === 'nocontact' ? 800 : 600,
               fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
               transition: 'all 0.2s', position: 'relative', bottom: '-1px'
             }}
             onClick={() => {setFilterType('nocontact'); setPage(1);}}
          >
            Belum Pernah Dikontak <span style={{ background: filterType === 'nocontact' ? '#000' : '#f1f5f9', color: filterType === 'nocontact' ? '#facc15' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>{nocontactCount}</span>
          </button>

          <button 
             style={{ 
               padding: '12px 20px', borderRadius: '12px 12px 0 0', border: 'none', 
               background: filterType === 'old30' ? '#facc15' : 'transparent', 
               color: filterType === 'old30' ? '#000' : '#64748b',
               fontWeight: filterType === 'old30' ? 800 : 600,
               fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
               transition: 'all 0.2s', position: 'relative', bottom: '-1px'
             }}
             onClick={() => {setFilterType('old30'); setPage(1);}}
          >
            Lewat &gt; 30 Hari <span style={{ background: filterType === 'old30' ? '#000' : '#f1f5f9', color: filterType === 'old30' ? '#facc15' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>{old30Count}</span>
          </button>
        </div>

        {/* UNIFIED SEARCH BOX */}
        <div style={{ padding: '16px 24px', display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', background: 'white', 
            border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 20px', 
            gap: '16px', flex: 1
          }}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari toko atau sales..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '14px', color: '#1e293b' }} 
            />
            
            <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          </div>
        </div>

        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Toko / PIC</th>
                <th>Area</th>
                <th>Sales PIC</th>
                <th>Aktivitas Followup</th>
                <th>Status</th>
                <th>Catatan</th>
                <th>Peringatan</th>
                <th>Foto</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map(p => {
                const isLate = p.ageMs > thirtyDaysMs;
                const ageDays = Math.floor(p.ageMs / (1000 * 60 * 60 * 24));
                
                let followupText = 'Belum di-followup';
                let followupTime = '';
                if (p.lastActivity) {
                  followupText = `Di ${p.lastActivity.tipe_aksi}`;
                  followupTime = formatDistanceToNow(new Date(p.lastActivity.timestamp), { addSuffix: true, locale: id });
                }

                return (
                  <tr key={p.id} className="act-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {p.foto_profil ? (
                          <img src={p.foto_profil} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f1f5f9' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <User size={20} />
                          </div>
                        )}
                        <div>
                          <strong>{p.nama_toko}</strong>
                          <div className="time-sub">{p.nama_pic} ({p.no_wa})</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.area}</td>
                    <td><span className="sales-pill">{p.salesName}</span></td>
                    <td>
                      {p.lastActivity ? (
                        <>
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>{followupText}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{followupTime}</div>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Belum ada</span>
                      )}
                    </td>
                    <td style={{ width: '80px' }}>
                      {p.status === 'Hot' && <span className="status-badge" style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fca5a5' }}>Hot</span>}
                      {p.status === 'Warm' && <span className="status-badge" style={{ background: '#fffbeb', color: '#f59e0b', borderColor: '#fcd34d' }}>Warm</span>}
                      {p.status === 'Cold' && <span className="status-badge" style={{ background: '#f0f9ff', color: '#0ea5e9', borderColor: '#bae6fd' }}>Cold</span>}
                    </td>
                    <td className="note-cell">{p.lastActivity?.catatan_hasil || '-'}</td>
                    <td>
                      {isLate ? (
                        <span className="alert-badge" style={{ display: 'inline-flex', background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                          <ShieldAlert size={12}/> Prospek lama ({ageDays} hari)
                        </span>
                      ) : p.contactCount === 0 ? (
                        <span className="alert-badge" style={{ display: 'inline-flex' }}>
                          <ShieldAlert size={12}/> Belum Dikontak
                        </span>
                      ) : (
                        <span className="status-badge status-hot" style={{ background: 'transparent', color: 'var(--emerald)', borderColor: 'var(--emerald)' }}>
                          <CheckCircle2 size={12}/> Aktif
                        </span>
                      )}
                    </td>
                    <td style={{ width: '50px' }}>
                      {p.lastActivity?.geotagging?.photo ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer' }} onClick={() => window.open(p.lastActivity!.geotagging!.photo, '_blank')}>
                          <img src={p.lastActivity.geotagging.photo} alt="bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <tr><td colSpan={8} className="empty-row">Tidak ada data prospek.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {sortedFiltered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Menampilkan {displayedData.length} dari {sortedFiltered.length} prospek</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="btn-outline" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                disabled={page === 1 || viewAll} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              
              {!viewAll && (
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', margin: '0 8px' }}>
                  Hal {page} / {totalPages}
                </span>
              )}
              
              <button 
                className="btn-outline" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                disabled={page === totalPages || viewAll} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={14} />
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
