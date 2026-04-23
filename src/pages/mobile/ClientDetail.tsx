import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSalesData, useCurrentSales } from '../../hooks/useSalesData';
import { store } from '../../store/dataStore';
import { ArrowLeft, MapPin, Star, Calendar, MessageCircle, PhoneCall, ShoppingCart, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function ClientDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { currentSalesId } = useCurrentSales();
  const { prospek, customers, activities, sales = [], masterStatuses = [] } = useSalesData();
  const currentSales = sales.find(s => s.id === currentSalesId);

  const getStatusName = (idOrName: string) => {
    if (!idOrName) return 'Cold';
    const found = masterStatuses.find(s => s.id === idOrName || s.name === idOrName);
    return found ? found.name : idOrName;
  };
  const salesName = currentSales?.nama;
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('history');

  // Find target data based on type
  let targetData: any = null;
  if (type === 'prospek') {
    targetData = prospek.find(p => p.id === id);
  } else if (type === 'customer') {
    targetData = customers.find(c => c.id === id);
  }

  if (!targetData) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <p>Data tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="btn-primary" style={{ marginTop: '16px' }}>Kembali</button>
      </div>
    );
  }

  const targetActivities = activities
    .filter(a => a.target_id === id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const rating = targetData.rating || 0;
  const kategori = targetData.kategori || (type === 'customer' ? 'Customer' : 'Prospek Umum');

  const getAksiIcon = (aksi: string) => {
    switch (aksi) {
      case 'WA': return <MessageCircle size={16} color="#059669" />;
      case 'Call': return <PhoneCall size={16} color="#0284C7" />;
      case 'Order': return <ShoppingCart size={16} color="#F59E0B" />;
      case 'Note': return <FileText size={16} color="#6366F1" />;
      default: return <MapPin size={16} color="#7E22CE" />;
    }
  };

  const handleOrder = async () => {
    if (type !== 'customer') return;
    
    const amountStr = prompt('Masukkan nominal order (hanya angka, misal: 1500000):');
    if (!amountStr) return;
    
    const amount = parseFloat(amountStr.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      alert('Nominal tidak valid.');
      return;
    }

    await store.logOrder(currentSalesId, targetData.id, targetData.nama_toko, amount, salesName);
    
    // Redirect to Accurate Mobile for processing
    window.location.href = 'intent:#Intent;package=com.cpssoft.mobile.alpha;end';
  };

  const handleNote = async () => {
    const note = prompt('Masukkan catatan untuk customer ini:');
    if (!note) return;
    
    if (!currentSalesId) {
      alert('Sesi habis. Silakan login kembali.');
      return;
    }

    await store.logNote(currentSalesId, targetData.id, type as 'prospek' | 'customer', targetData.nama_toko, note, salesName);
    alert('Catatan berhasil ditambahkan!');
  };

  return (
    <div className="page-content" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* Jack Marrow Style Header Fragment */}
      <div style={{ background: 'var(--brand-yellow)', minHeight: '260px', padding: '20px', position: 'relative', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={22} color="#111827" />
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {/* Share or Options Icon could go here */}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#fff', border: '4px solid #fff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 10 }}>
            <img src={`https://ui-avatars.com/api/?name=${targetData.nama_toko}&background=random`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          
          <h2 className="hero-premium-title" style={{ fontSize: '24px', margin: '12px 0 4px 0' }}>
            {targetData.nama_toko}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#453a1a', marginBottom: '8px' }}>
            <MapPin size={14} /> {targetData.area}
          </div>

          {/* Rating Stars & Category Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={18} fill={s <= rating ? '#111827' : 'transparent'} color={s <= rating ? '#111827' : 'rgba(17,24,39,0.3)'} />
              ))}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, background: '#111827', color: 'var(--brand-yellow)', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {kategori}
            </span>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {type === 'customer' && (
                <button 
                  onClick={handleOrder}
                  style={{ background: '#111827', color: 'var(--brand-yellow)', border: 'none', borderRadius: '12px', padding: '8px 16px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                  <ShoppingCart size={14} /> ORDER
                </button>
              )}
              <button 
                onClick={handleNote}
                style={{ background: '#fff', color: '#111827', border: '1px solid #111827', borderRadius: '12px', padding: '8px 16px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <FileText size={14} /> CATATAN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '20px' }}>
        <button 
          onClick={() => setActiveTab('details')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'details' ? '3px solid #111827' : '3px solid transparent', paddingBottom: '8px', fontSize: '14px', fontWeight: 800, color: activeTab === 'details' ? '#111827' : '#94a3b8', cursor: 'pointer' }}
        >
          DETAILS 
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '3px solid #111827' : '3px solid transparent', paddingBottom: '8px', fontSize: '14px', fontWeight: 800, color: activeTab === 'history' ? '#111827' : '#94a3b8', cursor: 'pointer' }}
        >
          HISTORY ({targetActivities.length})
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '24px 20px' }}>
        
        {activeTab === 'details' ? (
          <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Informasi {type === 'prospek' ? 'Prospek' : 'Pelanggan'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '2px' }}>Nama PIC</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{targetData.nama_pic || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '2px' }}>Nomor WhatsApp</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>+{targetData.no_wa}</div>
              </div>
              {type === 'prospek' && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '2px' }}>Status Saluran</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Prospek {getStatusName(targetData.status)}</div>
                </div>
              )}

              {targetData.link_map && (
                <button onClick={() => window.open(targetData.link_map, '_blank')} className="btn-secondary" style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <MapPin size={16} /> Buka di Google Maps
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {targetActivities.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>
                <Calendar size={48} color="#e2e8f0" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#64748b' }}>Belum ada histori aktivitas</div>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>Lakukan kunjungan atau Follow Up lewat Prospecting Tool / Customer Maintenance.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {targetActivities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: '16px', background: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getAksiIcon(act.tipe_aksi)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                        {act.tipe_aksi === 'WA' ? 'Follow Up via WhatsApp' : act.tipe_aksi === 'Visit' ? 'Kunjungan Langsung (Visit)' : act.tipe_aksi === 'Call' ? 'Panggilan Telepon (Call)' : 'Catatan Internal'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
                        "{act.catatan_hasil}"
                      </div>
                      {act.geotagging?.photo && (
                        <div style={{ marginBottom: '12px' }}>
                          <img src={act.geotagging.photo} alt="Bukti Interaksi" style={{ width: '100%', maxWidth: '200px', borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                        </div>
                      )}
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true, locale: localeId })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
