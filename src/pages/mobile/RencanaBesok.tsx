import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesData } from '../../hooks/useSalesData';
import { store } from '../../store/dataStore';
import { ArrowLeft, Plus, Calendar, MessageCircle, PhoneCall, MapPin, X, CheckSquare } from 'lucide-react';
import type { TipeAksi } from '../../types';

interface Props { salesId: string; }

export default function RencanaBesok({ salesId }: Props) {
  const navigate = useNavigate();
  const { planBesok, prospek, customers } = useSalesData();
  const [addModal, setAddModal] = useState(false);

  // Form State
  const [targetGroup, setTargetGroup] = useState<'prospek' | 'customer'>('prospek');
  const [targetId, setTargetId] = useState('');
  const [tipeAksi, setTipeAksi] = useState<TipeAksi>('Visit');
  const [tanggal, setTanggal] = useState('');
  const [catatan, setCatatan] = useState('');

  const myPlans = planBesok
    .filter(p => p.sales_id === salesId)
    .sort((a, b) => new Date(a.tanggal_rencana).getTime() - new Date(b.tanggal_rencana).getTime());

  const myProspek = prospek.filter(p => p.sales_owner === salesId);
  const myCustomers = customers.filter(c => c.sales_pic === salesId);

  const getTargetOptions = () => targetGroup === 'prospek' ? myProspek : myCustomers;

  const handleAddPlan = async () => {
    if (!targetId || !tanggal || !tipeAksi) return;

    const targetList = getTargetOptions();
    const selectedTarget = targetList.find(t => t.id === targetId);
    if (!selectedTarget) return;

    await store.addPlanBesok({
      sales_id: salesId,
      target_id: targetId,
      target_type: targetGroup,
      target_nama: selectedTarget.nama_toko,
      tanggal_rencana: tanggal,
      tipe_aksi: tipeAksi,
      catatan: catatan
    });

    setAddModal(false);
    setTargetId('');
    setCatatan('');
  };

  const handleComplete = async (id: string) => {
    await store.updatePlanBesok(id, { status: 'Selesai' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus rencana ini?')) {
      await store.deletePlanBesok(id);
    }
  };

  const getIconForAksi = (aksi: string) => {
    if (aksi === 'WA') return <MessageCircle size={16} color="#059669" />;
    if (aksi === 'Call') return <PhoneCall size={16} color="#0284C7" />;
    return <MapPin size={16} color="#7E22CE" />;
  };

  return (
    <div className="page-content" style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <button onClick={() => navigate('/mobile/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}>
          <ArrowLeft size={24} color="#111827" />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Rencana Aktivitas</h2>
        <button onClick={() => setAddModal(true)} style={{ background: '#111827', border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="var(--brand-yellow)" />
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {myPlans.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8' }}>
            <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#475569' }}>Belum Ada Rencana Aktivitas</div>
            <p style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.5' }}>Gunakan tombol + di kanan atas untuk mulai membuat rencana kunjungan / jadwal aktivitas.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myPlans.map(plan => {
              const isSelesai = plan.status === 'Selesai';
              return (
                <div key={plan.id} style={{ background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', opacity: isSelesai ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {getIconForAksi(plan.tipe_aksi)}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', textDecoration: isSelesai ? 'line-through' : 'none' }}>{plan.target_nama}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                          Target: {plan.target_type}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#3B82F6', background: '#EFF6FF', padding: '4px 10px', borderRadius: '8px' }}>
                      {new Date(plan.tanggal_rencana).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  {plan.catatan && (
                    <div style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '12px', marginBottom: '16px', fontStyle: 'italic' }}>
                      "{plan.catatan}"
                    </div>
                  )}

                  {!isSelesai && (
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <button onClick={() => handleDelete(plan.id)} style={{ flex: '0.4', background: '#FEF2F2', border: 'none', color: '#EF4444', fontWeight: 700, fontSize: '13px', borderRadius: '12px', padding: '10px' }}>Hapus</button>
                      <button onClick={() => handleComplete(plan.id)} style={{ flex: '1', background: '#10B981', border: 'none', color: '#fff', fontWeight: 800, fontSize: '13px', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckSquare size={16} /> Tandai Selesai
                      </button>
                    </div>
                  )}
                  {isSelesai && (
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', textAlign: 'center', background: '#D1FAE5', padding: '8px', borderRadius: '8px' }}>
                      ✓ Rencana Telah Diselesaikan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Rencana Baru</h3>
              <button onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            
            <div className="form-group">
              <label>Pilih Grup Target</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setTargetGroup('prospek'); setTargetId(''); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: targetGroup === 'prospek' ? '2px solid var(--brand-yellow)' : '1px solid #e2e8f0', background: targetGroup === 'prospek' ? '#fffbeb' : '#fff', fontWeight: 700, fontSize: '13px' }}>Prospek</button>
                <button onClick={() => { setTargetGroup('customer'); setTargetId(''); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: targetGroup === 'customer' ? '2px solid var(--brand-yellow)' : '1px solid #e2e8f0', background: targetGroup === 'customer' ? '#fffbeb' : '#fff', fontWeight: 700, fontSize: '13px' }}>Customer</button>
              </div>
            </div>

            <div className="form-group">
              <label>Nama Toko ({targetGroup}) *</label>
              <select className="form-input" value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">-- Pilih Toko --</option>
                {getTargetOptions().map(t => (
                  <option key={t.id} value={t.id}>{t.nama_toko}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Rencana Tipe Aksi *</label>
              <select className="form-input" value={tipeAksi} onChange={e => setTipeAksi(e.target.value as TipeAksi)}>
                <option value="Visit">Kunjungan Langsung (Visit)</option>
                <option value="WA">Follow Up via WhatsApp (WA)</option>
                <option value="Call">Hubungi via Telepon (Call)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tanggal Rencana *</label>
              <input type="date" className="form-input" value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Catatan / Fokus Rencana</label>
              <textarea className="form-input" rows={2} placeholder="Misal: Tagih bon bulan lalu..." value={catatan} onChange={e => setCatatan(e.target.value)} />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAddModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleAddPlan} disabled={!targetId || !tanggal || !tipeAksi}>Simpan Rencana</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
