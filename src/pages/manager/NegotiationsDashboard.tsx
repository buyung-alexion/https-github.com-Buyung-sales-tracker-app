import { useState, useEffect } from 'react';
import { MessageCircle, Check, X, RefreshCw, Phone, Clock, TrendingDown, Loader2, ShoppingCart } from 'lucide-react';
import { store } from '../../store/dataStore';
import { formatCurrency, generateWALink } from '../../utils/wa_utils';

export default function NegotiationsDashboard() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { title: 'Marketplace', sub: 'Manajemen Penawaran Harga Pelanggan' } 
    }));
    loadNegotiations();
  }, []);

  const loadNegotiations = async () => {
    setLoading(true);
    const { data } = await store.fetchNegotiations();
    setNegotiations(data);
    setLoading(false);
  };

  const handleGoToCatalog = () => {
    // Dispatch event to switch tab in ManagerShell if possible, 
    // or tell user to go to Data Management
    window.dispatchEvent(new CustomEvent('switchMgrTab', { detail: { tab: 'data' } }));
    // We also need to tell DataManagement to open the 'products' tab specifically
    localStorage.setItem('mgr_data_active_tab', 'products');
  };

  const handleStatusUpdate = async (id: string, status: any) => {
    if (!window.confirm(`Yakin ingin mengubah status menjadi ${status}?`)) return;
    const { error } = await store.updateNegotiationStatus(id, status);
    if (error) alert('Gagal update status: ' + error.message);
    else loadNegotiations();
  };

  const handleCounter = (nego: any) => {
    const msg = `Halo ${nego.customer_name}, terkait penawaran Anda untuk ${nego.products.name} sebanyak ${nego.requested_qty} unit dengan harga Rp${nego.offered_price.toLocaleString()}, kami ingin mengajukan penawaran balik...`;
    window.open(generateWALink(nego.customer_wa, msg), '_blank');
  };

  const filtered = negotiations.filter(n => filter === 'all' || n.status === filter);

  return (
    <div style={{ padding: '24px' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>{negotiations.filter(n => n.status === 'pending').length}</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Menunggu Persetujuan</div>
        </div>

        <div 
          onClick={handleGoToCatalog}
          style={{ background: '#111827', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
          className="tap-active"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255, 204, 0, 0.1)', color: '#FFCC00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={20} />
            </div>
            <div style={{ background: '#FFCC00', color: '#111827', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>MANAGE</div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Kelola Katalog Produk</div>
          <div style={{ fontSize: '11px', color: '#FFCC00', marginTop: '4px', fontWeight: 800 }}>Atur Harga & Stok →</div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '12px' }}>
          {['pending', 'approved', 'rejected', 'countered', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{ 
                padding: '8px 16px', borderRadius: '10px', border: 'none', 
                background: filter === t ? '#fff' : 'transparent',
                color: filter === t ? '#111827' : '#64748b',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                boxShadow: filter === t ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <button 
          onClick={loadNegotiations} 
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Negotiation List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
        ) : filtered.length > 0 ? (
          filtered.map(nego => (
            <div key={nego.id} style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)', display: 'flex', gap: '24px', alignItems: 'center' }}>
              {/* Product Info */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                <img 
                  src={nego.products?.image_url} 
                  alt="" 
                  style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', background: '#f1f5f9' }} 
                />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '2px' }}>{nego.products?.category}</div>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', margin: 0 }}>{nego.products?.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Qty: <span style={{ color: '#111827', fontWeight: 800 }}>{nego.requested_qty} kg</span></div>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Harga Katalog: <span style={{ color: '#111827', fontWeight: 800 }}>{formatCurrency(nego.products?.price)}</span></div>
                  </div>
                </div>
              </div>

              {/* Offer Info */}
              <div style={{ width: '200px', padding: '12px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Tawaran Pelanggan</div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: '#ef4444' }}>{formatCurrency(nego.offered_price)}</div>
                {nego.offered_price < nego.products?.floor_price && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#f59e0b', fontSize: '10px', fontWeight: 800 }}>
                    <TrendingDown size={12} /> DI BAWAH FLOOR PRICE
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div style={{ width: '200px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{nego.customer_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                  <Phone size={14} /> {nego.customer_wa}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {nego.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate(nego.id, 'approved')}
                      style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                      title="Approve"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => handleCounter(nego)}
                      style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                      title="Counter via WA"
                    >
                      <MessageCircle size={20} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(nego.id, 'rejected')}
                      style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                      title="Reject"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                  </>
                )}
                {nego.status !== 'pending' && (
                  <div style={{ 
                    padding: '8px 16px', borderRadius: '10px', 
                    background: nego.status === 'approved' ? '#ECFDF5' : nego.status === 'rejected' ? '#FEF2F2' : '#F1F5F9',
                    color: nego.status === 'approved' ? '#10B981' : nego.status === 'rejected' ? '#EF4444' : '#64748B',
                    fontSize: '11px', fontWeight: 900, textTransform: 'uppercase'
                  }}>
                    {nego.status}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', color: '#94a3b8', fontWeight: 700 }}>
            Belum ada data penawaran.
          </div>
        )}
      </div>
    </div>
  );
}
