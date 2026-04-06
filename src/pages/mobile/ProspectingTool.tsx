import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCheck, Search, Filter, Plus, X, MapPin, Edit3, PhoneCall, Camera, Users, Activity, FileText } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { Prospek, StatusProspek } from '../../types';

interface Props { salesId: string; }

export default function ProspectingTool({ salesId }: Props) {
  const { prospek } = useSalesData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusProspek | 'All'>('All');
  const [filterArea, setFilterArea] = useState<string>('All');
  const [filterKategori, setFilterKategori] = useState<string>('All');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  const [closingModal, setClosingModal] = useState<Prospek | null>(null);
  const [orderInput, setOrderInput] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Prospek | null>(null);
  const navigate = useNavigate();

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
    if (!closingModal || !orderInput) return;
    await store.convertToCustomer(closingModal, parseFloat(orderInput));
    setClosingModal(null);
    setOrderInput('');
  };

  const handleAddProspek = async () => {
    if (!newForm.nama_toko || !newForm.no_wa) return;
    await store.addProspek({ ...newForm, sales_owner: salesId });
    setAddModal(false);
    setNewForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '', channel: 'Canvasing' });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    await store.updateProspek(editModal.id, {
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
    setEditModal(null);
    setNewForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '', channel: 'Canvasing' });
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="page-content" style={{ paddingTop: 0 }}>
      {/* Header with zIndex fix to ensure interactivity */}
      <div className="yellow-bg-top" style={{ height: '230px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px 25px', zIndex: 50 }}>
        {/* Decorative elements with pointer-events: none */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '10px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 6, marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#111827', letterSpacing: '-1.5px', margin: 0 }}>Prospecting</h2>
              <div style={{ background: '#111827', color: '#FFCC00', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>{myProspek.length} STORES</div>
            </div>
            <div style={{ color: '#111827', opacity: 0.6, fontSize: '12px', fontWeight: 700 }}>Lead Generation & Analysis</div>
          </div>
          <button 
            className="btn-icon-primary tap-active" 
            style={{ 
              background: '#111827', 
              color: 'var(--brand-yellow)', 
              width: '44px', 
              height: '44px', 
              borderRadius: '14px', 
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }} 
            onClick={() => setAddModal(true)}
          >
            <Plus size={22} strokeWidth={3} />
          </button>
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
      </div>

      <div style={{ padding: '24px 20px 0', position: 'relative' }}>
        <div className="prospect-list">
          {myProspek.length === 0 && (
            <div className="empty-state-aesthetic">
              <div className="empty-icon-jar">🔭</div>
              <h4>No Prospects Yet</h4>
              <p>Start searching for new stores and reach your targets this month!</p>
            </div>
          )}
          {myProspek.map(p => {
            return (
              <div 
                key={p.id} 
                style={{ 
                  background: '#fff', 
                  borderRadius: '28px', 
                  padding: '20px', 
                  marginBottom: '20px', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.04)', 
                  position: 'relative', 
                  border: '1px solid rgba(0,0,0,0.03)',
                  overflow: 'hidden'
                }}
              >
                {/* Status Badge */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    background: p.status === 'Hot' ? '#FEE2E2' : p.status === 'Warm' ? '#FEF3C7' : '#DBEAFE', 
                    color: p.status === 'Hot' ? '#EF4444' : p.status === 'Warm' ? '#D97706' : '#2563EB', 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    padding: '4px 12px', 
                    borderRadius: '0 0 0 16px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px' 
                  }}
                >
                  {p.status}
                </div>

                {/* Main Info */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', cursor: 'pointer' }} onClick={() => navigate(`/mobile/profile/prospek/${p.id}`)}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 8px 16px rgba(0,0,0,0.06)', border: '2px solid #fff' }}>
                    {p.foto_profil ? (
                       <img src={p.foto_profil} alt={p.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                       <img src={`https://ui-avatars.com/api/?name=${p.nama_toko}&background=f1f5f9&color=64748b&bold=true`} alt={p.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#1e293b', margin: '0 0 4px 0', letterSpacing: '-0.3px', lineHeight: '1.2' }}>{p.nama_toko}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: '#FBBF24', fontSize: '12px', letterSpacing: '1px' }}>
                        {'★'.repeat(p.rating || 0)}{'☆'.repeat(5 - (p.rating || 0))}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, background: '#F1F5F9', color: '#64748b', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {p.kategori || 'Retail'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditModal(p); setNewForm({ nama_toko: p.nama_toko, nama_pic: p.nama_pic, no_wa: p.no_wa, area: p.area, status: p.status, link_map: p.link_map || '', kategori: p.kategori || 'Retail', rating: p.rating || 0, foto_profil: p.foto_profil || '', channel: p.channel || 'Canvasing' }); }} 
                    style={{ color: '#cbd5e1', background: '#f8fafc', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Detail Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#f1f5f9', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f1f5f9', marginBottom: '20px' }}>
                  <div style={{ background: '#fff', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Area</div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {p.area}
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>PIC</div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>👤 {p.nama_pic || '-'}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Engagement</div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#475569' }}>🔥 {p.status}</div>
                  </div>
                </div>

                {/* Actions - Redesigned for clarity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    style={{ width: '100%', background: '#FFF7ED', color: '#EA580C', border: 'none', borderRadius: '18px', padding: '14px', fontWeight: 900, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.08)' }} 
                    onClick={(e) => { e.stopPropagation(); setClosingModal(p); }}
                  >
                    <CheckCheck size={18} /> Closing Deal
                  </button>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      style={{ flex: 1, background: '#F8FAFC', color: '#6366F1', border: '1.5px solid #EEF2FF', borderRadius: '16px', padding: '12px 8px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                      onClick={(e) => { e.stopPropagation(); handleNote(p); }}
                    >
                      <FileText size={16} /> Note
                    </button>
                    <button 
                      style={{ flex: 1, background: '#ECFDF5', color: '#059669', border: '1.5px solid #D1FAE5', borderRadius: '16px', padding: '12px 8px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                      onClick={(e) => { e.stopPropagation(); handleWA(p); }}
                    >
                      <MessageCircle size={16} /> Chat
                    </button>
                    <button 
                      style={{ flex: 1, background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #DBEAFE', borderRadius: '16px', padding: '12px 8px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        store.logCall(salesId, p.id, 'prospek', p.nama_toko, p.no_wa); 
                        const cleanNum = p.no_wa.replace(/\D/g, '');
                        window.open(`https://wa.me/${cleanNum}`, '_blank');
                      }}
                    >
                      <PhoneCall size={16} /> Call
                    </button>
                    {p.link_map && (
                      <button 
                        style={{ width: '48px', background: '#F8FAF9', color: '#64748B', border: '1.5px solid #F1F5F9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={(e) => { e.stopPropagation(); window.open(p.link_map || '#', '_blank'); }}
                      >
                        <MapPin size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setClosingModal(null)}>Cancel</button>
              <button className="btn-success" onClick={handleClosing} disabled={!orderInput}>Confirm Closing</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prospek Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Add New Prospect</h3>
              <button onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Store Name *</label><input className="form-input" value={newForm.nama_toko} onChange={e => setNewForm({ ...newForm, nama_toko: e.target.value })} /></div>
            <div className="form-group"><label>PIC Name</label><input className="form-input" value={newForm.nama_pic} onChange={e => setNewForm({ ...newForm, nama_pic: e.target.value })} /></div>
            <div className="form-group"><label>WA Number *</label><input className="form-input" placeholder="628xxx" value={newForm.no_wa} onChange={e => setNewForm({ ...newForm, no_wa: e.target.value })} /></div>
            <div className="form-group"><label>Map Link (Google Maps)</label><input className="form-input" placeholder="https://maps.google.com/..." value={newForm.link_map || ''} onChange={e => setNewForm({ ...newForm, link_map: e.target.value })} /></div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: newForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: newForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {newForm.foto_profil ? 'Foto Profil Tersimpan ✅' : 'Upload Foto Profil (Opsional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapturePhoto} />
              </label>
              {newForm.foto_profil && <img src={newForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" value={newForm.kategori} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Enter New Category:');
                    if (val && val.trim()) setNewForm({ ...newForm, kategori: val.trim() });
                  } else {
                    setNewForm({ ...newForm, kategori: e.target.value });
                  }
                }}>
                  <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                  {!['Retail','Grosir','Distributor','Horeca'].includes(newForm.kategori || '') && newForm.kategori && <option value={newForm.kategori}>{newForm.kategori}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New</option>
                </select>
              </div>
              <div className="form-group">
                <label>Initial Rating (0-5)</label>
                <input type="number" min="0" max="5" className="form-input" value={newForm.rating} onChange={e => setNewForm({ ...newForm, rating: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Area</label>
                <select className="form-input" value={newForm.area} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Area Baru:');
                    if (val && val.trim()) setNewForm({ ...newForm, area: val.trim() });
                  } else {
                    setNewForm({ ...newForm, area: e.target.value });
                  }
                }}>
                  <option value="Sepaku">Sepaku</option><option value="Gerogot">Tanah Grogot</option><option value="Kota">Kota Balikpapan</option>
                  {!['Sepaku','Gerogot','Kota'].includes(newForm.area || '') && newForm.area && <option value={newForm.area}>{newForm.area}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value as StatusProspek })}>
                  <option>Cold</option><option>Warm</option><option>Hot</option>
                </select>
              </div>
            </div>
            {/* New Channel Section */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Sumber / Chanel Prospek</label>
              <select className="form-input" value={newForm.channel} onChange={e => {
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
                <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New Source</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddProspek} disabled={!newForm.nama_toko || !newForm.no_wa}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prospek Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Prospect</h3>
              <button onClick={() => setEditModal(null)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Store Name *</label><input className="form-input" value={newForm.nama_toko} onChange={e => setNewForm({ ...newForm, nama_toko: e.target.value })} /></div>
            <div className="form-group"><label>PIC Name</label><input className="form-input" value={newForm.nama_pic} onChange={e => setNewForm({ ...newForm, nama_pic: e.target.value })} /></div>
            <div className="form-group"><label>WA Number *</label><input className="form-input" value={newForm.no_wa} onChange={e => setNewForm({ ...newForm, no_wa: e.target.value })} /></div>
            <div className="form-group"><label>Map Link (Google Maps)</label><input className="form-input" placeholder="https://maps.google.com/..." value={newForm.link_map || ''} onChange={e => setNewForm({ ...newForm, link_map: e.target.value })} /></div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: newForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: newForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {newForm.foto_profil ? 'Photo Saved ✅' : 'Change Profile Photo (Optional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapturePhoto} />
              </label>
              {newForm.foto_profil && <img src={newForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" value={newForm.kategori} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Enter New Category:');
                    if (val && val.trim()) setNewForm({ ...newForm, kategori: val.trim() });
                  } else {
                    setNewForm({ ...newForm, kategori: e.target.value });
                  }
                }}>
                  <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                  {!['Retail','Grosir','Distributor','Horeca'].includes(newForm.kategori || '') && newForm.kategori && <option value={newForm.kategori}>{newForm.kategori}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rating (0-5)</label>
                <input type="number" min="0" max="5" className="form-input" value={newForm.rating} onChange={e => setNewForm({ ...newForm, rating: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Area</label>
                <select className="form-input" value={newForm.area} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Area Baru:');
                    if (val && val.trim()) setNewForm({ ...newForm, area: val.trim() });
                  } else {
                    setNewForm({ ...newForm, area: e.target.value });
                  }
                }}>
                  <option value="Sepaku">Sepaku</option><option value="Gerogot">Tanah Grogot</option><option value="Kota">Kota Balikpapan</option>
                  {!['Sepaku','Gerogot','Kota'].includes(newForm.area || '') && newForm.area && <option value={newForm.area}>{newForm.area}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value as StatusProspek })}>
                  <option>Cold</option><option>Warm</option><option>Hot</option>
                </select>
              </div>
            </div>
            {/* New Channel Section for Edit */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Sumber / Chanel Prospek</label>
              <select className="form-input" value={newForm.channel} onChange={e => {
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
                <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Add New Source</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={!newForm.nama_toko || !newForm.no_wa}>Save Changes</button>
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
