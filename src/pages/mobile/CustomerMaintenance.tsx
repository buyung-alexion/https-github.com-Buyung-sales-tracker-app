import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, Search, AlertTriangle, Clock, MapPin, Edit3, X, Plus, Camera, Filter, ShoppingCart, Users, CheckSquare, FileText } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { Customer } from '../../types';


interface Props { salesId: string; }

function daysDiff(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / 86400000);
}

export default function CustomerMaintenance({ salesId }: Props) {
  const { customers, activities } = useSalesData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Needs Contact' | 'Active'>('All');
  const [filterArea, setFilterArea] = useState<string>('All');
  const [filterKategori, setFilterKategori] = useState<string>('All');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<Customer | null>(null);
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


  const handleSaveEdit = async () => {
    if (!editModal) return;
    await store.updateCustomer(editModal.id, {
      nama_toko: editForm.nama_toko,
      no_wa: editForm.no_wa,
      link_map: editForm.link_map,
      kategori: editForm.kategori,
      rating: editForm.rating,
      foto_profil: editForm.foto_profil,
    });
    setEditModal(null);
  };

  const handleAddCustomer = async () => {
    if (!addForm.nama_toko || !addForm.no_wa) return;
    const newId = crypto.randomUUID();
    const newCustomer: Customer = {
      id: newId,
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
    await store.addCustomer(newCustomer);
    setAddModal(false);
    setAddForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Sepaku', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '' });
  };

  const alertCount = myCustomers.filter(c => daysDiff(c.last_order_date) > 14).length;

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
              <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#111827', letterSpacing: '-1.5px', margin: 0 }}>Customer</h2>
              <div style={{ background: '#111827', color: '#FFCC00', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>{myCustomers.length} STORES</div>
            </div>
            {alertCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#111827', opacity: 0.8, fontSize: '12px', fontWeight: 800 }}>
                 <AlertTriangle size={14} color="#EF4444" strokeWidth={3} /> {alertCount} attention needed
              </div>
            ) : (
              <div style={{ color: '#111827', opacity: 0.6, fontSize: '12px', fontWeight: 700 }}>Management & Retention</div>
            )}
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
          {myCustomers.length === 0 && <p className="empty-state">Belum ada customer.</p>}
          {myCustomers.map(c => {
            const days = daysDiff(c.last_order_date);
            const overdue = days > 14;
            const actCount = activities.filter(a => a.target_id === c.id).length;

            return (
              <div 
                key={c.id} 
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
                {/* Status Indicator (Overdue) */}
                {overdue && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#FEE2E2', color: '#EF4444', fontSize: '10px', fontWeight: 900, padding: '4px 12px', borderRadius: '0 0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Attention Required
                  </div>
                )}

                {/* Main Store Info */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', cursor: 'pointer' }} onClick={() => navigate(`/mobile/profile/customer/${c.id}`)}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 8px 16px rgba(0,0,0,0.06)', border: '2px solid #fff' }}>
                    {c.foto_profil ? (
                       <img src={c.foto_profil} alt={c.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                       <img src={`https://ui-avatars.com/api/?name=${c.nama_toko}&background=f1f5f9&color=64748b&bold=true`} alt={c.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.3px', lineHeight: '1.2' }}>{c.nama_toko}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: '#FBBF24', fontSize: '12px', letterSpacing: '1px' }}>
                        {'★'.repeat(c.rating || 0)}{'☆'.repeat(5 - (c.rating || 0))}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, background: '#F1F5F9', color: '#64748b', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {c.kategori || 'Retail'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditModal(c); setEditForm({ nama_toko: c.nama_toko, no_wa: c.no_wa, link_map: c.link_map || '', kategori: c.kategori || 'Retail', rating: c.rating || 0, foto_profil: c.foto_profil || '' }); }} 
                    style={{ color: '#cbd5e1', background: '#f8fafc', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Performance Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#f1f5f9', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f1f5f9', marginBottom: '20px' }}>
                  <div style={{ background: '#fff', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Last Order</div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: overdue ? '#EF4444' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Clock size={12} /> {days}d
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Volume</div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>📦 {c.total_order_volume}kg</div>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Activities</div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#334155' }}>💬 {actCount}</div>
                  </div>
                </div>

                {/* Actions - Redesigned for consistency */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    style={{ width: '100%', background: '#F5F3FF', color: '#6D28D9', border: 'none', borderRadius: '18px', padding: '14px', fontWeight: 900, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(109, 40, 217, 0.08)' }} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const vol = prompt('Estimasi volume order (kg):');
                      if (vol) {
                        store.logOrder(salesId, c.id, c.nama_toko, parseFloat(vol));
                        window.open('accuratelite://', '_blank');
                      }
                    }}
                  >
                    <ShoppingCart size={18} /> Order Product (Accurate Lite)
                  </button>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      style={{ flex: 1, background: '#F8FAFC', color: '#6366F1', border: '1.5px solid #EEF2FF', borderRadius: '16px', padding: '12px 8px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                      onClick={(e) => { e.stopPropagation(); handleNote(c); }}
                    >
                      <FileText size={16} /> Note
                    </button>
                    <button 
                      style={{ flex: 1, background: '#ECFDF5', color: '#059669', border: '1.5px solid #D1FAE5', borderRadius: '16px', padding: '12px 8px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                      onClick={(e) => { e.stopPropagation(); handleWA(c); }}
                    >
                      <MessageCircle size={16} /> WA
                    </button>
                    <button 
                      style={{ flex: 1, background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #DBEAFE', borderRadius: '16px', padding: '12px 8px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                      onClick={(e) => { e.stopPropagation(); handleCall(c); }}
                    >
                      <Phone size={16} /> Call
                    </button>
                    {c.link_map && (
                      <button 
                        style={{ width: '48px', background: '#F8FAF9', color: '#64748B', border: '1.5px solid #F1F5F9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={(e) => { e.stopPropagation(); window.open(c.link_map || '#', '_blank'); }}
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

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Customer</h3>
              <button onClick={() => setEditModal(null)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Store Name *</label><input className="form-input" value={editForm.nama_toko} onChange={e => setEditForm({...editForm, nama_toko: e.target.value})} /></div>
            <div className="form-group"><label>WA Number *</label><input className="form-input" value={editForm.no_wa} onChange={e => setEditForm({...editForm, no_wa: e.target.value})} /></div>
            <div className="form-group"><label>Map Link (Google Maps)</label><input className="form-input" placeholder="https://maps.google.com/..." value={editForm.link_map} onChange={e => setEditForm({...editForm, link_map: e.target.value})} /></div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: editForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: editForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {editForm.foto_profil ? 'Photo Saved ✅' : 'Change Profile Photo (Optional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={e => handleCaptureProfilePhoto(e, true)} />
              </label>
              {editForm.foto_profil && <img src={editForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" value={editForm.kategori} onChange={e => {
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
                <label>Rating (0-5)</label>
                <input type="number" min="0" max="5" className="form-input" value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={!editForm.nama_toko || !editForm.no_wa}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Customer</h3>
              <button onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Store Name *</label><input className="form-input" value={addForm.nama_toko} onChange={e => setAddForm({...addForm, nama_toko: e.target.value})} placeholder="e.g. Toko Jaya" /></div>
            <div className="form-group"><label>PIC Name (Owner)</label><input className="form-input" value={addForm.nama_pic} onChange={e => setAddForm({...addForm, nama_pic: e.target.value})} placeholder="Optional" /></div>
            <div className="form-group"><label>WhatsApp Number *</label><input className="form-input" value={addForm.no_wa} onChange={e => setAddForm({...addForm, no_wa: e.target.value})} placeholder="628..." /></div>
            <div className="form-group"><label>Maps Link</label><input className="form-input" value={addForm.link_map} onChange={e => setAddForm({...addForm, link_map: e.target.value})} placeholder="https://..." /></div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: addForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: addForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {addForm.foto_profil ? 'Photo Saved ✅' : 'Upload Profile Photo (Optional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={e => handleCaptureProfilePhoto(e, false)} />
              </label>
              {addForm.foto_profil && <img src={addForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Operational Area</label>
                <select className="form-input" value={addForm.area} onChange={e => {
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
                <label>Category</label>
                <select className="form-input" value={addForm.kategori} onChange={e => {
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
            <div className="form-row">
              <div className="form-group">
                <label>Initial Rating</label>
                <input type="number" min="0" max="5" className="form-input" value={addForm.rating} onChange={e => setAddForm({...addForm, rating: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddCustomer} disabled={!addForm.nama_toko || !addForm.no_wa}>Save Customer</button>
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
