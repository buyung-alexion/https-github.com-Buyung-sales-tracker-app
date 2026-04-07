import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCheck, Search, Filter, Plus, X, MapPin, Edit3, PhoneCall, Camera, Users, Activity, FileText, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { Prospek, StatusProspek } from '../../types';

interface Props { salesId: string; }

export default function ProspectingTool({ salesId }: Props) {
  const { prospek, refresh } = useSalesData();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusProspek | 'All'>('All');
  const [filterArea, setFilterArea] = useState<string>('All');
  const [filterKategori, setFilterKategori] = useState<string>('All');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [closingModal, setClosingModal] = useState<Prospek | null>(null);
  const [orderInput, setOrderInput] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Prospek | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFab, setShowFab] = useState(true);
  const scrollTimeout = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [newForm, setNewForm] = useState({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold' as StatusProspek, link_map: '', kategori: 'Retail', rating: 0, foto_profil: '', channel: 'Canvasing' });

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
    await store.logWA(salesId, p.id, 'prospek', p.nama_toko, p.no_wa);
    const cleanNum = p.no_wa.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNum}`, '_blank');
  };
  
  const handleNote = async (p: Prospek) => {
    const note = prompt(`Masukkan catatan untuk ${p.nama_toko}:`);
    if (!note) return;
    await store.logNote(salesId, p.id, 'prospek', p.nama_toko, note);
    alert('Catatan berhasil tersimpan!');
  };

  const handleClosing = async () => {
    if (isSubmitting || !closingModal || !orderInput) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const { error } = await store.convertToCustomer(closingModal, parseFloat(orderInput));
      if (error) {
        setSaveError(error.message || 'Gagal konversi ke customer.');
        return;
      }
      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setClosingModal(null);
        setOrderInput('');
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      setSaveError('Kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProspek = async () => {
    if (isSubmitting || !newForm.nama_toko || !newForm.no_wa) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const { error } = await store.addProspek({ ...newForm, sales_owner: salesId });
      if (error) {
        setSaveError(error.message || 'Gagal menyimpan prospek baru.');
        return;
      }
      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setAddModal(false);
        setSaveSuccess(false);
        setNewForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '', channel: 'Canvasing' });
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
      const { error } = await store.updateProspek(editModal.id, {
        nama_toko: newForm.nama_toko,
        nama_pic: newForm.nama_pic,
        no_wa: newForm.no_wa,
        area: newForm.area,
        status: newForm.status,
        link_map: newForm.link_map,
        kategori: newForm.kategori,
        rating: newForm.rating,
        foto_profil: newForm.foto_profil,
        channel: newForm.channel,
      });

      if (error) {
        setSaveError(error.message || 'Gagal memperbarui prospek.');
        return;
      }

      setSaveSuccess(true);
      await refresh();
      setTimeout(() => {
        setEditModal(null);
        setSaveSuccess(false);
        setNewForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '', channel: 'Canvasing' });
      }, 1500);
    } catch (err) {
      setSaveError('Kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setNewForm(prev => ({ ...prev, foto_profil: canvas.toDataURL('image/jpeg', 0.6) }));
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

  const getStatusColor = (status: StatusProspek = 'Cold') => {
    switch (status) {
      case 'Hot': return '#EF4444';
      case 'Warm': return '#F59E0B';
      case 'Cold': return '#3B82F6';
      default: return '#94A3B8';
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
             <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0 }}>Prospecting</h2>
             <div style={{ background: '#111827', color: '#FFCC00', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>{myProspek.length} TOKO</div>
           </div>
           <div style={{ color: '#111827', opacity: 0.6, fontSize: '11px', fontWeight: 700 }}>Lead Generation & Acquisition</div>
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
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{p.nama_toko}</h3>
                      <div style={{ background: `${accent}15`, color: accent, fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {p.status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{p.no_wa}</span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>📍 {p.area}</span>
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
                        style={{ flex: 1, background: '#F0F9FF', color: '#0EA5E9', border: '1.5px solid #E0F2FE', borderRadius: '12px', padding: '12px 0', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          store.logCall(salesId, p.id, 'prospek', p.nama_toko, p.no_wa); 
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
                        onClick={(e) => { e.stopPropagation(); setEditModal(p); setNewForm({ nama_toko: p.nama_toko, nama_pic: p.nama_pic, no_wa: p.no_wa, area: p.area, status: p.status, link_map: p.link_map || '', kategori: p.kategori || 'Retail', rating: p.rating || 0, foto_profil: p.foto_profil || '', channel: p.channel || 'Canvasing' }); }}
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
          bottom: 'calc(40px + env(safe-area-inset-bottom))', 
          right: '25px', 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: '#3B82F6', 
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
          border: 'none',
          zIndex: 99,
          opacity: showFab ? 1 : 0,
          transform: showFab ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: showFab ? 'auto' : 'none'
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
            <p className="modal-sub">Great! <strong>{closingModal.nama_toko}</strong> is ready to order. Enter initial order amount (kg):</p>
            <div className="form-group">
              <input type="number" placeholder="example: 25" value={orderInput} onChange={e => setOrderInput(e.target.value)} className="form-input" />
            </div>
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
                disabled={!orderInput || isSubmitting}
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
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px 20px 100px', background: '#fff', border: 'none' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>➕ Tambah Prospek</h3>
              <button className="tap-active" onClick={() => setAddModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nama Toko *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={newForm.nama_toko} onChange={e => setNewForm({ ...newForm, nama_toko: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nama PIC</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={newForm.nama_pic} onChange={e => setNewForm({ ...newForm, nama_pic: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nomor WA *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="628xxx" value={newForm.no_wa} onChange={e => setNewForm({ ...newForm, no_wa: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Map Link (Google Maps)</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="https://maps.google.com/..." value={newForm.link_map || ''} onChange={e => setNewForm({ ...newForm, link_map: e.target.value })} /></div>

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
                <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                {newForm.foto_profil && (
                  <div className="animate-scale" style={{ position: 'relative', width: '80px', height: '80px', marginTop: '4px' }}>
                    <img src={newForm.foto_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', border: '2px solid var(--brand-yellow)' }} />
                    <button onClick={() => setNewForm({...newForm, foto_profil: ''})} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Kategori</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.kategori} onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      const val = prompt('Masukkan Kategori Baru:');
                      if (val && val.trim()) setNewForm({ ...newForm, kategori: val.trim() });
                    } else {
                      setNewForm({ ...newForm, kategori: e.target.value });
                    }
                  }}>
                    <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                    {!['Retail','Grosir','Distributor','Horeca'].includes(newForm.kategori || '') && newForm.kategori && <option value={newForm.kategori}>{newForm.kategori}</option>}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#F59E0B' }}>+ Tambah</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Rating Awal (0-5)</label>
                  <input type="number" min="0" max="5" className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.rating} onChange={e => setNewForm({ ...newForm, rating: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Wilayah Area</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.area} onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      const val = prompt('Masukkan Area Baru:');
                      if (val && val.trim()) setNewForm({ ...newForm, area: val.trim() });
                    } else {
                      setNewForm({ ...newForm, area: e.target.value });
                    }
                  }}>
                    <option value="Sepaku">Sepaku</option><option value="Gerogot">Tanah Grogot</option><option value="Kota">Kota Balikpapan</option>
                    {!['Sepaku','Gerogot','Kota'].includes(newForm.area || '') && newForm.area && <option value={newForm.area}>{newForm.area}</option>}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#F59E0B' }}>+ Tambah</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Status Suhu</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value as StatusProspek })}>
                    <option>Cold</option><option>Warm</option><option>Hot</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Sumber Prospek</label>
                <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.channel} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Sumber Baru:');
                    if (val && val.trim()) setNewForm({ ...newForm, channel: val.trim() });
                  } else {
                    setNewForm({ ...newForm, channel: e.target.value });
                  }
                }}>
                  <option value="Referensi">Referensi</option>
                  <option value="Canvasing">Canvasing</option>
                  <option value="Scraping">Scraping</option>
                  <option value="Kontak Sendiri">Kontak Sendiri</option>
                  {!['Referensi','Canvasing','Scraping','Kontak Sendiri'].includes(newForm.channel || '') && newForm.channel && <option value={newForm.channel}>{newForm.channel}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#F59E0B' }}>+ Tambah Sumber</option>
                </select>
              </div>

              {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="tap-active" style={{ flex: 1, padding: '18px', borderRadius: '20px', background: '#F1F5F9', color: '#64748B', fontWeight: 900, border: 'none' }} onClick={() => setAddModal(false)} disabled={isSubmitting}>Batal</button>
                <button 
                  className="tap-active" 
                  disabled={!newForm.nama_toko || !newForm.no_wa || isSubmitting}
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
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px 20px 100px', background: '#fff', border: 'none' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>✏️ Edit Prospek</h3>
              <button className="tap-active" onClick={() => setEditModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nama Toko *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={newForm.nama_toko} onChange={e => setNewForm({ ...newForm, nama_toko: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nama PIC</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={newForm.nama_pic} onChange={e => setNewForm({ ...newForm, nama_pic: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nomor WA *</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} value={newForm.no_wa} onChange={e => setNewForm({ ...newForm, no_wa: e.target.value })} /></div>
              <div className="form-group"><label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Map Link (Google Maps)</label><input className="form-input" style={{ width: '100%', borderRadius: '14px', border: '2px solid #f1f5f9', padding: '12px', fontWeight: 700, fontSize: '14px' }} placeholder="https://maps.google.com/..." value={newForm.link_map || ''} onChange={e => setNewForm({ ...newForm, link_map: e.target.value })} /></div>

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
                <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                {newForm.foto_profil && (
                  <div className="animate-scale" style={{ position: 'relative', width: '80px', height: '80px', marginTop: '4px' }}>
                    <img src={newForm.foto_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', border: '2px solid var(--brand-yellow)' }} />
                    <button onClick={() => setNewForm({...newForm, foto_profil: ''})} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Kategori</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.kategori} onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      const val = prompt('Masukkan Kategori Baru:');
                      if (val && val.trim()) setNewForm({ ...newForm, kategori: val.trim() });
                    } else {
                      setNewForm({ ...newForm, kategori: e.target.value });
                    }
                  }}>
                    <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                    {!['Retail','Grosir','Distributor','Horeca'].includes(newForm.kategori || '') && newForm.kategori && <option value={newForm.kategori}>{newForm.kategori}</option>}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#F59E0B' }}>+ Tambah</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Rating (0-5)</label>
                  <input type="number" min="0" max="5" className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.rating} onChange={e => setNewForm({ ...newForm, rating: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Wilayah Area</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.area} onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      const val = prompt('Masukkan Area Baru:');
                      if (val && val.trim()) setNewForm({ ...newForm, area: val.trim() });
                    } else {
                      setNewForm({ ...newForm, area: e.target.value });
                    }
                  }}>
                    <option value="Sepaku">Sepaku</option><option value="Gerogot">Tanah Grogot</option><option value="Kota">Kota Balikpapan</option>
                    {!['Sepaku','Gerogot','Kota'].includes(newForm.area || '') && newForm.area && <option value={newForm.area}>{newForm.area}</option>}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#F59E0B' }}>+ Tambah</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Status Suhu</label>
                  <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value as StatusProspek })}>
                    <option>Cold</option><option>Warm</option><option>Hot</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>Sumber Prospek</label>
                <select className="form-input" style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px', fontWeight: 700 }} value={newForm.channel} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Sumber Baru:');
                    if (val && val.trim()) setNewForm({ ...newForm, channel: val.trim() });
                  } else {
                    setNewForm({ ...newForm, channel: e.target.value });
                  }
                }}>
                  <option value="Referensi">Referensi</option>
                  <option value="Canvasing">Canvasing</option>
                  <option value="Scraping">Scraping</option>
                  <option value="Kontak Sendiri">Kontak Sendiri</option>
                  {!['Referensi','Canvasing','Scraping','Kontak Sendiri'].includes(newForm.channel || '') && newForm.channel && <option value={newForm.channel}>{newForm.channel}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#F59E0B' }}>+ Tambah Sumber</option>
                </select>
              </div>

              {saveError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="tap-active" style={{ flex: 1, padding: '18px', borderRadius: '20px', background: '#F1F5F9', color: '#64748B', fontWeight: 900, border: 'none' }} onClick={() => setEditModal(null)} disabled={isSubmitting}>Batal</button>
                <button 
                  className="tap-active" 
                  disabled={!newForm.nama_toko || !newForm.no_wa || isSubmitting}
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
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Filter Prospek</h3>
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
                  <Activity size={16} color="#94a3b8" />
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level Prospek (Suhu)</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['All', 'Hot', 'Warm', 'Cold'].map(s => (
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
                      {s === 'All' ? 'Semua' : s === 'Hot' ? '🔥 Hot' : s === 'Warm' ? '☀️ Warm' : '❄️ Cold'}
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
