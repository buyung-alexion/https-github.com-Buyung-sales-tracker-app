import { useState, useEffect, useRef } from 'react';
import { type StatusProspek, type Prospek } from '../../types';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCheck, Search, Filter, Plus, X, MapPin, Edit3, PhoneCall, Camera, Users, Activity, FileText, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';


interface Props { salesId: string; }

export default function ProspectingTool({ salesId }: Props) {
  const { sales = [], prospek = [], activities = [], masterAreas = [], masterCategories = [], masterChannels = [], masterStatuses = [], refresh } = useSalesData() || {};
  const currentSales = sales.find(s => s.id === salesId);
  const salesName = currentSales?.nama;
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusProspek | 'All'>('All');
  const [filterArea, setFilterArea] = useState<string>('All');
  const [filterKategori, setFilterKategori] = useState<string>('All');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [closingModal, setClosingModal] = useState<Prospek | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Prospek | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [addForm, setAddForm] = useState({ 
    nama_toko: '', 
    nama_pic: '', 
    no_wa: '', 
    area: 'SMD', 
    status: 'Cold' as StatusProspek, 
    link_map: '', 
    kategori: 'Retail', 
    rating: 0, 
    foto_profil: '', 
    channel: 'Canvasing' 
  });

  const [editForm, setEditForm] = useState({ 
    id: '',
    nama_toko: '', 
    nama_pic: '', 
    no_wa: '', 
    area: '', 
    status: 'Cold' as StatusProspek, 
    link_map: '', 
    kategori: '', 
    rating: 0, 
    foto_profil: '', 
    channel: '' 
  });

  useEffect(() => {
    if (window.location.hash === '#new') {
      setAddModal(true);
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
  }, []);

  const myProspek = prospek.filter(p => p.sales_owner === salesId)
    .filter(p => {
      const s = search.toLowerCase();
      return p.nama_toko.toLowerCase().includes(s) || (p.nama_pic && p.nama_pic.toLowerCase().includes(s));
    })
    .filter(p => filterStatus === 'All' || p.status === filterStatus)
    .filter(p => filterArea === 'All' || p.area === filterArea)
    .filter(p => filterKategori === 'All' || p.kategori === filterKategori);

  const handleWA = async (p: Prospek) => {
    await store.logWA(salesId, p.id, 'prospek', p.nama_toko, p.no_wa, '', salesName);
    const cleanNum = p.no_wa.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNum}`, '_blank');
  };
  
  const handleNote = async (p: Prospek) => {
    const note = prompt(`Masukkan catatan untuk ${p.nama_toko}:`);
    if (!note) return;
    await store.logNote(salesId, p.id, 'prospek', p.nama_toko, note, salesName);
    alert('Catatan berhasil tersimpan!');
  };

  const handleClosing = async () => {
    if (isSubmitting || !closingModal) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const { error } = await store.convertToCustomer(closingModal, salesName);
      if (error) {
        setSaveError(error.message || 'Gagal konversi ke customer.');
        return;
      }
      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setClosingModal(null);
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      setSaveError('Kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProspek = async () => {
    if (isSubmitting || !addForm.nama_toko || !addForm.no_wa) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const { error } = await store.addProspek({ ...addForm, sales_owner: salesId }, salesName);
      if (error) {
        alert('Supabase Error (Add Prospect): ' + (error.message || JSON.stringify(error)));
        setSaveError(error.message || 'Gagal menyimpan prospek baru.');
        return;
      }
      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setAddModal(false);
        setSaveSuccess(false);
        setAddForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'SMD', status: 'Cold', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '', channel: 'Canvasing' });
      }, 1500);
    } catch (err) {
      setSaveError('Kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (isSubmitting || !editModal) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const { error } = await store.updateProspek(editForm.id, {
        nama_toko: editForm.nama_toko,
        nama_pic: editForm.nama_pic,
        no_wa: editForm.no_wa,
        area: editForm.area,
        status: editForm.status,
        link_map: editForm.link_map,
        kategori: editForm.kategori,
        rating: editForm.rating,
        foto_profil: editForm.foto_profil,
        channel: addForm.channel,
      });

      if (error) {
        alert('Supabase Error (Edit Prospect): ' + (error.message || JSON.stringify(error)));
        setSaveError(error.message || 'Gagal memperbarui prospek.');
        return;
      }

      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setEditModal(null);
        setSaveSuccess(false);
        setAddForm({ 
          nama_toko: '', 
          nama_pic: '', 
          no_wa: '', 
          area: 'SMD', 
          status: 'Cold', 
          link_map: '', 
          kategori: 'Retail', 
          rating: 0, 
          foto_profil: '', 
          channel: 'Canvasing' 
        });
      }, 1500);
    } catch (err) {
      setSaveError('Kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > 800 ? 800 / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        
        if (isEdit) {
          setEditForm(prev => ({ ...prev, foto_profil: base64 }));
        } else {
          setAddForm(prev => ({ ...prev, foto_profil: base64 }));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };


  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAreaName = (id: string) => masterAreas.find(a => a.id === id || a.name === id)?.name || id;

  const getStatusColor = (status: string = 'Cold') => {
    switch (status) {
      case 'Hot': return '#EF4444'; // Bright Red
      case 'Warm': return '#F59E0B'; // Bright Amber
      case 'Cold': return '#3B82F6'; // Bright Blue
      default: return '#6366F1'; // Vibrant Indigo fallback
    }
  };

  return (
    <div className="page-content" style={{ paddingTop: 0 }}>
      {/* Header - Premium Grab Style */}
      <div className="hero-compact" style={{ 
        padding: 'calc(16px + env(safe-area-inset-top)) 20px 48px', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'var(--brand-yellow)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        zIndex: 50
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 6 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
             <h2 className="hero-premium-title" style={{ fontSize: '24px', margin: 0 }}>Prospecting</h2>
             <div style={{ background: '#111827', color: '#FFCC00', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>{myProspek.length} TOKO</div>
           </div>
           <div className="hero-premium-subtitle">Lead Generation & Acquisition</div>
        </div>
      </div>

          {/* Integrated Search & Filter (Glassmorphism) */}
          <div style={{ display: 'flex', gap: '10px' }}>
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
                placeholder="Cari prospek toko..." 
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

      <div style={{ padding: '24px 20px 0', position: 'relative' }}>
        <div className="prospect-list">
          {myProspek.map(p => {
            const isExpanded = expandedId === p.id;
            const accent = getStatusColor(p.status);
            const isFollowedUp = activities.some(act => 
              act.target_id === p.id && 
              (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call')
            );

            return (
              <div 
                key={p.id} 
                className="tap-active"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                style={{ 
                  background: '#fff', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  marginBottom: '12px', 
                  position: 'relative', 
                  border: '1px solid rgba(0,0,0,0.02)',
                  borderLeft: `5px solid ${accent}`,
                  boxShadow: `0 10px 25px ${accent}15`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
              >
                {/* Main Info - Simplified Header */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '14px', 
                    background: `${accent}15`, color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 900, flexShrink: 0,
                    border: `1.5px solid ${accent}30`
                  }}>
                    {getInitials(p.nama_toko)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.3, letterSpacing: '-0.3px' }}>{p.nama_toko}</h3>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                        <div style={{ background: '#EEF2FF', color: '#6366F1', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', border: '1px solid #E0E7FF', letterSpacing: '0.02em' }}>{p.id}</div>
                        <div style={{ background: `${accent}15`, color: accent, fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', border: `1px solid ${accent}25` }}>{p.status}</div>
                        {isFollowedUp && (
                          <div style={{ background: '#ECFDF5', color: '#059669', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', border: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCheck size={11} strokeWidth={3.5} /> FOLLOW UP
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{p.no_wa}</span>
                        </div>
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={10} color="#94a3b8" strokeWidth={2.5} />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>{getAreaName(p.area)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Action Panel */}
                <div style={{ 
                  maxHeight: isExpanded ? '400px' : '0', 
                  opacity: isExpanded ? 1 : 0,
                  marginTop: isExpanded ? '16px' : '0',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  paddingTop: isExpanded ? '16px' : '0',
                  borderTop: isExpanded ? '1px dashed #f1f5f9' : 'none'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      className="tap-active"
                      style={{ width: '100%', background: '#10B981', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }} 
                      onClick={(e) => { e.stopPropagation(); setClosingModal(p); }}
                    >
                      <CheckCheck size={18} /> Konfirmasi Closing Deal
                    </button>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '12px 0', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); handleNote(p); }}
                      >
                        <FileText size={16} /> Note
                      </button>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F0FDF4', color: '#10B981', border: '1.5px solid #DCFCE7', borderRadius: '12px', padding: '12px 0', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); handleWA(p); }}
                      >
                        <MessageCircle size={16} /> WA
                      </button>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#FFFBEB', color: '#D97706', border: '1.5px solid #FEF3C7', borderRadius: '12px', padding: '12px 0', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          store.logCall(salesId, p.id, 'prospek', p.nama_toko, p.no_wa, '', salesName); 
                          const cleanNum = p.no_wa.replace(/\D/g, '');
                          window.open(`https://wa.me/${cleanNum}`, '_blank');
                        }}
                      >
                        <PhoneCall size={16} /> Call
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '10px 0', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { e.stopPropagation(); navigate(`/mobile/profile/prospek/${p.id}`); }}
                      >
                        <Activity size={14} /> Detail
                      </button>
                      <button 
                        className="tap-active"
                        style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '10px 0', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditModal(p); 
                          setEditForm({ 
                            id: p.id,
                            nama_toko: p.nama_toko, 
                            nama_pic: p.nama_pic || '',
                            no_wa: p.no_wa, 
                            area: p.area, 
                            status: p.status, 
                            link_map: p.link_map || '', 
                            kategori: p.kategori || '', 
                            rating: p.rating || 0, 
                            foto_profil: p.foto_profil || '',
                            channel: p.channel || 'Canvasing'
                          }); 
                        }}
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

      {/* Floating Action Button (FAB) - Blue with Scroll Sensor */}
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
          background: 'var(--brand-yellow)', 
          color: '#111827', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 10px 25px rgba(255, 204, 0, 0.3)',
          border: 'none',
          zIndex: 99,
          opacity: 1,
          transform: 'scale(1) translateY(0)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'auto'
        }}
      >
        <Plus size={30} strokeWidth={3} />
      </button>

      {/* Closing Modal */}
      {closingModal && (
        <div className="modal-overlay" onClick={() => setClosingModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🤝 Deal Closing!</h3>
              <button onClick={() => setClosingModal(null)}><X size={20} /></button>
            </div>
            <p className="modal-sub">Luar biasa! <strong>{closingModal.nama_toko}</strong> resmi menjadi Customer. Konfirmasi data untuk memproses?</p>

            {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>{saveError}</div>}
            <div className="modal-actions" style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
              <button className="btn-secondary" style={{ flex: 1, height: '52px', borderRadius: '18px', fontWeight: 800 }} onClick={() => setClosingModal(null)} disabled={isSubmitting}>Batal</button>
              <button 
                className="btn-success" 
                style={{ 
                  flex: 2, height: '52px', borderRadius: '18px', fontWeight: 900, 
                  background: saveSuccess ? '#10B981' : '#111827', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                }}
                onClick={handleClosing} 
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : saveSuccess ? <CheckCircle size={20} /> : 'Konfirmasi Closing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prospek Modal - Optimized for Small Screens */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px 20px calc(110px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>➕ Tambah Prospek</h3>
              <button className="tap-active" onClick={() => setAddModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nama Toko *</label>
                <input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="Nama Toko..." value={addForm.nama_toko} onChange={e => setAddForm({ ...addForm, nama_toko: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>PIC</label>
                  <input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="Nama PIC..." value={addForm.nama_pic} onChange={e => setAddForm({ ...addForm, nama_pic: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>No WA *</label>
                  <input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="628..." value={addForm.no_wa} onChange={e => setAddForm({ ...addForm, no_wa: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Map Link (Google Maps)</label>
                <input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="https://maps..." value={addForm.link_map || ''} onChange={e => setAddForm({ ...addForm, link_map: e.target.value })} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>Foto Toko / Profil</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    className="tap-active"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', borderRadius: '20px', border: '2px dashed #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '11px', fontWeight: 800 }}
                  >
                    <Camera size={18} />
                    <span>Kamera</span>
                  </button>
                  <button 
                    className="tap-active"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', borderRadius: '20px', border: '2px dashed #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '11px', fontWeight: 800 }}
                  >
                    <ImageIcon size={18} />
                    <span>Galeri</span>
                  </button>
                </div>
                <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, false)} />
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, false)} />
                {addForm.foto_profil && (
                  <div className="animate-scale" style={{ position: 'relative', width: '80px', height: '80px', marginTop: '4px' }}>
                    <img src={addForm.foto_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', border: '2px solid var(--brand-yellow)' }} />
                    <button onClick={() => setAddForm({...addForm, foto_profil: ''})} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Kategori</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px', background: '#fff' }} value={addForm.kategori} onChange={e => setAddForm({ ...addForm, kategori: e.target.value })}>
                    <option value="">-- Pilih Kategori --</option>
                    {masterCategories.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Rating (0-5)</label>
                  <input type="number" min="0" max="5" className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={addForm.rating} onChange={e => setAddForm({ ...addForm, rating: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Wilayah Area</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={addForm.area} onChange={e => setAddForm({ ...addForm, area: e.target.value })}>
                    <option value="">-- Pilih Area --</option>
                    {masterAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Status Suhu</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value as StatusProspek })}>
                    <option value="">-- Pilih Status --</option>
                    {masterStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Sumber Prospek</label>
                <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={addForm.channel} onChange={e => setAddForm({ ...addForm, channel: e.target.value })}>
                  <option value="">-- Pilih Sumber --</option>
                  {masterChannels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="tap-active" style={{ flex: 1, padding: '18px', borderRadius: '20px', background: '#F1F5F9', color: '#64748B', fontWeight: 900, border: 'none' }} onClick={() => setAddModal(false)} disabled={isSubmitting}>Batal</button>
                <button 
                  className="tap-active" 
                  disabled={!addForm.nama_toko || !addForm.no_wa || isSubmitting}
                  style={{ 
                    flex: 2, padding: '18px', borderRadius: '20px', 
                    background: isSubmitting ? '#E2E8F0' : saveSuccess ? '#10B981' : 'var(--brand-yellow)', 
                    color: saveSuccess ? '#fff' : '#111827', fontWeight: 900, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }} 
                  onClick={handleAddProspek}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : saveSuccess ? <CheckCircle size={20} /> : 'Simpan Prospek'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prospek Modal - Optimized */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px 20px calc(110px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>✏️ Edit Prospek</h3>
              <button className="tap-active" onClick={() => setEditModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nama Toko *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={editForm.nama_toko} onChange={e => setEditForm({ ...editForm, nama_toko: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nama PIC</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="Bpk/Ibu" value={editForm.nama_pic} onChange={e => setEditForm({ ...editForm, nama_pic: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nomor WA *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={editForm.no_wa} onChange={e => setEditForm({ ...editForm, no_wa: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Map Link (Google Maps)</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="https://maps.google.com/..." value={editForm.link_map || ''} onChange={e => setEditForm({ ...editForm, link_map: e.target.value })} /></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>Foto Toko / Profil</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    className="tap-active"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', borderRadius: '20px', border: '2px dashed #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '11px', fontWeight: 800 }}
                  >
                    <Camera size={18} />
                    <span>Kamera</span>
                  </button>
                  <button 
                    className="tap-active"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', borderRadius: '20px', border: '2px dashed #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '11px', fontWeight: 800 }}
                  >
                    <ImageIcon size={18} />
                    <span>Galeri</span>
                  </button>
                </div>
                <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, true)} />
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, true)} />
                {editForm.foto_profil && (
                  <div className="animate-scale" style={{ position: 'relative', width: '80px', height: '80px', marginTop: '4px' }}>
                    <img src={editForm.foto_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', border: '2px solid var(--brand-yellow)' }} />
                    <button onClick={() => setEditForm({...editForm, foto_profil: ''})} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Kategori</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={editForm.kategori} onChange={e => setEditForm({ ...editForm, kategori: e.target.value })}>
                    <option value="">-- Pilih Kategori --</option>
                    {masterCategories.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Rating (0-5)</label>
                  <input type="number" min="0" max="5" className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Wilayah Area</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={editForm.area} onChange={e => setEditForm({ ...editForm, area: e.target.value })}>
                    <option value="">-- Pilih Area --</option>
                    {masterAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Status Suhu</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as StatusProspek })}>
                    <option value="">-- Pilih Status --</option>
                    {masterStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Sumber Prospek</label>
                <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={editForm.channel} onChange={e => setEditForm({ ...editForm, channel: e.target.value })}>
                  <option value="">-- Pilih Sumber --</option>
                  {masterChannels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="tap-active" style={{ flex: 1, padding: '18px', borderRadius: '20px', background: '#F1F5F9', color: '#64748B', fontWeight: 900, border: 'none' }} onClick={() => setEditModal(null)} disabled={isSubmitting}>Batal</button>
                <button 
                  className="tap-active" 
                  disabled={!editForm.nama_toko || !editForm.no_wa || isSubmitting}
                  style={{ 
                    flex: 2, padding: '18px', borderRadius: '20px', 
                    background: isSubmitting ? '#E2E8F0' : saveSuccess ? '#10B981' : 'var(--brand-yellow)', 
                    color: saveSuccess ? '#fff' : '#111827', fontWeight: 900, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }} 
                  onClick={handleSaveEdit}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : saveSuccess ? <CheckCircle size={20} /> : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal - Compact Bottom Sheet */}
      {filterModalOpen && (
        <div className="modal-overlay" onClick={() => setFilterModalOpen(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div 
            className="modal-card animate-fade-up" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              borderTopLeftRadius: '28px', 
              borderTopRightRadius: '28px', 
              padding: '20px 20px calc(90px + env(safe-area-inset-bottom))',
              background: '#fff',
              border: 'none',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Handle */}
            <div style={{ width: '36px', height: '4px', background: '#e2e8f0', borderRadius: '10px', margin: '-6px auto 16px' }}></div>

            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#FDE68A', color: '#B45309', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Filter size={15} strokeWidth={3} />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 950, color: '#111827', letterSpacing: '-0.3px' }}>Filter Prospek</h3>
              </div>
              <button 
                onClick={() => { setFilterArea('All'); setFilterKategori('All'); setFilterStatus('All'); }}
                style={{ background: '#fef2f2', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: '11px', padding: '6px 12px', borderRadius: '10px' }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Area Filter - Wrap Grid Chips */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <MapPin size={12} color="#94a3b8" strokeWidth={2.5} />
                  <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wilayah Area</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[{id: 'All', name: 'Semua'}, ...masterAreas].map(a => (
                    <button 
                      key={a.id}
                      onClick={() => setFilterArea(a.id)}
                      style={{ 
                        padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                        whiteSpace: 'nowrap',
                        background: filterArea === a.id ? '#111827' : '#F8FAFC',
                        color: filterArea === a.id ? '#FFCC00' : '#475569',
                        border: filterArea === a.id ? '1.5px solid #111827' : '1.5px solid #f1f5f9',
                        boxShadow: filterArea === a.id ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter - Wrap Grid Chips */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Users size={12} color="#94a3b8" strokeWidth={2.5} />
                  <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kategori Bisnis</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[{id: 'All', name: 'Semua'}, ...masterCategories].map(k => (
                    <button 
                      key={k.id}
                      onClick={() => setFilterKategori(k.id)}
                      style={{ 
                        padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                        whiteSpace: 'nowrap',
                        background: filterKategori === k.id ? '#111827' : '#F8FAFC',
                        color: filterKategori === k.id ? '#FFCC00' : '#475569',
                        border: filterKategori === k.id ? '1.5px solid #111827' : '1.5px solid #f1f5f9',
                        boxShadow: filterKategori === k.id ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {k.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter - Compact Horizontal Pills */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Activity size={12} color="#94a3b8" strokeWidth={2.5} />
                  <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status Suhu</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { id: 'All', label: 'Semua', icon: '' },
                    { id: 'Hot', label: '🔥 Hot', icon: '' },
                    { id: 'Warm', label: '☀️ Warm', icon: '' },
                    { id: 'Cold', label: '❄️ Cold', icon: '' }
                  ].map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setFilterStatus(s.id as any)}
                      style={{ 
                        padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                        background: filterStatus === s.id ? '#111827' : '#F8FAFC',
                        color: filterStatus === s.id ? '#FFCC00' : '#475569',
                        border: filterStatus === s.id ? '1.5px solid #111827' : '1.5px solid #f1f5f9',
                        transition: 'all 0.2s'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button 
                className="tap-active" 
                onClick={() => setFilterModalOpen(false)}
                style={{ 
                  width: '100%', 
                  height: '52px', 
                  borderRadius: '16px', 
                  fontSize: '15px', 
                  fontWeight: 950, 
                  background: 'var(--brand-yellow)', 
                  color: '#111827',
                  border: 'none',
                  boxShadow: '0 8px 20px rgba(255, 204, 0, 0.25)'
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
