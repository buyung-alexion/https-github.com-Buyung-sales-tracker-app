import { useState, useEffect, useMemo } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { Search, ShieldAlert, CheckCircle2, User, Image as ImageIcon, Filter, UserCheck, Phone, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';


const StatCard = ({ label, value, icon, gradient, change = '+0%' }: { label: string, value: number, icon: React.ReactNode, gradient: string, change?: string }) => (
  <div style={{ 
    background: gradient, 
    borderRadius: '24px', 
    padding: '24px', 
    color: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    minHeight: '120px'
  }}>
    {/* Subtle Decorative Circle */}
    <div style={{ 
      position: 'absolute', 
      right: '-20px', 
      top: '-20px', 
      width: '100px', 
      height: '100px', 
      borderRadius: '50%', 
      background: 'rgba(255,255,255,0.1)',
      pointerEvents: 'none'
    }} />
    
    <div style={{ 
      width: '56px', 
      height: '56px', 
      borderRadius: '16px', 
      background: 'rgba(255,255,255,0.2)', 
      backdropFilter: 'blur(4px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      flexShrink: 0
    }}>
      {icon}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '32px', fontWeight: 950, lineHeight: 1 }}>{value}</span>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '2px 8px', 
          borderRadius: '100px', 
          fontSize: '10px', 
          fontWeight: 900,
          border: '1px solid rgba(255,255,255,0.3)',
          letterSpacing: '0.5px'
        }}>
          {change} ↑
        </div>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>{label}</span>
    </div>
  </div>
);


