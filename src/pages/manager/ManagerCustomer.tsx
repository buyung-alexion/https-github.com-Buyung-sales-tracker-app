import { useState, useMemo, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { Search, ShieldAlert, User, Image as ImageIcon, UserCheck, Phone, MapPin, X, ChevronRight, Tag, Briefcase, ShoppingCart, TrendingUp, Target, Layers, Layout } from 'lucide-react';
import { store } from '../../store/dataStore';
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

  const cardStyle = { 
    background: 'rgba(255, 255, 255, 0.7)', 
    backdropFilter: 'blur(20px)',
    borderRadius: '32px', 
    padding: '30px', 
    boxShadow: '0 20px 50px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.8)', 
    display: 'flex', 
    flexDirection: 'column' as const, 
    minHeight: '380px', 
    border: 'none',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'default'
  };
  const titleStyle = { fontSize: '20px', fontWeight: 950, color: '#1e293b', textAlign: 'left' as const, margin: 0, letterSpacing: '-0.5px' };
  const subTitleStyle = { fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '1px', marginTop: '4px' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
      
      {/* Chart 1: Customer By Sales (Modern Pill Design) */}
      <div 
        style={cardStyle}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.8)'; }}
      >
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
            <TrendingUp size={20} color="#fff" />
          </div>
          <div>
            <h3 style={titleStyle}>Customer By Sales</h3>
            <div style={subTitleStyle}>SEBARAN PER SALESMAN</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', paddingBottom: '10px' }}>
          {salesStats.map((s, idx) => {
            const heightPercent = (s.count / maxSales) * 100;
            const gradients = [
              'linear-gradient(180deg, #6366f1 0%, #444ce7 100%)',
              'linear-gradient(180deg, #a855f7 0%, #9333ea 100%)',
              'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
              'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
              'linear-gradient(180deg, #10b981 0%, #059669 100%)'
            ];
            
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '40px' }}>
                <div style={{ fontSize: '12px', fontWeight: 950, color: '#1e293b' }}>{s.count}</div>
                <div style={{ 
                  width: '24px', 
                  height: '140px', 
                  background: '#f1f5f9', 
                  borderRadius: '100px', 
                  position: 'relative', 
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    height: `${heightPercent}%`, 
                    background: gradients[idx % gradients.length], 
                    borderRadius: '100px',
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.3)',
                    transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }} />
                </div>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '4px 10px', 
                  borderRadius: '8px', 
                  fontSize: '9px', 
                  fontWeight: 900, 
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  whiteSpace: 'nowrap'
                }}>
                  {s.nama}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Retention Status (Premium Donut) */}
      <div 
        style={cardStyle}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.8)'; }}
      >
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
            <Target size={20} color="#fff" />
          </div>
          <div>
            <h3 style={titleStyle}>Retention Status</h3>
            <div style={subTitleStyle}>KESEHATAN DATABASE</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle 
                cx="50" cy="50" r="42" fill="none" 
                stroke="url(#activeGrad)" strokeWidth="12" 
                strokeDasharray={`${(activePercent / 100) * 263.8} 263.8`} 
                strokeLinecap="round"
                filter="url(#glow)"
                style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '38px', fontWeight: 950, color: '#1e293b', lineHeight: '1', letterSpacing: '-1px' }}>{customers.length}</span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>TOTAL TOKO</span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', marginTop: '30px' }}>
             <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #dcfce7' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{activePercent}%</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Aktif</div>
                </div>
             </div>
             <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #fee2e2' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{100 - activePercent}%</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Low</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Customer By Area (Horizontal Progress) */}
      <div 
        style={cardStyle}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.8)'; }}
      >
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
            <Layers size={20} color="#fff" />
          </div>
          <div>
            <h3 style={titleStyle}>Customer By Area</h3>
            <div style={subTitleStyle}>DOMINASI WILAYAH</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          {areaStats.map((a, idx) => {
             const widthPercent = (a.count / maxArea) * 100;
             const colors = ['#6366f1', '#a855f7', '#f59e0b', '#3b82f6', '#10b981'];
             return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{a.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 950, color: colors[idx % colors.length] }}>{a.count} <small style={{fontSize: '9px', opacity: 0.6}}>TOKO</small></span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '100px', position: 'relative' }}>
                    <div style={{ 
                      height: '100%', width: `${widthPercent}%`, 
                      background: colors[idx % colors.length], 
                      borderRadius: '100px',
                      boxShadow: `0 4px 10px ${colors[idx % colors.length]}44`,
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>
             )
          })}
        </div>
      </div>

      {/* Chart 4: By Category (Layout Design) */}
      <div 
        style={cardStyle}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.8)'; }}
      >
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(236, 72, 153, 0.2)' }}>
            <Layout size={20} color="#fff" />
          </div>
          <div>
            <h3 style={titleStyle}>Segmentasi Toko</h3>
            <div style={subTitleStyle}>BERDASARKAN KATEGORI</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
          {catStats.map((c, idx) => {
            const colors = ['#f59e0b', '#a855f7', '#ec4899', '#6366f1'];
            return (
              <div key={idx} style={{ 
                background: '#f8fafc', 
                padding: '16px', 
                borderRadius: '20px', 
                border: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 950, color: colors[idx % colors.length] }}>{c.count}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.name}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default function ManagerCustomer() {
  const { customers: rawCustomers, sales, activities, masterAreas, masterCategories, refresh } = useSalesData();
  const [search, setSearch] = useState('');
  const [filterSales, setFilterSales] = useState('All');
  const [filterArea, setFilterArea] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewAll, setViewAll] = useState(false);
  const [filterRetention, setFilterRetention] = useState('All');
  
  // Modal States
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [addForm, setAddForm] = useState({
    nama_toko: '',
    nama_pic: '',
    no_wa: '',
    area: '',
    kategori: '',
    link_map: '',
    rating: 5,
    foto_profil: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    nama_toko: '',
    nama_pic: '',
    no_wa: '',
    area: '',
    kategori: '',
    link_map: '',
    rating: 5,
    foto_profil: ''
  });

  const [selectedImage, setSelectedImage] = useState<{ url: string, sales: string, store: string, timestamp: string, note: string } | null>(null);

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

  const handleOpenAdd = () => {
    setAddForm({
      nama_toko: '',
      nama_pic: '',
      no_wa: '',
      area: 'SMD',
      kategori: 'Retail',
      link_map: '',
      rating: 5,
      foto_profil: ''
    });
    setSaveError(null);
    setSaveSuccess(false);
    setAddModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditForm({
      id: c.id,
      nama_toko: c.nama_toko || '',
      nama_pic: c.nama_pic || '',
      no_wa: c.no_wa || '',
      area: c.area || 'SMD',
      kategori: c.kategori || 'Retail',
      link_map: c.link_map || '',
      rating: c.rating || 5,
      foto_profil: c.foto_profil || ''
    });
    setSaveError(null);
    setSaveSuccess(false);
    setEditModal(c);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(null);

    const payload = editModal ? editForm : addForm;

      try {
        let error;
        if (editModal) {
          ({ error } = await store.updateCustomer(editModal.id, payload));
        } else {
          ({ error } = await store.addCustomer({ 
            ...payload, 
            sales_pic: filterSales === 'All' ? 'm001' : filterSales,
            last_order_date: new Date().toISOString(),
            total_order_volume: 0
          }));
        }

        if (error) throw error;

        setSaveSuccess(true);
        await refresh();
        setTimeout(() => {
          setAddModal(false);
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
              {masterAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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
              {masterCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

        <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />

        {/* Action Button */}
        <button 
          onClick={handleOpenAdd}
          style={{ 
            height: '48px', 
            padding: '0 24px', 
            borderRadius: '16px', 
            background: '#1e293b', 
            color: '#fff', 
            border: 'none', 
            fontWeight: 900, 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(30, 41, 59, 0.15)',
            transition: 'all 0.2s ease',
            marginLeft: 'auto'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(30, 41, 59, 0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(30, 41, 59, 0.15)'; }}
        >
          <UserCheck size={18} color="#facc15" /> 
          TAMBAH CUSTOMER
        </button>
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
                        {c.area || 'Unknown'}
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        {lastAct?.geotagging?.photo ? (
                           <div 
                             style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s' }} 
                             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                             onClick={() => lastAct?.geotagging?.photo && setSelectedImage({
                               url: lastAct.geotagging.photo,
                               sales: sName,
                               store: c.nama_toko,
                               timestamp: lastAct.timestamp,
                               note: lastAct.catatan_hasil
                             })}
                           >
                             <img src={lastAct.geotagging.photo} alt="bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           </div>
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <button 
                          onClick={() => handleOpenEdit(c)}
                          style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* VIEW ALL TOGGLE (BOTTOM RIGHT) */}
        {filteredCustomers.length > 20 && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button 
               onClick={() => setViewAll(!viewAll)}
               style={{ padding: '10px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '12px', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}
            >
              {viewAll ? 'LIHAT LEBIH SEDIKIT' : 'TAMPILKAN SEMUA'}
            </button>
          </div>
        )}
      </div>

      <CustomerModal 
        isOpen={addModal || !!editModal}
        onClose={() => { setAddModal(false); setEditModal(null); }}
        customer={editModal}
        form={editModal ? editForm : addForm}
        setForm={editModal ? setEditForm : setAddForm}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        saveError={saveError}
        saveSuccess={saveSuccess}
        masterAreas={masterAreas}
        masterCategories={masterCategories}
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
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>History Aktivitas Toko</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>{selectedImage.store}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#facc15', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{selectedImage.sales}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Field Salesman PIC</div>
                    </div>
                  </div>
               </div>

               <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }} />

               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <ShoppingCart size={14} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Waktu Aktivitas Order</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#475569' }}>
                        {new Date(selectedImage.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • {new Date(selectedImage.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
               </div>

               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Daftar Pesanan / Note</div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '13px', lineHeight: 1.6, color: '#475569', fontWeight: 600 }}>
                    {selectedImage.note || 'Tidak ada catatan pesanan tercatat.'}
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

// Add/Edit Modal (Premium Manager Style)
function CustomerModal({ isOpen, onClose, customer, form, setForm, onSave, isSubmitting, saveError, saveSuccess, masterAreas = [], masterCategories = [] }: any) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #f1f5f9', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: '#f8fafc', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          {customer ? 'Edit Customer' : 'Tambah Customer'}
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px 0', fontWeight: 600 }}>
          {customer ? 'Perbarui informasi mitra toko aktif' : 'Daftarkan mitra toko baru ke database'}
        </p>

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Toko *</label>
            <input 
              required
              value={form.nama_toko}
              onChange={e => setForm({...form, nama_toko: e.target.value})}
              placeholder="Masukkan nama resmi toko..."
              style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>PIC</label>
              <input 
                value={form.nama_pic}
                onChange={e => setForm({...form, nama_pic: e.target.value})}
                placeholder="Nama pemilik..."
                style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>No WA *</label>
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
                onChange={e => setForm({...form, area: e.target.value})}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#fff' }}
              >
                <option value="">-- Pilih Area --</option>
                {masterAreas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Kategori</label>
              <select 
                value={form.kategori}
                onChange={e => setForm({...form, kategori: e.target.value})}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#fff' }}
              >
                <option value="">-- Pilih Kategori --</option>
                {masterCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
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
               customer ? 'Update Perubahan' : 'Daftarkan Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
