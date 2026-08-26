import { useState, useEffect, useMemo } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { Search, ShieldAlert, CheckCircle2, User, Image as ImageIcon, UserCheck, Phone, MapPin, X, ChevronRight } from 'lucide-react';
import { store } from '../../store/dataStore';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';





export default function ManagerProspek() {
  const { sales, allSales, prospek = [], activities, refresh, masterStatuses = [], customers, masterAreas, masterCategories, masterChannels } = useSalesData();

  const getStatusName = (idOrName: string) => {
    if (!idOrName) return 'Cold';
    const found = masterStatuses.find((s: any) => s.id === idOrName || s.name === idOrName);
    return found ? found.name : idOrName;
  };

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
  const [filterArea, setFilterArea] = useState<string>('All');

  // Modal States
  const [editModal, setEditModal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editForm, setEditForm] = useState({
    id: '',
    nama_toko: '',
    nama_pic: '',
    no_wa: '',
    area: '',
    status: 'Cold' as any,
    link_map: '',
    kategori: '',
    rating: 5,
    foto_profil: '',
    channel: ''
  });

  const [selectedImage, setSelectedImage] = useState<{ url: string, sales: string, store: string, timestamp: string, note: string } | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState<string | null>(null);

  const handleViewPhoto = async (act: any, sName: string, storeName: string) => {
    setIsLoadingPhoto(act.id);
    const photo = await store.fetchActivityPhoto(act.id);
    setIsLoadingPhoto(null);
    if (photo) {
      setSelectedImage({
        url: photo,
        sales: sName,
        store: storeName,
        timestamp: act.timestamp,
        note: act.catatan_hasil
      });
    } else {
      alert('Foto tidak tersedia untuk aktivitas ini.');
    }
  };

  // Pagination State
  const [viewAll, setViewAll] = useState(false);

  const getSalesName = (id: string) => allSales.find(s => s.id == id || (Number(s.id) === Number(id) && id !== ''))?.nama || id;

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = new Date().getTime();

  const prospekWithStats = useMemo(() => {
    return prospek.map(p => {
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
  }, [prospek, activities, allSales, nowMs]);

  const kpiStats = useMemo(() => {
    const nocontactCount = prospekWithStats.filter(p => p.contactCount === 0).length;
    const old30Count = prospekWithStats.filter(p => p.ageMs > thirtyDaysMs).length;

    const todayMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const weekMs = todayMs - (7 * 86400000);
    const monthMs = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    return { nocontactCount, old30Count, todayMs, weekMs, monthMs };
  }, [prospekWithStats, thirtyDaysMs]);

  const { nocontactCount, old30Count, todayMs, weekMs, monthMs } = kpiStats;

  // 1. FILTER LOGIC (Synchronized)
  const filteredData = useMemo(() => {
    const filteredP = prospekWithStats
      .filter(p => {
        if (filterType === 'all') return true;
        if (filterType === 'nocontact') return p.contactCount === 0;
        if (filterType === 'old30') return p.ageMs > thirtyDaysMs;
        return true;
      })
      .filter(p => {
        const isSalesRole = sales.some(s => s.id == p.sales_owner);
        const matchSales = filterSales === 'All' || p.sales_owner == filterSales;
        return isSalesRole && matchSales;
      })
      .filter(p => {
        if (filterDate === 'all') return true;
        const t = new Date(p.created_at).getTime();
        if (filterDate === 'today') return t >= todayMs;
        if (filterDate === 'week') return t >= weekMs;
        if (filterDate === 'month') return t >= monthMs;
        return true;
      })
      .filter(p => filterArea === 'All' || p.area === filterArea)
      .filter(p => !search || p.nama_toko.toLowerCase().includes(search.toLowerCase()) || (allSales.find(s => s.id == p.sales_owner || (Number(s.id) === Number(p.sales_owner) && p.sales_owner !== ''))?.nama || 'Unknown').toLowerCase().includes(search.toLowerCase()));

    // Filtered Customers (Converted from Prospek only)
    const filteredC = customers
      .filter(c => {
        const isSalesRole = sales.some(s => s.id == c.sales_pic);
        const matchSales = filterSales === 'All' || c.sales_pic == filterSales;
        return isSalesRole && matchSales;
      })
      .filter(c => filterArea === 'All' || c.area === filterArea)
      .filter(c => c.is_from_prospek !== false) // Include converted prospects (true) and legacy data (null), exclude direct inputs (false)
      .filter(c => {
        if (filterDate === 'all') return true;
        const t = new Date(c.tanggal_join || c.created_at || 0).getTime();
        if (filterDate === 'today') return t >= todayMs;
        if (filterDate === 'week') return t >= weekMs;
        if (filterDate === 'month') return t >= monthMs;
        return true;
      })
      .filter(c => !search || c.nama_toko.toLowerCase().includes(search.toLowerCase()) || (allSales.find(s => s.id == c.sales_pic || (Number(s.id) === Number(c.sales_pic) && c.sales_pic !== ''))?.nama || 'Unknown').toLowerCase().includes(search.toLowerCase()));

    return {
      filteredP: filteredP.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      filteredC
    };
  }, [prospekWithStats, customers, search, filterSales, filterArea, filterDate, filterType, todayMs, weekMs, monthMs, thirtyDaysMs, sales]);

  const { filteredP, filteredC } = filteredData;

  // 2. CALCULATE KPIs FROM FILTERED DATA
  const syncClosingCount = filteredC.length;
  const syncActiveCount = filteredP.length;
  const syncTotalCount = syncClosingCount + syncActiveCount;

  const sortedFiltered = filteredP;
  const pagedProspek = useMemo(() => {
    if (viewAll) return sortedFiltered;
    return sortedFiltered.slice(0, 20);
  }, [sortedFiltered, viewAll]);


  const handleOpenEdit = (p: any) => {
    setEditForm({
      id: p.id,
      nama_toko: p.nama_toko || '',
      nama_pic: p.nama_pic || '',
      no_wa: p.no_wa || '',
      area: p.area || 'SMD',
      status: p.status || 'Cold',
      link_map: p.link_map || '',
      kategori: p.kategori || 'Retail',
      rating: p.rating || 5,
      foto_profil: p.foto_profil || '',
      channel: p.channel || 'Canvasing'
    });
    setSaveError(null);
    setSaveSuccess(false);
    setEditModal(p);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(null);

    const payload = editForm;

    try {
      let error;
      if (editModal) {
        ({ error } = await store.updateProspek(editModal.id, payload));
      } else {
        error = { message: 'Invalid action' };
      }

      if (error) throw error;

      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setEditModal(null);
        setSaveSuccess(false);
      }, 1000);
    } catch (err: any) {
      setSaveError(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mgr-page">      {/* A. MASTER FILTER BAR (TOP POSITION) */}
      <div className="mgr-master-filter-bar">
        <div className="mgr-search-input-wrapper">
          <Search size={16} color="rgba(255,255,255,0.7)" />
          <input
            className="mgr-search-input"
            placeholder="Cari toko atau sales..."
            value={search}
            onChange={e => { setSearch(e.target.value); }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="mgr-filter-item">
            <span style={{ fontSize: '18px' }}>📅</span>
            <select
              className="mgr-filter-select"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); }}
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
            </select>
          </div>

          <div className="mgr-filter-divider" />

          <div className="mgr-filter-item">
            <span style={{ fontSize: '18px' }}>📍</span>
            <select
              className="mgr-filter-select"
              value={filterArea}
              onChange={e => { setFilterArea(e.target.value); }}
            >
              <option value="All">Semua Wilayah</option>
              {masterAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="mgr-filter-divider" />

          <div className="mgr-filter-item">
            <span style={{ fontSize: '18px' }}>👤</span>
            <select
              className="mgr-filter-select"
              value={filterSales}
              onChange={e => { setFilterSales(e.target.value); }}
            >
              <option value="All">Semua Sales</option>
              {sales.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
        </div>
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
                background: filterType === 'all' ? '#2563EB' : '#f1f5f9',
                color: filterType === 'all' ? '#fff' : '#64748b',
                fontWeight: 800,
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
              onClick={() => { setFilterType('all'); }}
            >
              SEMUA <span style={{ background: filterType === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: filterType === 'all' ? '#fff' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{syncTotalCount}</span>
            </button>

            <button
              style={{
                padding: '10px 18px', borderRadius: '12px', border: 'none',
                background: filterType === 'nocontact' ? '#2563EB' : '#f1f5f9',
                color: filterType === 'nocontact' ? '#fff' : '#64748b',
                fontWeight: 800,
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
              onClick={() => { setFilterType('nocontact'); }}
            >
              BELUM DIKONTAK <span style={{ background: filterType === 'nocontact' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: filterType === 'nocontact' ? '#fff' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{nocontactCount}</span>
            </button>

            <button
              style={{
                padding: '10px 18px', borderRadius: '12px', border: 'none',
                background: filterType === 'old30' ? '#2563EB' : '#f1f5f9',
                color: filterType === 'old30' ? '#fff' : '#64748b',
                fontWeight: 800,
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
              onClick={() => { setFilterType('old30'); }}
            >
              LEWAT 30 HARI <span style={{ background: filterType === 'old30' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: filterType === 'old30' ? '#fff' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{old30Count}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'none' }}>
          {/* Legacy Filter Bar Removed */}
        </div>

        <div className="custom-table-container" style={{ padding: '0 24px 24px 24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Toko / PIC</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Area</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kategori</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales PIC</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Followup</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Catatan</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peringatan</th>
                <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedProspek.map((p: any, idx: number) => {
                const isLate = p.ageMs > thirtyDaysMs;
                const ageDays = Math.floor(p.ageMs / (1000 * 60 * 60 * 24));

                let followupText = 'Belum di-followup';
                let followupTime = '';
                if (p.lastActivity) {
                  followupText = `Di ${p.lastActivity.tipe_aksi}`;
                  followupTime = formatDistanceToNow(new Date(p.lastActivity.timestamp), { addSuffix: true, locale: id });
                }

                return (
                  <tr key={p.id} style={{ transition: 'all 0.2s', borderBottom: '1px solid #f1f5f9', animationDelay: `${idx * 0.05}s` }} className="premium-row animate-fade-up">
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '14px', letterSpacing: '-0.3px' }}>{p.nama_toko}</div>
                          </div>
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
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                        <MapPin size={14} color="#3b82f6" />
                        {masterAreas.find(ma => ma.id == p.area || (Number(ma.id) === Number(p.area) && p.area !== ''))?.name || p.area || 'Unknown'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                       <div style={{ 
                         display: 'inline-flex', 
                         alignItems: 'center', 
                         padding: '4px 10px', 
                         borderRadius: '8px', 
                         fontSize: '11px', 
                         fontWeight: 900,
                         background: '#f8fafc',
                         color: '#64748b',
                         border: '1px solid #e2e8f0',
                         textTransform: 'uppercase'
                       }}>
                         {masterCategories.find(mc => mc.id == p.kategori || (Number(mc.id) === Number(p.kategori) && p.kategori !== ''))?.name || p.kategori || 'Retail'}
                       </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.3px' }}>{p.salesName.toUpperCase()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
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
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 900,
                        background: getStatusName(p.status) === 'Hot' ? '#fef2f2' : getStatusName(p.status) === 'Warm' ? 'rgba(238, 77, 45, 0.05)' : '#f0f9ff',
                        color: getStatusName(p.status) === 'Hot' ? '#ef4444' : getStatusName(p.status) === 'Warm' ? '#2563EB' : '#0ea5e9',
                        border: `1px solid ${getStatusName(p.status) === 'Hot' ? '#fee2e2' : getStatusName(p.status) === 'Warm' ? 'rgba(238, 77, 45, 0.1)' : '#e0f2fe'}`
                      }}>
                        {getStatusName(p.status).toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', maxWidth: '200px' }}>
                      <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                        {p.lastActivity?.catatan_hasil || <span style={{ color: '#cbd5e1' }}>-</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      {isLate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', background: '#fffbeb', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, border: '1px solid #fef3c7' }}>
                          <ShieldAlert size={12} /> LAMA ({ageDays}d)
                        </div>
                      ) : p.contactCount === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', background: '#fef2f2', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, border: '1px solid #fee2e2' }}>
                          <ShieldAlert size={12} /> NO CONTACT
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, border: '1px solid #d1fae5' }}>
                          <CheckCircle2 size={12} /> AKTIF
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        {p.lastActivity ? (
                          <div 
                            style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' }} 
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => handleViewPhoto(p.lastActivity, p.salesName, p.nama_toko)}
                            title="Lihat Foto"
                          >
                            {isLoadingPhoto === p.lastActivity.id ? <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%' }} /> : <ImageIcon size={16} color={p.lastActivity.tipe_aksi === 'Visit' || p.lastActivity.tipe_aksi === 'Order' ? '#3b82f6' : '#cbd5e1'} />}
                          </div>
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredP.length === 0 && (
                <tr><td colSpan={9} className="empty-row">Tidak ada data prospek.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => setViewAll(!viewAll)}
            style={{ padding: '10px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '12px', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}
          >
            {viewAll ? 'LIHAT LEBIH SEDIKIT' : 'TAMPILKAN SEMUA'}
          </button>
        </div>
      </div>

      <ProspectModal 
        isOpen={!!editModal}
        onClose={() => { setEditModal(null); }}
        form={editForm}
        setForm={setEditForm}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        saveError={saveError}
        saveSuccess={saveSuccess}
        masterAreas={masterAreas}
        masterCategories={masterCategories}
        masterChannels={masterChannels}
      />

      {/* PHOTO VIEWER MODAL - PREMIUM */}
      {selectedImage && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, animation: 'fade-in 0.3s ease', padding: '40px'
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
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Log Aktivitas Prospek</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>{selectedImage.store}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#2563EB', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{selectedImage.sales}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Field Salesman</div>
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
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Waktu Pelaporan</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#475569' }}>
                        {new Date(selectedImage.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • {new Date(selectedImage.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
               </div>

               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Catatan Lapangan</div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '13px', lineHeight: 1.6, color: '#475569', fontWeight: 600 }}>
                    {selectedImage.note || 'Tidak ada catatan hasil survey.'}
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

// Add/Edit Prospect Modal
function ProspectModal({ isOpen, onClose, form, setForm, onSave, isSubmitting, saveError, saveSuccess, masterAreas = [], masterCategories = [], masterChannels = [] }: any) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #f1f5f9', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: '#f8fafc', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          Edit Prospek
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px 0', fontWeight: 600 }}>
          Perbarui informasi data prospek lapangan
        </p>

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Toko Prospek *</label>
            <input 
              required
              value={form.nama_toko}
              onChange={e => setForm({...form, nama_toko: e.target.value})}
              placeholder="Masukkan calon nama toko..."
              style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>PIC Prospek</label>
              <input 
                required
                value={form.nama_pic}
                onChange={e => setForm({...form, nama_pic: e.target.value})}
                placeholder="Calon pemilik..."
                style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>No WA Aktif *</label>
              <input 
                required
                value={form.no_wa}
                onChange={e => setForm({...form, no_wa: e.target.value})}
                placeholder="62812..."
                style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Area</label>
              <select 
                value={form.area}
                onChange={e => setForm({ ...form, area: e.target.value })}
                style={{ flex: 1, padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#fff' }}
              >
                <option value="">-- Pilih Area --</option>
                {masterAreas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Kategori</label>
              <select 
                value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}
                style={{ flex: 1, padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#fff' }}
              >
                <option value="">-- Pilih Kategori --</option>
                {masterCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Status Prospek</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Cold', 'Warm', 'Hot'].map(s => (
                <button 
                  key={s}
                  type="button"
                  onClick={() => setForm({...form, status: s as any})}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '12px', 
                    border: form.status === s ? '2px solid #1e293b' : '2px solid #f1f5f9',
                    background: form.status === s ? '#f1f5f9' : '#fff',
                    fontSize: '12px', fontWeight: 800, color: form.status === s ? '#1e293b' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Sumber Prospek</label>
            <select 
              value={form.channel}
              onChange={e => setForm({ ...form, channel: e.target.value })}
              style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#fff' }}
            >
              <option value="">-- Pilih Sumber --</option>
              {masterChannels.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>{saveError}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ flex: 1, height: '52px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#fff', fontSize: '14px', fontWeight: 900, color: '#64748b', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ 
                flex: 2, height: '52px', borderRadius: '16px', border: 'none', 
                background: saveSuccess ? '#10b981' : '#1e293b', 
                color: '#fff', fontSize: '14px', fontWeight: 950, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {isSubmitting ? <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%' }} /> : 
               saveSuccess ? <><UserCheck size={18} /> Tersimpan!</> : 
               'Update Prospek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