export default function ManagerProspek() {
  const { prospek, customers, sales, activities } = useSalesData();
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Standardize title management
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { 
        title: 'Database Prospek', 
        sub: 'Direktori seluruh data prospek beserta aktivitas followup dan kategorinya' 
      } 
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);
  const [filterType, setFilterType] = useState<'all' | 'nocontact' | 'old30'>('all');
  const [filterSales, setFilterSales] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('all');
  
  // Pagination State
  const [viewAll, setViewAll] = useState(false);

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

  // 1. FILTER LOGIC (Synchronized)
  const filteredProspek = prospekWithStats
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

  const filteredCustomers = customers
    .filter(c => filterSales === 'All' || c.sales_pic === filterSales)
    .filter(c => {
      if (filterDate === 'all') return true;
      const t = new Date(c.tanggal_join || c.created_at || 0).getTime();
      if (filterDate === 'today') return t >= todayMs;
      if (filterDate === 'week') return t >= weekMs;
      if (filterDate === 'month') return t >= monthMs;
      return true;
    })
    .filter(c => c.nama_toko.toLowerCase().includes(search.toLowerCase()) || getSalesName(c.sales_pic).toLowerCase().includes(search.toLowerCase()));

  // 2. CALCULATE KPIs FROM FILTERED DATA
  const syncClosingCount = filteredCustomers.length;
  const syncActiveCount = filteredProspek.length;
  const syncTotalCount = syncClosingCount + syncActiveCount;
  const syncOverdueCount = filteredProspek.filter(p => p.ageMs > thirtyDaysMs).length;

  const sortedFiltered = filteredProspek.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pagedProspek = useMemo(() => {
    if (viewAll) return sortedFiltered;
    return sortedFiltered.slice(0, 20);
  }, [sortedFiltered, viewAll]);

  return (
    <div className="mgr-page">
          
      {/* A. MASTER FILTER BAR (TOP POSITION) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '12px 20px',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px', gap: '12px', flex: 1, minWidth: '250px' }}>
          <Search size={16} color="#94a3b8" />
          <input 
            placeholder="Cari toko atau sales..." 
            value={search} 
            onChange={e => {setSearch(e.target.value);}} 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '12px' }}>
            <span style={{ fontSize: '18px' }}>📅</span>
            <select 
              value={filterDate} 
              onChange={e => {setFilterDate(e.target.value);}}
              style={{ border: 'none', outline: 'none', fontSize: '13px', fontWeight: 700, color: '#475569', background: 'transparent' }}
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '12px' }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <select 
              value={filterSales} 
              onChange={e => {setFilterSales(e.target.value);}}
              style={{ border: 'none', outline: 'none', fontSize: '13px', fontWeight: 700, color: '#475569', background: 'transparent' }}
            >
              <option value="All">Semua Sales</option>
              {sales.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* B. KPI GRID (SYNCHRONIZED) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        <StatCard 
          label="Total Prospek" 
          value={syncTotalCount} 
          gradient="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" 
          icon={<ShieldAlert size={26} color="white" />} 
        />
        <StatCard 
          label="Prospek Overdue" 
          value={syncOverdueCount} 
          gradient="linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" 
          icon={<Filter size={26} color="white" />} 
        />
        <StatCard 
          label="Belum Closing" 
          value={syncActiveCount} 
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" 
          icon={<User size={26} color="white" />} 
        />
        <StatCard 
          label="Total Closing" 
          value={syncClosingCount} 
          gradient="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" 
          icon={<CheckCircle2 size={26} color="white" />} 
        />
      </div>

      <div className="chart-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '24px 24px 12px 24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Database Prospek</h2>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <UserCheck size={14} color="#10b981" />
              {viewAll || sortedFiltered.length <= 20 ? (
                <>Menampilkan semua {sortedFiltered.length} data prospek</>
              ) : (
                <>Menampilkan 20 dari {sortedFiltered.length} data prospek</>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '12px', border: 'none', 
                 background: filterType === 'all' ? '#facc15' : '#f1f5f9', 
                 color: filterType === 'all' ? '#000' : '#64748b',
                 fontWeight: 800,
                 fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s'
               }}
               onClick={() => {setFilterType('all');}}
            >
              SEMUA <span style={{ background: filterType === 'all' ? '#000' : 'rgba(0,0,0,0.05)', color: filterType === 'all' ? '#facc15' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{totalCount}</span>
            </button>
            
            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '12px', border: 'none', 
                 background: filterType === 'nocontact' ? '#facc15' : '#f1f5f9', 
                 color: filterType === 'nocontact' ? '#000' : '#64748b',
                 fontWeight: 800,
                 fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s'
               }}
               onClick={() => {setFilterType('nocontact');}}
            >
              BELUM DIKONTAK <span style={{ background: filterType === 'nocontact' ? '#000' : 'rgba(0,0,0,0.05)', color: filterType === 'nocontact' ? '#facc15' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{nocontactCount}</span>
            </button>

            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '12px', border: 'none', 
                 background: filterType === 'old30' ? '#facc15' : '#f1f5f9', 
                 color: filterType === 'old30' ? '#000' : '#64748b',
                 fontWeight: 800,
                 fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s'
               }}
               onClick={() => {setFilterType('old30');}}
            >
              LEWAT 30 HARI <span style={{ background: filterType === 'old30' ? '#000' : 'rgba(0,0,0,0.05)', color: filterType === 'old30' ? '#facc15' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{old30Count}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'none' }}>
           {/* Legacy Filter Bar Removed */}
        </div>

        <div className="custom-table-container" style={{ padding: '0 24px 24px 24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Toko / PIC</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Area</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Sales PIC</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Followup</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Catatan</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Peringatan</th>
                <th style={{ textAlign: 'center', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedProspek.map((p: any) => {
                const isLate = p.ageMs > thirtyDaysMs;
                const ageDays = Math.floor(p.ageMs / (1000 * 60 * 60 * 24));
                
                let followupText = 'Belum di-followup';
                let followupTime = '';
                if (p.lastActivity) {
                  followupText = `Di ${p.lastActivity.tipe_aksi}`;
                  followupTime = formatDistanceToNow(new Date(p.lastActivity.timestamp), { addSuffix: true, locale: id });
                }

                return (
                  <tr key={p.id} style={{ transition: 'all 0.2s' }}>
                    <td style={{ padding: '16px 20px', background: '#fff', borderRadius: '24px 0 0 24px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                          {p.foto_profil ? (
                            <img src={p.foto_profil} alt="" style={{ width: 44, height: 44, borderRadius: '14px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                              <User size={20} />
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '14px', letterSpacing: '-0.3px' }}>{p.nama_toko}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{p.nama_pic}</div>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }} />
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Phone size={10} /> {p.no_wa}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                        <MapPin size={14} color="#3b82f6" />
                        {p.area}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.3px' }}>{p.salesName.toUpperCase()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      {p.lastActivity ? (
                        <div>
                          <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             {followupText}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>{followupTime}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>Belum ada log</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '6px 12px', 
                        borderRadius: '10px', 
                        fontSize: '11px', 
                        fontWeight: 900,
                        background: p.status === 'Hot' ? '#fef2f2' : p.status === 'Warm' ? '#fffbeb' : '#f0f9ff',
                        color: p.status === 'Hot' ? '#ef4444' : p.status === 'Warm' ? '#f59e0b' : '#0ea5e9',
                        border: `1px solid ${p.status === 'Hot' ? '#fee2e2' : p.status === 'Warm' ? '#fef3c7' : '#e0f2fe'}`
                      }}>
                        {p.status.toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', maxWidth: '200px' }}>
                      <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                        {p.lastActivity?.catatan_hasil || <span style={{ color: '#cbd5e1' }}>-</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      {isLate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', background: '#fffbeb', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, border: '1px solid #fef3c7' }}>
                          <ShieldAlert size={12}/> LAMA ({ageDays}d)
                        </div>
                      ) : p.contactCount === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', background: '#fef2f2', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, border: '1px solid #fee2e2' }}>
                          <ShieldAlert size={12}/> NO CONTACT
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, border: '1px solid #d1fae5' }}>
                          <CheckCircle2 size={12}/> AKTIF
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', borderRadius: '0 24px 24px 0', border: '1px solid #f1f5f9', borderLeft: 'none', textAlign: 'center' }}>
                      {p.lastActivity?.geotagging?.photo ? (
                        <div 
                          style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer', margin: '0 auto', border: '2px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} 
                          onClick={() => window.open(p.lastActivity!.geotagging!.photo, '_blank')}
                        >
                          <img src={p.lastActivity.geotagging.photo} alt="bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', margin: '0 auto' }}>
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProspek.length === 0 && (
                <tr><td colSpan={9} className="empty-row">Tidak ada data prospek.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* VIEW ALL TOGGLE (BOTTOM RIGHT) */}
        {sortedFiltered.length > 20 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px 24px' }}>
            <button
              onClick={() => { setViewAll(!viewAll); }}
              style={{
                padding: '10px 24px',
                borderRadius: '14px',
                border: '1.5px solid #f1f5f9',
                background: viewAll ? '#f1f5f9' : '#fff',
                color: '#1e293b',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {viewAll ? (
                <>TUTUP VIEW ALL</>
              ) : (
                <>VIEW ALL ({sortedFiltered.length})</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
