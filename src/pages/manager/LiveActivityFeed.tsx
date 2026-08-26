import React, { useState, useEffect, useMemo } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { store } from '../../store/dataStore';
import { MessageSquare, MapPin, Phone, Search, Image as ImageIcon, ShoppingCart, X, ChevronRight, User, Filter } from 'lucide-react';

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

export default function LiveActivityFeed() {
  const { activities, allSales, masterAreas } = useSalesData();
  const [filterSales, setFilterSales] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [search, setSearch] = useState('');

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

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const getSalesName = (id: string) => allSales.find(s => s.id == id || (Number(s.id) === Number(id) && id !== ''))?.nama || id;

  const [now] = useState(new Date());
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekMs = todayMs - (7 * 86400000);
  const monthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filtered = useMemo(() => {
    const acts = activities || [];
    return acts
      .filter(a => {
        if (filterSales !== 'all') return a.id_sales == filterSales;
        if (areaFilter !== 'all') {
          const s = allSales.find(x => x.id == a.id_sales);
          return s && s.area === areaFilter;
        }
        return true;
      })
      .filter(a => {
        if (dateFilter === 'all') return true;
        const t = new Date(a.timestamp || 0).getTime();
        if (dateFilter === 'today') return t >= todayMs;
        if (dateFilter === 'week') return t >= weekMs;
        if (dateFilter === 'month') return t >= monthMs;
        return true;
      })
      .filter(a => 
        (a.target_nama || '').toLowerCase().includes(search.toLowerCase()) || 
        getSalesName(a.id_sales).toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, filterSales, areaFilter, dateFilter, search, todayMs, weekMs, monthMs, allSales]);

  useEffect(() => {
    const event = new CustomEvent('setMgrTitle', { 
      detail: { title: 'Data Activity', sub: 'Laporan tabel aktivitas tim lapangan' } 
    });
    window.dispatchEvent(event);
  }, []);

  const currentData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="mgr-page" style={{ background: '#f8fafc', padding: '0px 0 24px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* MASTER FILTER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
             <h2 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0 }}>Data Activity</h2>
             <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                Menampilkan {currentData.length} dari {filtered.length} data aktivitas
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#fff', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 800, fontSize: '12px', marginRight: '4px' }}>
              <Filter size={14} /> FILTER
            </div>
            
            <select 
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#1e293b', fontWeight: 700, cursor: 'pointer', background: '#f8fafc', minWidth: '140px' }}
              value={dateFilter} 
              onChange={(e) => {setDateFilter(e.target.value as any); setPage(1);}}
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
            </select>
            
            <select 
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#1e293b', fontWeight: 700, cursor: 'pointer', background: '#f8fafc', minWidth: '140px' }}
              value={areaFilter} 
              onChange={(e) => {setAreaFilter(e.target.value); setPage(1);}}
            >
              <option value="all">Semua Wilayah</option>
              {(masterAreas || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            <select 
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#1e293b', fontWeight: 700, cursor: 'pointer', background: '#f8fafc', minWidth: '160px' }}
              value={filterSales} 
              onChange={(e) => {setFilterSales(e.target.value); setPage(1);}}
            >
              <option value="all">Semua Sales</option>
              {allSales.filter(s => areaFilter === 'all' || s.area === areaFilter).map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
            
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#1e293b', fontWeight: 600, background: '#f8fafc' }}
                placeholder="Cari toko / sales..." 
                value={search} 
                onChange={e => {setSearch(e.target.value); setPage(1);}} 
              />
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          padding: '0'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '24px 24px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>WAKTU</th>
                <th style={{ padding: '24px 24px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SALESNAME</th>
                <th style={{ padding: '24px 24px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>JENIS AKTIVITAS</th>
                <th style={{ padding: '24px 24px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TARGET / TOKO</th>
                <th style={{ padding: '24px 24px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CATATAN</th>
                <th style={{ padding: '24px 24px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>FOTO</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 800 }}>Tidak ada data aktivitas.</td>
                </tr>
              ) : (
                currentData.map(a => {
                  const dateObj = new Date(a.timestamp);
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'all 0.2s' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ position: 'relative' }}>
                             <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                               <User size={18} />
                             </div>
                             <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff' }} />
                           </div>
                           <div>
                             <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                             <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                         <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                           <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
                           <span style={{ fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                             {getSalesName(a.id_sales)}
                           </span>
                         </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                         <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px', alignItems: 'center', gap: '6px' }}>
                           {ACT_ICON[a.tipe_aksi]} {getActLabel(a.tipe_aksi)}
                         </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                           <MapPin size={14} color="#3b82f6" /> {a.target_nama}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginLeft: '20px', marginTop: '2px' }}>{a.target_type}</div>
                      </td>
                      <td style={{ padding: '16px 24px', maxWidth: '300px' }}>
                        <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, lineHeight: 1.5 }}>
                          {a.catatan_hasil || <span style={{ color: '#cbd5e1' }}>Belum ada log</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => handleViewPhoto(a, getSalesName(a.id_sales), a.target_nama)}
                            style={{
                              width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0',
                              background: '#fff', color: isLoadingPhoto === a.id ? '#2563EB' : '#cbd5e1',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isLoadingPhoto === a.id ? <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #cbd5e1', borderTopColor: '#2563EB', borderRadius: '50%' }} /> : <ImageIcon size={16} />}
                          </button>
                          <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}>
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#fff', borderTop: '1px solid #f8fafc' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Menampilkan {currentData.length} dari {filtered.length} aktivitas</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '12px', fontWeight: 800, color: '#64748b', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                  disabled={page === 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >Prev</button>
                
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>
                  {page} / {Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                </span>
                
                <button 
                  style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '12px', fontWeight: 800, color: '#64748b', cursor: page === Math.ceil(filtered.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer', opacity: page === Math.ceil(filtered.length / ITEMS_PER_PAGE) ? 0.5 : 1 }}
                  disabled={page === Math.ceil(filtered.length / ITEMS_PER_PAGE)} 
                  onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / ITEMS_PER_PAGE), p + 1))}
                >Next</button>
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
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Activity Log</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>{selectedImage.store}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#2563EB', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    {selectedImage.note || 'Belum ada catatan.'}
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
