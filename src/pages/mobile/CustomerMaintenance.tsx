import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, Search, MapPin, Edit3, X, Plus, Camera, Filter, Users, CheckSquare, FileText, Loader2, CheckCircle, ShoppingCart } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { Customer } from '../../types';

interface Props { salesId: string; }

function daysDiff(dateStr: string): number {
  if (!dateStr) return 999;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / 86400000);
}

export default function CustomerMaintenance({ salesId }: Props) {
  const { customers, refresh } = useSalesData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Needs Contact' | 'Active'>('All');
  const [filterArea, setFilterArea] = useState<string>('All');
  const [filterKategori, setFilterKategori] = useState<string>('All');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<Customer | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFab, setShowFab] = useState(true);
  const scrollTimeout = useRef<any>(null);
  const navigate = useNavigate();

  const [editForm, setEditForm] = useState({ nama_toko: '', no_wa: '', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '' });

  const [addModal, setAddModal] = useState(false);

  const [addForm, setAddForm] = useState<{
    nama_toko: string; nama_pic: string; no_wa: string; area: string; link_map: string; kategori: string; rating: number; foto_profil: string;
  }>({ 
    nama_toko: '', nama_pic: '', no_wa: '', area: 'Sepaku', link_map: '', kategori: 'Retail', rating: 0, foto_profil: ''
  });

  useEffect(() => {
    if (window.location.hash === '#new') {
      setAddModal(true);
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
  }, []);


  const myCustomers = customers.filter(c => c.sales_pic === salesId)
    .filter(c => {
      const s = search.toLowerCase();
      return c.nama_toko.toLowerCase().includes(s) || (c.nama_pic && c.nama_pic.toLowerCase().includes(s));
    })
    .filter(c => {
      // Status Filter (Retention)
      if (filterStatus === 'All') return true;
      const overdue = daysDiff(c.last_order_date) > 14;
      if (filterStatus === 'Needs Contact') return overdue;
      if (filterStatus === 'Active') return !overdue;
      return true;
    })
    .filter(c => filterArea === 'All' || c.area === filterArea)
    .filter(c => filterKategori === 'All' || c.kategori === filterKategori)
    .sort((a, b) => daysDiff(a.last_order_date) - daysDiff(b.last_order_date) < 0 ? 1 : -1);

  const handleWA = async (c: Customer) => {
    await store.logWA(salesId, c.id, 'customer', c.nama_toko, c.no_wa, 'Follow-up maintenance pelanggan.');
    const cleanNum = c.no_wa.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNum}`, '_blank');
  };

  const handleNote = async (c: Customer) => {
    const note = prompt(`Masukkan catatan untuk ${c.nama_toko}:`);
    if (!note) return;
    await store.logNote(salesId, c.id, 'customer', c.nama_toko, note);
    alert('Catatan berhasil tersimpan!');
  };

  const handleCall = async (c: Customer) => {
    await store.logActivity({ 
      id_sales: salesId, 
      target_id: c.id, 
      target_type: 'customer', 
      target_nama: c.nama_toko, 
      tipe_aksi: 'Call', 
      catatan_hasil: 'Follow-up via WhatsApp.' 
    });
    const cleanNum = c.no_wa.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNum}`, '_blank');
  };

  const handleCaptureProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > 800 ? 800 / img.width : 1;
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        if (isEdit) {
           setEditForm(prev => ({ ...prev, foto_profil: base64 }));
        } else {
           setAddForm(prev => ({ ...prev, foto_profil: base64 }));
        }
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleScroll = () => {
    if (showFab) setShowFab(false);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setShowFab(true), 800);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [showFab]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAccentColor = (kategori: string = 'Retail') => {
    switch (kategori) {
      case 'Retail': return '#3B82F6';
      case 'Grosir': return '#10B981';
      case 'Distributor': return '#F59E0B';
      case 'Horeca': return '#8B5CF6';
      default: return '#94A3B8';
    }
  };


  const handleSaveEdit = async () => {
    if (!editModal || isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const { error } = await store.updateCustomer(editModal.id, {
        nama_toko: editForm.nama_toko,
        no_wa: editForm.no_wa,
        link_map: editForm.link_map,
        kategori: editForm.kategori,
        rating: editForm.rating,
        foto_profil: editForm.foto_profil,
      });

      if (error) {
        setSaveError(error.message || 'Gagal memperbarui data. Coba lagi.');
        return;
      }

      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setEditModal(null);
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      setSaveError('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!addForm.nama_toko || !addForm.no_wa || isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const newCustomer: any = {
        nama_toko: addForm.nama_toko,
        nama_pic: addForm.nama_pic || 'Bpk/Ibu',
        no_wa: addForm.no_wa,
        area: addForm.area,
        link_map: addForm.link_map,
        sales_pic: salesId,
        status: 'Aman',
        last_order_date: new Date().toISOString(),
        total_order_volume: 0,
        created_at: new Date().toISOString(),
        created_by: salesId,
        kategori: addForm.kategori,
        rating: addForm.rating,
        foto_profil: addForm.foto_profil,
      };
      
      const { error } = await store.addCustomer(newCustomer);
      if (error) {
        setSaveError(error.message || 'Gagal menyimpan data baru.');
        return;
      }

      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setAddModal(false);
        setSaveSuccess(false);
        setAddForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Sepaku', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '' });
      }, 1500);
    } catch (err) {
      setSaveError('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="page-content" style={{ paddingTop: 0 }}>
      {/* Header with zIndex fix to ensure interactivity - More Compact GrabFood Style */}
      <div className="yellow-bg-top" style={{ height: '180px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px 20px', zIndex: 50 }}>
        {/* Decorative elements with pointer-events: none */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '10px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 6, marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', letterSpacing: '-1px', margin: 0 }}>Customer</h2>
              <div style={{ background: '#111827', color: '#FFCC00', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>{myCustomers.length} TOKO</div>
            </div>
            <div style={{ color: '#111827', opacity: 0.6, fontSize: '11px', fontWeight: 700 }}>Management & Retention</div>
          </div>
      </div>

        {/* Integrated Search & Filter (Glassmorphism) */}
        <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 10 }}>
          <div className="search-bar" style={{ 
            flex: 1, marginBottom: 0, 
            background: 'rgba(255,255,255,0.45)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)', 
            borderRadius: '18px', 
            height: '52px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
            padding: '0 16px'
          }}>
            <Search size={18} color="#111827" style={{ opacity: 0.6, flexShrink: 0 }} />
            <input 
              placeholder="Cari toko pelanggan..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ fontSize: '14px', fontWeight: 800, color: '#111827', background: 'transparent', width: '100%', height: '100%', border: 'none', outline: 'none' }}
            />
          </div>
          <button 
            className="tap-active" 
            onClick={() => setFilterModalOpen(true)}
            style={{ 
              width: '52px', 
              height: '52px', 
              flexShrink: 0,
              borderRadius: '18px', 
              background: (filterArea !== 'All' || filterKategori !== 'All' || filterStatus !== 'All') ? '#111827' : 'rgba(255,255,255,0.45)', 
              backdropFilter: 'blur(10px)',
              border: (filterArea !== 'All' || filterKategori !== 'All' || filterStatus !== 'All') ? '1px solid #111827' : '1px solid rgba(255,255,255,0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
              color: (filterArea !== 'All' || filterKategori !== 'All' || filterStatus !== 'All') ? '#FFCC00' : '#111827',
              zIndex: 20
            }}
          >
            <Filter size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0', position: 'relative' }}>
        <div className="customer-list">
          {myCustomers.map(c => {
            const days = daysDiff(c.last_order_date);
            const overdue = days > 14;
            const accent = getAccentColor(c.kategori);
            const isExpanded = expandedId === c.id;

            return (
              <div 
                key={c.id} 
                className="tap-active"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                style={{ 
                  background: '#fff', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  marginBottom: '12px', 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
                  position: 'relative', 
                  border: '1px solid rgba(0,0,0,0.02)',
                  borderLeft: `5px solid ${accent}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
              >
                {/* Header Card Style - Accurate inspired */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {/* Initials Avatar */}
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '14px', 
                    background: `${accent}15`, color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 900, flexShrink: 0,
                    border: `1.5px solid ${accent}30`
                  }}>
                    {getInitials(c.nama_toko)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{c.nama_toko}</h3>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#334155' }}>📦 {c.total_order_volume}kg</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{c.no_wa}</span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: overdue ? '#ef4444' : '#10b981' }}>
                        {overdue ? `🚨 Overdue ${days}d` : '✅ Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Action Panel */}
                <div style={{ 
                  maxHeight: isExpanded ? '300px' : '0', 
                  opacity: isExpanded ? 1 : 0,
                  marginTop: isExpanded ? '16px' : '0',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  paddingTop: isExpanded ? '16px' : '0',
                  borderTop: isExpanded ? '1px dashed #f1f5f9' : 'none'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      className="tap-active"
                      style={{ width: '100%', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const vol = prompt('Estimasi volume order (kg):');
                        if (vol) {
                          store.logOrder(salesId, c.id, c.nama_toko, parseFloat(vol));
                          window.open('accuratelite://', '_blank');
                        }
                      }}
                    >
                      <ShoppingCart size={18} /> Buat Pesanan (Accurate)
                    </button>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '12px 0', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); handleNote(c); }}
                      >
                        <FileText size={16} /> Note
                      </button>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F0FDF4', color: '#10B981', border: '1.5px solid #DCFCE7', borderRadius: '12px', padding: '12px 0', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); handleWA(c); }}
                      >
                        <MessageCircle size={16} /> WA
                      </button>
                      <button 
                         className="tap-active"
                        style={{ flex: 1, background: '#F0F9FF', color: '#0EA5E9', border: '1.5px solid #E0F2FE', borderRadius: '12px', padding: '12px 0', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); handleCall(c); }}
                      >
                        <Phone size={16} /> Call
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '10px 0', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); navigate(`/mobile/profile/customer/${c.id}`); }}
                      >
                        <Users size={14} /> Detail
                      </button>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '10px 0', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); setEditModal(c); setEditForm({ nama_toko: c.nama_toko, no_wa: c.no_wa, link_map: c.link_map || '', kategori: c.kategori || 'Retail', rating: c.rating || 0, foto_profil: c.foto_profil || '' }); }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (FAB) - Accurate/Grab Style Blue */}
      <button 
        className="tap-active"
        onClick={() => setAddModal(true)}
        style={{ 
          position: 'fixed', 
          bottom: 'calc(98px + env(safe-area-inset-bottom))', 
          right: '25px', 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: '#3B82F6', 
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
          border: 'none',
          zIndex: 99,
          opacity: showFab ? 1 : 0,
          transform: showFab ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: showFab ? 'auto' : 'none'
        }}
      >
        <Plus size={30} strokeWidth={3} />
      </button>

      {/* Edit Modal - Optimized Drawer Style */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px 20px calc(40px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>✏️ Edit Customer</h3>
              <button className="tap-active" onClick={() => setEditModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Store Name *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={editForm.nama_toko} onChange={e => setEditForm({...editForm, nama_toko: e.target.value})} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>WA Number *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={editForm.no_wa} onChange={e => setEditForm({...editForm, no_wa: e.target.value})} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Map Link (Google Maps)</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="https://maps.google.com/..." value={editForm.link_map} onChange={e => setEditForm({...editForm, link_map: e.target.value})} /></div>
              
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: editForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: editForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                  <Camera size={16} /> {editForm.foto_profil ? 'Photo Saved ✅' : 'Change Profile Photo (Optional)'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={e => handleCaptureProfilePhoto(e, true)} />
                </label>
                {editForm.foto_profil && <img src={editForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '18px', marginTop: '8px', border: '2px solid #f1f5f9', display: 'block', margin: '8px auto 0' }} />}
              </div>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Category</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={editForm.kategori} onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      const val = prompt('Enter New Category:');
                      if (val && val.trim()) setEditForm({ ...editForm, kategori: val.trim() });
                    } else {
                      setEditForm({ ...editForm, kategori: e.target.value });
                    }
                  }}>
                    <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                    {!['Retail','Grosir','Distributor','Horeca'].includes(editForm.kategori || '') && editForm.kategori && <option value={editForm.kategori}>{editForm.kategori}</option>}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Rating (0-5)</label>
                  <input type="number" min="0" max="5" className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ flex: 1, height: '52px', borderRadius: '18px', fontWeight: 800, border: '1px solid #e2e8f0', background: '#fff' }} onClick={() => setEditModal(null)} disabled={isSubmitting}>Batal</button>
                <button className="btn-primary" style={{ flex: 2, height: '52px', borderRadius: '18px', fontWeight: 900, background: saveSuccess ? '#10B981' : 'var(--brand-yellow)', color: saveSuccess ? '#fff' : '#111827', border: 'none', boxShadow: '0 8px 16px rgba(255, 204, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSaveEdit} disabled={!editForm.nama_toko || !editForm.no_wa || isSubmitting}>
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : saveSuccess ? <CheckCircle size={20} /> : 'Simpan Perubahan'}
                </button>
              </div>
              {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginTop: '8px', textAlign: 'center' }}>{saveError}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal - Optimized Drawer Style */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px 20px calc(40px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>🏠 Tambah Pelanggan</h3>
              <button className="tap-active" onClick={() => setAddModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Store Name *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.nama_toko} onChange={e => setAddForm({...addForm, nama_toko: e.target.value})} placeholder="Nama Toko" /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>PIC Name (Owner)</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.nama_pic} onChange={e => setAddForm({...addForm, nama_pic: e.target.value})} placeholder="Milik/PIC" /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>WhatsApp Number *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.no_wa} onChange={e => setAddForm({...addForm, no_wa: e.target.value})} placeholder="628..." /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Maps Link</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.link_map} onChange={e => setAddForm({...addForm, link_map: e.target.value})} placeholder="https://..." /></div>
  
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: addForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: addForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                  <Camera size={16} /> {addForm.foto_profil ? 'Photo Saved ✅' : 'Upload Profile Photo (Optional)'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={e => handleCaptureProfilePhoto(e, false)} />
                </label>
                {addForm.foto_profil && <img src={addForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '18px', marginTop: '8px', border: '2px solid #f1f5f9', display: 'block', margin: '8px auto 0' }} />}
              </div>
  
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Operational Area</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.area} onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      const val = prompt('Enter New Area:');
                      if (val && val.trim()) setAddForm({ ...addForm, area: val.trim() });
                    } else {
                      setAddForm({ ...addForm, area: e.target.value });
                    }
                  }}>
                    <option value="Sepaku">Sepaku</option><option value="Gerogot">Tanah Grogot</option><option value="Kota">Kota Balikpapan</option>
                    {!['Sepaku','Gerogot','Kota'].includes(addForm.area || '') && addForm.area && <option value={addForm.area}>{addForm.area}</option>}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Category</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.kategori} onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      const val = prompt('Enter New Category:');
                      if (val && val.trim()) setAddForm({ ...addForm, kategori: val.trim() });
                    } else {
                      setAddForm({ ...addForm, kategori: e.target.value });
                    }
                  }}>
                    <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                    {!['Retail','Grosir','Distributor','Horeca'].includes(addForm.kategori || '') && addForm.kategori && <option value={addForm.kategori}>{addForm.kategori}</option>}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: '50%' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Initial Rating</label>
                <input type="number" min="0" max="5" className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.rating} onChange={e => setAddForm({...addForm, rating: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
              {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="btn-secondary" style={{ flex: 1, height: '52px', borderRadius: '18px', fontWeight: 800 }} onClick={() => setAddModal(false)} disabled={isSubmitting}>Batal</button>
                <button className="btn-primary" style={{ flex: 2, height: '52px', borderRadius: '18px', fontWeight: 900, background: saveSuccess ? '#10B981' : 'var(--brand-yellow)', color: saveSuccess ? '#fff' : '#111827', border: 'none', boxShadow: '0 8px 16px rgba(255, 204, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleAddCustomer} disabled={!addForm.nama_toko || !addForm.no_wa || isSubmitting}>
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : saveSuccess ? <CheckCircle size={20} /> : 'Simpan Pelanggan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal - Premium Light Drawer */}
      {filterModalOpen && (
        <div className="modal-overlay" onClick={() => setFilterModalOpen(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div 
            className="modal-card animate-fade-up" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              borderTopLeftRadius: '32px', 
              borderTopRightRadius: '32px', 
              padding: '24px 20px 40px',
              background: '#fff',
              border: 'none',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
            }}
          >
            {/* Drawer Handle */}
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>

            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#FDE68A', color: '#B45309', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Filter size={20} strokeWidth={3} />
                </div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Filter Pelanggan</h3>
              </div>
              <button 
                onClick={() => { setFilterArea('All'); setFilterKategori('All'); setFilterStatus('All'); }}
                style={{ background: '#fef2f2', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '13px', padding: '6px 14px', borderRadius: '10px' }}
              >
                Reset Semua
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Area Filter */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <MapPin size={16} color="#94a3b8" />
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wilayah Area</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['All', 'Sepaku', 'Gerogot', 'Kota'].map(a => (
                    <button 
                      key={a}
                      onClick={() => setFilterArea(a)}
                      style={{ 
                        padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 800,
                        background: filterArea === a ? '#111827' : '#F8FAFC',
                        color: filterArea === a ? '#FFCC00' : '#64748b',
                        border: filterArea === a ? 'none' : '1px solid #f1f5f9',
                        transition: 'all 0.2s', minWidth: '80px',
                        boxShadow: filterArea === a ? '0 8px 16px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {a === 'All' ? 'Semua' : a === 'Gerogot' ? 'Grogot' : a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Users size={16} color="#94a3b8" />
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori Toko</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['All', 'Retail', 'Grosir', 'Distributor', 'Horeca'].map(k => (
                    <button 
                      key={k}
                      onClick={() => setFilterKategori(k)}
                      style={{ 
                        padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 800,
                        background: filterKategori === k ? '#111827' : '#F8FAFC',
                        color: filterKategori === k ? '#FFCC00' : '#64748b',
                        border: filterKategori === k ? 'none' : '1px solid #f1f5f9',
                        transition: 'all 0.2s',
                        boxShadow: filterKategori === k ? '0 8px 16px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {k === 'All' ? 'Semua' : k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckSquare size={16} color="#94a3b8" />
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Monitoring</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['All', 'Needs Contact', 'Active'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setFilterStatus(s as any)}
                      style={{ 
                        padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 800,
                        background: filterStatus === s ? '#111827' : '#F8FAFC',
                        color: filterStatus === s ? '#FFCC00' : '#64748b',
                        border: filterStatus === s ? 'none' : '1px solid #f1f5f9',
                        transition: 'all 0.2s',
                        boxShadow: filterStatus === s ? '0 8px 16px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {s === 'All' ? 'Semua' : s === 'Needs Contact' ? '🚨 Perlu Kontak' : '✅ Aktif'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px' }}>
              <button 
                className="tap-active" 
                onClick={() => setFilterModalOpen(false)}
                style={{ 
                  width: '100%', 
                  height: '58px', 
                  borderRadius: '20px', 
                  fontSize: '16px', 
                  fontWeight: 900, 
                  background: 'var(--brand-yellow)', 
                  color: '#111827',
                  border: 'none',
                  boxShadow: '0 12px 24px rgba(255, 204, 0, 0.3)'
                }}
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
