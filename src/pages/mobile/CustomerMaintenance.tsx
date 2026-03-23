import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, Search, AlertTriangle, Clock, MapPin, Edit3, X, Plus, Camera, Filter } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Perlu dihubungi' | 'Customer Aktif'>('Semua');
  const [noteModal, setNoteModal] = useState<Customer | null>(null);
  const [note, setNote] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
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

  const rawMyCustomers = customers.filter(c => c.sales_pic === salesId);
  const totalCustomers = rawMyCustomers.length || 1;
  const getCount = (cat: string) => rawMyCustomers.filter(c => (c.kategori || 'Retail') === cat).length;
  const getPercent = (cat: string) => Math.round((getCount(cat) / totalCustomers) * 100);
  const categoriesList = ['Retail', 'Grosir', 'Distributor', 'Horeca'];

  const myCustomers = rawMyCustomers
    .filter(c => c.nama_toko.toLowerCase().includes(search.toLowerCase()))
    .filter(c => {
      if (filterStatus === 'Semua') return true;
      const overdue = daysDiff(c.last_order_date) > 14;
      if (filterStatus === 'Perlu dihubungi') return overdue;
      if (filterStatus === 'Customer Aktif') return !overdue;
      return true;
    })
    .sort((a, b) => daysDiff(a.last_order_date) - daysDiff(b.last_order_date) < 0 ? 1 : -1);

  const handleWA = async (c: Customer) => {
    await store.logWA(salesId, c.id, 'customer', c.nama_toko, c.no_wa, 'Follow-up maintenance pelanggan.');
  };

  const handleCall = async (c: Customer) => {
    await store.logActivity({ id_sales: salesId, target_id: c.id, target_type: 'customer', target_nama: c.nama_toko, tipe_aksi: 'Call', catatan_hasil: note || 'Follow-up via telepon.' });
    window.open(`tel:${c.no_wa}`, '_blank');
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
        setPhotoBase64(canvas.toDataURL('image/jpeg', 0.6));
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
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

  const handleAddNote = async () => {
    if (!noteModal) return;
    await store.logActivity({ 
      id_sales: salesId, 
      target_id: noteModal.id, 
      target_type: 'customer', 
      target_nama: noteModal.nama_toko, 
      tipe_aksi: 'WA', 
      catatan_hasil: note,
      geotagging: photoBase64 ? { area: noteModal.area, photo: photoBase64 } : undefined
    });
    setNoteModal(null);
    setNote('');
    setPhotoBase64(null);
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
    <div className="page-content">
      <div className="yellow-bg-top" style={{ height: '170px' }}></div>
      <div className="page-title-row" style={{ marginTop: '10px', marginBottom: '8px', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>Customer</h2>
          {alertCount > 0 && (
            <div style={{ marginTop: '4px' }}>
              <span className="alert-badge"><AlertTriangle size={14} /> {alertCount} rindu order</span>
            </div>
          )}
        </div>
        <button className="btn-icon-primary" style={{ background: '#111827', color: 'var(--brand-yellow)' }} onClick={() => setAddModal(true)}><Plus size={18} /></button>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Kategori Customer</h3>
          <div style={{ background: '#D1FAE5', color: '#059669', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>i</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {categoriesList.map(c => {
            const count = getCount(c);
            const pct = getPercent(c);
            return (
              <div key={c}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>
                  <span style={{ color: '#334155' }}>{c}</span>
                  <span style={{ color: '#F59E0B' }}>{count} Toko</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#F59E0B', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="search-bar" style={{ marginBottom: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <Search size={16} />
        <input placeholder="Cari toko customer..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-row">
        <Filter size={14} />
        {(['Semua', 'Perlu dihubungi', 'Customer Aktif'] as const).map(s => (
          <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="customer-list">
        {myCustomers.length === 0 && <p className="empty-state">Belum ada customer.</p>}
        {myCustomers.map(c => {
          const days = daysDiff(c.last_order_date);
          const overdue = days > 14;
          const actCount = activities.filter(a => a.target_id === c.id).length;

          return (
            <div key={c.id} style={{ background: '#fff', borderRadius: '24px', padding: '16px', marginBottom: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'relative', border: overdue ? '2px solid #FEF2F2' : 'none' }}>
              
              {overdue && (
                <div style={{ background: '#FEF2F2', color: '#EF4444', fontSize: '12px', fontWeight: 800, padding: '6px 16px', borderRadius: '12px 12px 0 0', margin: '-16px -16px 16px -16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> {days} hari tidak order — Segera hubungi!
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/mobile/profile/customer/${c.id}`)}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #f1f5f9' }}>
                  {c.foto_profil ? (
                     <img src={c.foto_profil} alt={c.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                     <img src={`https://ui-avatars.com/api/?name=${c.nama_toko}&background=random`} alt={c.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>{c.nama_toko}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                      <MapPin size={12} /> {c.area}
                    </div>
                  </div>
                  
                  {/* Stars & Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ color: '#FBBF24', fontSize: '14px', letterSpacing: '2px' }}>
                      {'★'.repeat(c.rating || 0)}{'☆'.repeat(5 - (c.rating || 0))}
                    </div>
                    {c.kategori && (
                      <span style={{ fontSize: '10px', fontWeight: 800, background: '#f8fafc', color: '#64748b', padding: '4px 8px', borderRadius: '8px', textTransform: 'uppercase', border: '1px solid #e2e8f0' }}>
                        {c.kategori}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 600, display: 'flex', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: overdue ? '#EF4444' : '#10B981' }}><Clock size={12} /> {days}h lalu</span>
                    <span>📦 {c.total_order_volume}kg</span>
                    <span>💬 {actCount} act</span>
                  </div>
                </div>
              </div>

              {/* Edit Icon overlaid on top right edge of the card */}
              <button 
                onClick={(e) => { e.stopPropagation(); setEditModal(c); setEditForm({ nama_toko: c.nama_toko, no_wa: c.no_wa, link_map: c.link_map || '', kategori: c.kategori || 'Retail', rating: c.rating || 0, foto_profil: c.foto_profil || '' }); }} 
                style={{ position: 'absolute', right: '16px', top: overdue ? '75px' : '45px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <Edit3 size={16} />
              </button>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f8fafc' }}>
                <button style={{ flex: 1, background: '#D1FAE5', color: '#059669', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); handleWA(c); }}>
                  <MessageCircle size={16} /> WA
                </button>
                <button style={{ flex: 1, background: '#E0F2FE', color: '#0284C7', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); handleCall(c); }}>
                  <Phone size={16} /> Call
                </button>
                <button style={{ flex: 1, background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); setNoteModal(c); setNote(''); setPhotoBase64(null); }}>
                  📝 Catat
                </button>
                {c.link_map && (
                  <button style={{ width: '44px', background: '#F1F5F9', color: '#64748b', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); window.open(c.link_map || '#', '_blank'); }}>
                    <MapPin size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Catat Interaksi</h3>
              <button onClick={() => setNoteModal(null)}>✕</button>
            </div>
            <p className="modal-sub"><strong>{noteModal.nama_toko}</strong></p>
            <div className="form-group">
              <label>Catatan Hasil</label>
              <textarea className="form-input" rows={3} placeholder="Apa hasil interaksi hari ini?" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', margin: 0, padding: '12px' }}>
                <Camera size={16} /> {photoBase64 ? 'Foto Tersimpan ✅' : 'Upload Bukti Chat / Foto'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapturePhoto} />
              </label>
            </div>
            {photoBase64 && <img src={photoBase64} alt="Bukti" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.1)' }} />}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setNoteModal(null); setPhotoBase64(null); }}>Batal</button>
              <button className="btn-primary" onClick={handleAddNote} disabled={!note}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Customer</h3>
              <button onClick={() => setEditModal(null)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Nama Toko *</label><input className="form-input" value={editForm.nama_toko} onChange={e => setEditForm({...editForm, nama_toko: e.target.value})} /></div>
            <div className="form-group"><label>Nomor WA *</label><input className="form-input" value={editForm.no_wa} onChange={e => setEditForm({...editForm, no_wa: e.target.value})} /></div>
            <div className="form-group"><label>Link Map (Google Maps)</label><input className="form-input" placeholder="https://maps.google.com/..." value={editForm.link_map} onChange={e => setEditForm({...editForm, link_map: e.target.value})} /></div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: editForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: editForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {editForm.foto_profil ? 'Foto Profil Tersimpan ✅' : 'Ubah Foto Profil (Opsional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={e => handleCaptureProfilePhoto(e, true)} />
              </label>
              {editForm.foto_profil && <img src={editForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Kategori</label>
                <select className="form-input" value={editForm.kategori} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Kategori Baru:');
                    if (val && val.trim()) setEditForm({ ...editForm, kategori: val.trim() });
                  } else {
                    setEditForm({ ...editForm, kategori: e.target.value });
                  }
                }}>
                  <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                  {!['Retail','Grosir','Distributor','Horeca'].includes(editForm.kategori || '') && editForm.kategori && <option value={editForm.kategori}>{editForm.kategori}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Baru</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rating (0-5)</label>
                <input type="number" min="0" max="5" className="form-input" value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditModal(null)}>Batal</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={!editForm.nama_toko || !editForm.no_wa}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Customer Baru</h3>
              <button onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Nama Toko *</label><input className="form-input" value={addForm.nama_toko} onChange={e => setAddForm({...addForm, nama_toko: e.target.value})} placeholder="Contoh: Toko Jaya" /></div>
            <div className="form-group"><label>Nama PIC (Pemilik)</label><input className="form-input" value={addForm.nama_pic} onChange={e => setAddForm({...addForm, nama_pic: e.target.value})} placeholder="Opsional" /></div>
            <div className="form-group"><label>Nomor WhatsApp *</label><input className="form-input" value={addForm.no_wa} onChange={e => setAddForm({...addForm, no_wa: e.target.value})} placeholder="628..." /></div>
            <div className="form-group"><label>Link Maps</label><input className="form-input" value={addForm.link_map} onChange={e => setAddForm({...addForm, link_map: e.target.value})} placeholder="https://..." /></div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: addForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: addForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {addForm.foto_profil ? 'Foto Profil Tersimpan ✅' : 'Upload Foto Profil (Opsional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={e => handleCaptureProfilePhoto(e, false)} />
              </label>
              {addForm.foto_profil && <img src={addForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Area Operasional</label>
                <select className="form-input" value={addForm.area} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Area Baru:');
                    if (val && val.trim()) setAddForm({ ...addForm, area: val.trim() });
                  } else {
                    setAddForm({ ...addForm, area: e.target.value });
                  }
                }}>
                  <option value="Sepaku">Sepaku</option><option value="Gerogot">Tanah Grogot</option><option value="Kota">Kota Balikpapan</option>
                  {!['Sepaku','Gerogot','Kota'].includes(addForm.area || '') && addForm.area && <option value={addForm.area}>{addForm.area}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Baru</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select className="form-input" value={addForm.kategori} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Kategori Baru:');
                    if (val && val.trim()) setAddForm({ ...addForm, kategori: val.trim() });
                  } else {
                    setAddForm({ ...addForm, kategori: e.target.value });
                  }
                }}>
                  <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                  {!['Retail','Grosir','Distributor','Horeca'].includes(addForm.kategori || '') && addForm.kategori && <option value={addForm.kategori}>{addForm.kategori}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Baru</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Rating Awal</label>
                <input type="number" min="0" max="5" className="form-input" value={addForm.rating} onChange={e => setAddForm({...addForm, rating: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAddModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleAddCustomer} disabled={!addForm.nama_toko || !addForm.no_wa}>Simpan Customer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
