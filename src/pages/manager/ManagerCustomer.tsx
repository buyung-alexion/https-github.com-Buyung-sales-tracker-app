import { useState, useMemo, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { Search, Image as ImageIcon, MapPin, Briefcase, Phone, UserCheck, Tag, ShoppingCart, User, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as dateFnsId } from 'date-fns/locale';

const CustomerOverviewCharts = ({ customers, salesData }: { customers: any[], salesData: any[] }) => {
  // 1. Chart: Customer By Sales (Pill Design)
  const salesStats = useMemo(() => {
    return salesData.map(s => {
      const count = customers.filter(c => c.sales_pic === s.id).length;
      return {
        id: s.id,
        nama: s.nama.split(' ')[0].toUpperCase(),
        count
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5); // top 5
  }, [customers, salesData]);

  const maxSales = Math.max(1, ...salesStats.map(s => s.count));

  // 2. Data Aktif vs Non Aktif (Berdasarkan Order Terakhir)
  const activeCount = customers.filter(c => {
    if (!c.last_order_date) return false;
    const diffDays = (new Date().getTime() - new Date(c.last_order_date).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 14;
  }).length;
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

  const maxArea = Math.max(1, ...areaStats.map(s => s.count));
  const maxCat = Math.max(1, ...catStats.map(s => s.count));

  const cardStyle = { background: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' as const, minHeight: '340px', border: '1px solid #f8fafc' };
  const titleStyle = { fontSize: '18px', fontWeight: 900, color: '#1e293b', textAlign: 'left' as const, margin: 0 };
  const subTitleStyle = { fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '24px' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
      
      {/* Chart 1: Customer By Sales (Modern Pill Design) */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={titleStyle}>Customer By Sales</h3>
          <div style={subTitleStyle}>SEBARAN CUSTOMER PER SALES</div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
          {salesStats.map((s, idx) => {
            const heightPercent = (s.count / maxSales) * 100;
            const gradients = [
              'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
              'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)',
              'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
              'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
              'linear-gradient(180deg, #10b981 0%, #059669 100%)'
            ];
            
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                {/* Total Customer Badge */}
                <div style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 950, color: '#475569', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  {s.count} Toko
                </div>

                {/* Pillar Bar */}
                <div style={{ 
                  width: '32px', 
                  height: '160px', 
                  background: '#f8fafc', 
                  borderRadius: '100px', 
                  position: 'relative', 
                  overflow: 'hidden',
                  border: '1px solid #f1f5f9'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    height: `${heightPercent}%`, 
                    background: gradients[idx % gradients.length], 
                    borderRadius: '100px',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
                  }} />
                </div>

                {/* Name Badge */}
                <div style={{ 
                  background: '#f59e0b', 
                  padding: '6px 14px', 
                  borderRadius: '100px', 
                  fontSize: '11px', 
                  fontWeight: 950, 
                  color: '#1e293b',
                  boxShadow: '0 6px 15px -3px rgba(245, 158, 11, 0.4)',
                  whiteSpace: 'nowrap'
                }}>
                  {s.nama}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Retention Status (Donut) */}
      <div style={cardStyle}>
        <h3 style={{ ...titleStyle, textAlign: 'center' }}>Retention Status</h3>
        <div style={{ ...subTitleStyle, textAlign: 'center' }}>Status Keaktifan Toko</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="nonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="42" fill="none" 
                stroke="url(#nonGrad)" strokeWidth="8" 
                strokeDasharray={`${263.8}`} 
                strokeDashoffset={`${(activePercent / 100) * 263.8}`} 
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              />
              <circle 
                cx="50" cy="50" r="42" fill="none" 
                stroke="url(#activeGrad)" strokeWidth="10" 
                strokeDasharray={`${(activePercent / 100) * 263.8} 263.8`} 
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease-in-out', filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 950, color: '#1e293b', lineHeight: '1' }}>{customers.length}</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>
               <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Aktif
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
               <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Non-Aktif
             </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Customer By Area (Horizontal Bars) */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>Customer By Area</h3>
        <div style={subTitleStyle}>SEBARAN WILAYAH</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          {areaStats.map((a, idx) => {
             const widthPercent = Math.max(10, (a.count / maxArea) * 100);
             const colors = ['#6366f1', '#a855f7', '#f59e0b', '#3b82f6', '#10b981'];
             return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                    <span>{a.name}</span>
                    <span style={{ color: colors[idx % colors.length] }}>{a.count} <span style={{fontSize: '9px', opacity: 0.6}}>toko</span></span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', width: `${widthPercent}%`, 
                      background: colors[idx % colors.length], 
                      borderRadius: '100px',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)'
                    }} />
                  </div>
                </div>
             )
          })}
        </div>
      </div>

      {/* Chart 4: By Category (Vertical Bars) */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>By Category</h3>
        <div style={subTitleStyle}>SEGMENTASI TOKO</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px', marginTop: 'auto' }}>
          {catStats.map((c, idx) => {
            const heightPercent = Math.max(10, (c.count / maxCat) * 100);
            const gradients = [
              'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
              'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)',
              'linear-gradient(180deg, #ec4899 0%, #db2777 100%)',
              'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)'
            ];
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>{c.count}</div>
                <div style={{ width: '14px', height: '110px', background: '#f1f5f9', borderRadius: '100px', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${heightPercent}%`, background: gradients[idx % gradients.length], borderRadius: '100px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', width: '45px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default function ManagerCustomer() {
  const { customers: rawCustomers, sales, activities } = useSalesData();
  const [search, setSearch] = useState('');
  const [filterSales, setFilterSales] = useState('All');
  const [filterArea, setFilterArea] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewAll, setViewAll] = useState(false);
  const [filterRetention, setFilterRetention] = useState('All');

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { 
        title: 'Direktori Customer', 
        sub: 'Monitoring retention, segmentasi wilayah, dan performa salesman terhadap customer' 
      } 
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  const areas = useMemo(() => {
    const set = new Set<string>();
    rawCustomers.forEach(c => { if (c.area) set.add(c.area); });
    return Array.from(set).sort();
  }, [rawCustomers]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rawCustomers.forEach(c => { if (c.kategori) set.add(c.kategori); });
    return Array.from(set).sort();
  }, [rawCustomers]);

  const filteredCustomers = useMemo(() => {
    return rawCustomers.filter(c => {
      const matchSearch = c.nama_toko.toLowerCase().includes(search.toLowerCase()) || 
                          (c.no_wa && c.no_wa.toLowerCase().includes(search.toLowerCase())) ||
                          (c.area && c.area.toLowerCase().includes(search.toLowerCase()));
      const matchSales = filterSales === 'All' || c.sales_pic === filterSales;
      const matchArea = filterArea === 'All' || c.area === filterArea;
      const matchCat = filterCategory === 'All' || c.kategori === filterCategory;
      
      // Retention Filter Logic
      let matchRetention = true;
      if (filterRetention !== 'All') {
        const diffDays = c.last_order_date ? (new Date().getTime() - new Date(c.last_order_date).getTime()) / (1000 * 3600 * 24) : 999;
        const isActive = diffDays <= 14;
        matchRetention = filterRetention === 'Aktif' ? isActive : !isActive;
      }

      return matchSearch && matchSales && matchArea && matchCat && matchRetention;
    });
  }, [rawCustomers, search, filterSales, filterArea, filterCategory, filterRetention]);

  // Tab Counts Logic (Filtered by other Master Filters only)
  const tabCounts = useMemo(() => {
    const base = rawCustomers.filter(c => {
      const matchSearch = c.nama_toko.toLowerCase().includes(search.toLowerCase()) || 
                          (c.no_wa && c.no_wa.toLowerCase().includes(search.toLowerCase())) ||
                          (c.area && c.area.toLowerCase().includes(search.toLowerCase()));
      const matchSales = filterSales === 'All' || c.sales_pic === filterSales;
      const matchArea = filterArea === 'All' || c.area === filterArea;
      const matchCat = filterCategory === 'All' || c.kategori === filterCategory;
      return matchSearch && matchSales && matchArea && matchCat;
    });

    const active = base.filter(c => {
      const diffDays = c.last_order_date ? (new Date().getTime() - new Date(c.last_order_date).getTime()) / (1000 * 3600 * 24) : 999;
      return diffDays <= 14;
    }).length;

    return {
      all: base.length,
      active: active,
      nonActive: base.length - active
    };
  }, [rawCustomers, search, filterSales, filterArea, filterCategory]);

  const customerWithStats = useMemo(() => {
    return filteredCustomers.map(c => {
      const cActs = activities.filter(a => a.target_id === c.id);
      cActs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return {
        ...c,
        lastAct: cActs.length > 0 ? cActs[0] : null,
        salesName: sales.find(s => s.id === c.sales_pic)?.nama || 'No PIC'
      };
    });
  }, [filteredCustomers, activities, sales]);

  const pagedCustomers = useMemo(() => {
    if (viewAll) return customerWithStats;
    return customerWithStats.slice(0, 20);
  }, [customerWithStats, viewAll]);


  return (
    <div className="mgr-page" style={{ padding: '0 0 40px 0' }}>
      
      {/* MASTER FILTER BAR */}
      <div style={{ 
        background: '#fff', 
        padding: '24px', 
        borderRadius: '32px', 
        marginBottom: '32px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        border: '1px solid #f8fafc'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Cari nama toko..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 14px 14px 48px', 
              borderRadius: '16px', 
              border: '1px solid #f1f5f9', 
              fontSize: '14px', 
              background: '#f8fafc',
              fontWeight: 750,
              color: '#1e293b'
            }}
          />
        </div>

        <div style={{ width: '1px', height: '40px', background: '#f1f5f9' }} />

        {/* Filter by Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={18} color="#3b82f6" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Filter Area</span>
            <select 
              value={filterArea} 
              onChange={(e) => setFilterArea(e.target.value)}
              style={{ 
                padding: '0', 
                border: 'none', 
                background: 'transparent', 
                fontSize: '14px', 
                fontWeight: 950, 
                color: '#1e293b', 
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All">Semua Wilayah</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div style={{ width: '1px', height: '40px', background: '#f1f5f9' }} />

        {/* Filter by Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={18} color="#ec4899" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Segmentasi</span>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ 
                padding: '0', 
                border: 'none', 
                background: 'transparent', 
                fontSize: '14px', 
                fontWeight: 950, 
                color: '#1e293b', 
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All">Semua Kategori</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ width: '1px', height: '40px', background: '#f1f5f9' }} />

        {/* Filter by Sales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={18} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Filter Sales</span>
            <select 
              value={filterSales} 
              onChange={(e) => setFilterSales(e.target.value)}
              style={{ 
                padding: '0', 
                border: 'none', 
                background: 'transparent', 
                fontSize: '14px', 
                fontWeight: 950, 
                color: '#1e293b', 
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All">Semua Sales</option>
              {sales.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
        </div>
      </div>

      <CustomerOverviewCharts 
        customers={filteredCustomers} 
        salesData={sales} 
      />

      {/* TABLE SECTION */}
      <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid #f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Database Customer</h2>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <UserCheck size={14} color="#10b981" />
              {viewAll || filteredCustomers.length <= 20 ? (
                <>Menampilkan semua {filteredCustomers.length} mitra toko aktif</>
              ) : (
                <>Menampilkan 20 dari {filteredCustomers.length} mitra toko aktif</>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '12px', border: 'none', 
                 background: filterRetention === 'All' ? '#facc15' : '#f1f5f9', 
                 color: filterRetention === 'All' ? '#000' : '#64748b',
                 fontWeight: 800,
                 fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s'
               }}
               onClick={() => {setFilterRetention('All'); setViewAll(false);}}
            >
              SEMUA <span style={{ background: filterRetention === 'All' ? '#000' : 'rgba(0,0,0,0.05)', color: filterRetention === 'All' ? '#facc15' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{tabCounts.all}</span>
            </button>
            
            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '12px', border: 'none', 
                 background: filterRetention === 'Non-Aktif' ? '#facc15' : '#f1f5f9', 
                 color: filterRetention === 'Non-Aktif' ? '#000' : '#64748b',
                 fontWeight: 800,
                 fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s'
               }}
               onClick={() => {setFilterRetention('Non-Aktif'); setViewAll(false);}}
            >
              NON-AKTIF <span style={{ background: filterRetention === 'Non-Aktif' ? '#000' : 'rgba(0,0,0,0.05)', color: filterRetention === 'Non-Aktif' ? '#facc15' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{tabCounts.nonActive}</span>
            </button>

            <button 
               style={{ 
                 padding: '10px 18px', borderRadius: '12px', border: 'none', 
                 background: filterRetention === 'Aktif' ? '#facc15' : '#f1f5f9', 
                 color: filterRetention === 'Aktif' ? '#000' : '#64748b',
                 fontWeight: 800,
                 fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                 transition: 'all 0.2s'
               }}
               onClick={() => {setFilterRetention('Aktif'); setViewAll(false);}}
            >
              AKTIF <span style={{ background: filterRetention === 'Aktif' ? '#000' : 'rgba(0,0,0,0.05)', color: filterRetention === 'Aktif' ? '#facc15' : '#475569', padding: '2px 6px', borderRadius: '8px', fontSize: '10px' }}>{tabCounts.active}</span>
            </button>
          </div>
        </div>

        <div className="custom-table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Toko / PIC</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Area</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Sales PIC</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Followup</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Last Order</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Catatan</th>
                <th style={{ textAlign: 'left', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Retention</th>
                <th style={{ textAlign: 'center', padding: '0 20px 12px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedCustomers.map(c => {
                const sName = c.salesName;
                const lastAct = c.lastAct;
                const diffOrderDays = c.last_order_date ? Math.floor((new Date().getTime() - new Date(c.last_order_date).getTime()) / (1000 * 3600 * 24)) : 999;

                return (
                  <tr key={c.id} style={{ transition: 'all 0.2s ease' }}>
                    <td style={{ padding: '16px 20px', background: '#fff', borderRadius: '24px 0 0 24px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                          {c.foto_profil ? (
                            <img src={c.foto_profil} alt="" style={{ width: 44, height: 44, borderRadius: '14px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                              <User size={20} />
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '14px', letterSpacing: '-0.3px' }}>{c.nama_toko}</div>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', background: '#f8fafc', padding: '2px 6px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                              #{c.id.substring(0, 8)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{c.nama_pic}</div>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }} />
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Phone size={10} /> {c.no_wa}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                        <MapPin size={14} color="#3b82f6" />
                        {c.area}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.3px' }}>{sName.toUpperCase()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      {lastAct ? (
                        <div>
                          <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             {lastAct.tipe_aksi === 'Order' ? 'Order Produk' : lastAct.tipe_aksi === 'Visit' ? 'Melakukan Kunjungan' : 'Menghubungi Toko'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>{formatDistanceToNow(new Date(lastAct.timestamp), { addSuffix: true, locale: dateFnsId })}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>Belum ada log</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingCart size={14} color="#d946ef" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>
                            {c.last_order_date ? formatDistanceToNow(new Date(c.last_order_date), { addSuffix: true, locale: dateFnsId }) : 'Belum Order'}
                          </div>
                          {c.last_order_date && (
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                              {new Date(c.last_order_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '6px 12px', 
                        borderRadius: '10px', 
                        fontSize: '11px', 
                        fontWeight: 900,
                        background: '#f0f9ff',
                        color: '#0ea5e9',
                        border: '1px solid #e0f2fe'
                      }}>
                        {(c.kategori || 'Retail').toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none', maxWidth: '200px' }}>
                      <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                        {lastAct?.catatan_hasil || <span style={{ color: '#cbd5e1' }}>-</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '6px 12px', 
                        borderRadius: '10px', 
                        fontSize: '11px', 
                        fontWeight: 800,
                        background: diffOrderDays <= 14 ? '#ecfdf5' : '#fef2f2',
                        color: diffOrderDays <= 14 ? '#10b981' : '#ef4444',
                        border: `1px solid ${diffOrderDays <= 14 ? '#d1fae5' : '#fee2e2'}`
                      }}>
                        <ShieldAlert size={12} style={{ marginRight: '6px' }}/> {diffOrderDays <= 14 ? 'AKTIF' : 'NON-AKTIF'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', background: '#fff', borderRadius: '0 24px 24px 0', border: '1px solid #f1f5f9', borderLeft: 'none', textAlign: 'center' }}>
                      {lastAct?.geotagging?.photo ? (
                        <div 
                          style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer', margin: '0 auto', border: '2px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} 
                          onClick={() => window.open(lastAct!.geotagging!.photo, '_blank')}
                        >
                          <img src={lastAct.geotagging.photo} alt="bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            </tbody>
          </table>
        </div>

        {/* VIEW ALL TOGGLE (BOTTOM RIGHT) */}
        {filteredCustomers.length > 20 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            padding: '20px 24px', 
            background: '#fcfcfc', 
            borderTop: '1px solid #f1f5f9', 
            borderRadius: '0 0 32px 32px' 
          }}>
            <button
              onClick={() => setViewAll(!viewAll)}
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
                <>VIEW ALL ({filteredCustomers.length})</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
