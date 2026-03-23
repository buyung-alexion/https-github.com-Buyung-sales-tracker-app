import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCheck, Search, Filter, Plus, X, MapPin, Edit3, PhoneCall, Camera } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { Prospek, StatusProspek } from '../../types';

interface Props { salesId: string; }

export default function ProspectingTool({ salesId }: Props) {
  const { prospek } = useSalesData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusProspek | 'All'>('All');
  const [closingModal, setClosingModal] = useState<Prospek | null>(null);
  const [orderInput, setOrderInput] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Prospek | null>(null);
  const navigate = useNavigate();
  const [newForm, setNewForm] = useState({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold' as StatusProspek, link_map: '', kategori: 'Retail', rating: 0, foto_profil: '' });

  useEffect(() => {
    if (window.location.hash === '#new') {
      setAddModal(true);
      // Clean up hash so it doesn't reopen on every render if modal closed
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
  }, []);

  const rawMyProspek = prospek.filter(p => p.sales_owner === salesId);
  const totalProspek = rawMyProspek.length || 1;
  const getCount = (cat: string) => rawMyProspek.filter(p => (p.kategori || 'Retail') === cat).length;
  const getPercent = (cat: string) => Math.round((getCount(cat) / totalProspek) * 100);
  const categoriesList = ['Retail', 'Grosir', 'Distributor', 'Horeca'];

  const myProspek = rawMyProspek
    .filter(p => filterStatus === 'All' || p.status === filterStatus)
    .filter(p => p.nama_toko.toLowerCase().includes(search.toLowerCase()) || p.nama_pic.toLowerCase().includes(search.toLowerCase()));

  const handleWA = async (p: Prospek) => {
    await store.logWA(salesId, p.id, 'prospek', p.nama_toko, p.no_wa);
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
    setNewForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '' });
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
    });
    setEditModal(null);
    setNewForm({ nama_toko: '', nama_pic: '', no_wa: '', area: 'Kota', status: 'Cold', link_map: '', kategori: 'Retail', rating: 0, foto_profil: '' });
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
    <div className="page-content">
      <div className="yellow-bg-top" style={{ height: '170px' }}></div>
      <div className="page-title-row" style={{ marginTop: '10px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>Prospek</h2>
        <button className="btn-icon-primary" style={{ background: '#111827', color: 'var(--brand-yellow)' }} onClick={() => setAddModal(true)}><Plus size={18} /></button>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Kategori Prospek</h3>
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
        <input placeholder="Cari toko atau PIC..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-row">
        <Filter size={14} />
        {(['All', 'Hot', 'Cold'] as (StatusProspek | 'All')[]).map(s => (
          <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="prospect-list">
        {myProspek.length === 0 && (
          <div className="empty-state-aesthetic">
            <div className="empty-icon-jar">🔭</div>
            <h4>Belum Ada Prospek</h4>
            <p>Ayo mulai cari toko baru dan capai target insentifmu bulan ini!</p>
          </div>
        )}
        {myProspek.map(p => {
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: '24px', padding: '16px', marginBottom: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/mobile/profile/prospek/${p.id}`)}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #f1f5f9' }}>
                  {p.foto_profil ? (
                     <img src={p.foto_profil} alt={p.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                     <img src={`https://ui-avatars.com/api/?name=${p.nama_toko}&background=random`} alt={p.nama_toko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>{p.nama_toko}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                      <MapPin size={12} /> {p.area}
                    </div>
                  </div>
                  
                  {/* Stars & Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ color: '#FBBF24', fontSize: '14px', letterSpacing: '2px' }}>
                      {'★'.repeat(p.rating || 0)}{'☆'.repeat(5 - (p.rating || 0))}
                    </div>
                    {p.kategori && (
                      <span style={{ fontSize: '10px', fontWeight: 800, background: '#f8fafc', color: '#64748b', padding: '4px 8px', borderRadius: '8px', textTransform: 'uppercase', border: '1px solid #e2e8f0' }}>
                        {p.kategori}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 600 }}>PIC: {p.nama_pic || '-'} • <span style={{ color: p.status === 'Hot' ? '#EF4444' : p.status === 'Warm' ? '#F59E0B' : '#3B82F6' }}>{p.status}</span></p>
                </div>
              </div>

              {/* Edit Icon overlaid on top right edge of the card */}
              <button 
                onClick={(e) => { e.stopPropagation(); setEditModal(p); setNewForm({ nama_toko: p.nama_toko, nama_pic: p.nama_pic, no_wa: p.no_wa, area: p.area, status: p.status, link_map: p.link_map || '', kategori: p.kategori || 'Retail', rating: p.rating || 0, foto_profil: p.foto_profil || '' }); }} 
                style={{ position: 'absolute', right: '16px', top: '45px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <Edit3 size={16} />
              </button>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f8fafc' }}>
                <button style={{ flex: 1, background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); setClosingModal(p); }}>
                  <CheckCheck size={16} /> Closing
                </button>
                <button style={{ flex: 1, background: '#D1FAE5', color: '#059669', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); handleWA(p); }}>
                  <MessageCircle size={16} /> Chat
                </button>
                <button style={{ flex: 1, background: '#E0F2FE', color: '#0284C7', border: 'none', borderRadius: '12px', padding: '10px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); window.open(`tel:${p.no_wa}`); }}>
                  <PhoneCall size={16} /> Call
                </button>
                {p.link_map && (
                  <button style={{ width: '44px', background: '#F1F5F9', color: '#64748b', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); window.open(p.link_map || '#', '_blank'); }}>
                    <MapPin size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Closing Modal */}
      {closingModal && (
        <div className="modal-overlay" onClick={() => setClosingModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🤝 Deal Closing!</h3>
              <button onClick={() => setClosingModal(null)}><X size={20} /></button>
            </div>
            <p className="modal-sub">Selamat! <strong>{closingModal.nama_toko}</strong> mau order. Masukkan jumlah order pertama (kg):</p>
            <div className="form-group">
              <input type="number" placeholder="contoh: 25" value={orderInput} onChange={e => setOrderInput(e.target.value)} className="form-input" />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setClosingModal(null)}>Batal</button>
              <button className="btn-success" onClick={handleClosing} disabled={!orderInput}>Konfirmasi Closing</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prospek Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Tambah Prospek Baru</h3>
              <button onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Nama Toko *</label><input className="form-input" value={newForm.nama_toko} onChange={e => setNewForm({ ...newForm, nama_toko: e.target.value })} /></div>
            <div className="form-group"><label>Nama PIC</label><input className="form-input" value={newForm.nama_pic} onChange={e => setNewForm({ ...newForm, nama_pic: e.target.value })} /></div>
            <div className="form-group"><label>Nomor WA *</label><input className="form-input" placeholder="628xxx" value={newForm.no_wa} onChange={e => setNewForm({ ...newForm, no_wa: e.target.value })} /></div>
            <div className="form-group"><label>Link Map (Google Maps)</label><input className="form-input" placeholder="https://maps.google.com/..." value={newForm.link_map || ''} onChange={e => setNewForm({ ...newForm, link_map: e.target.value })} /></div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: newForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: newForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {newForm.foto_profil ? 'Foto Profil Tersimpan ✅' : 'Upload Foto Profil (Opsional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapturePhoto} />
              </label>
              {newForm.foto_profil && <img src={newForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Kategori</label>
                <select className="form-input" value={newForm.kategori} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Kategori Baru:');
                    if (val && val.trim()) setNewForm({ ...newForm, kategori: val.trim() });
                  } else {
                    setNewForm({ ...newForm, kategori: e.target.value });
                  }
                }}>
                  <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                  {!['Retail','Grosir','Distributor','Horeca'].includes(newForm.kategori || '') && newForm.kategori && <option value={newForm.kategori}>{newForm.kategori}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Baru</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rating Awal (0-5)</label>
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
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Baru</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value as StatusProspek })}>
                  <option>Cold</option><option>Warm</option><option>Hot</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAddModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleAddProspek} disabled={!newForm.nama_toko || !newForm.no_wa}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prospek Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Prospek</h3>
              <button onClick={() => setEditModal(null)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Nama Toko *</label><input className="form-input" value={newForm.nama_toko} onChange={e => setNewForm({ ...newForm, nama_toko: e.target.value })} /></div>
            <div className="form-group"><label>Nama PIC</label><input className="form-input" value={newForm.nama_pic} onChange={e => setNewForm({ ...newForm, nama_pic: e.target.value })} /></div>
            <div className="form-group"><label>Nomor WA *</label><input className="form-input" value={newForm.no_wa} onChange={e => setNewForm({ ...newForm, no_wa: e.target.value })} /></div>
            <div className="form-group"><label>Link Map (Google Maps)</label><input className="form-input" placeholder="https://maps.google.com/..." value={newForm.link_map || ''} onChange={e => setNewForm({ ...newForm, link_map: e.target.value })} /></div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: newForm.foto_profil ? '#ecfdf5' : '#f8fafc', color: newForm.foto_profil ? '#059669' : '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '13px' }}>
                <Camera size={16} /> {newForm.foto_profil ? 'Foto Profil Tersimpan ✅' : 'Ubah Foto Profil (Opsional)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapturePhoto} />
              </label>
              {newForm.foto_profil && <img src={newForm.foto_profil} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid #e2e8f0', display: 'block' }} />}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Kategori</label>
                <select className="form-input" value={newForm.kategori} onChange={e => {
                  if (e.target.value === 'ADD_NEW') {
                    const val = prompt('Masukkan Kategori Baru:');
                    if (val && val.trim()) setNewForm({ ...newForm, kategori: val.trim() });
                  } else {
                    setNewForm({ ...newForm, kategori: e.target.value });
                  }
                }}>
                  <option value="Retail">Retail</option><option value="Grosir">Grosir</option><option value="Distributor">Distributor</option><option value="Horeca">Horeca</option>
                  {!['Retail','Grosir','Distributor','Horeca'].includes(newForm.kategori || '') && newForm.kategori && <option value={newForm.kategori}>{newForm.kategori}</option>}
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Baru</option>
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
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Baru</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value as StatusProspek })}>
                  <option>Cold</option><option>Warm</option><option>Hot</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditModal(null)}>Batal</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={!newForm.nama_toko || !newForm.no_wa}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
