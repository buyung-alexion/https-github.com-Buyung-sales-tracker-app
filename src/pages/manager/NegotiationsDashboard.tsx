import { useState, useEffect } from 'react';
import { MessageCircle, Check, X, RefreshCw, Phone, Clock, TrendingDown, Loader2, ShoppingCart, Plus, Edit2 } from 'lucide-react';
import { store } from '../../store/dataStore';
import { formatCurrency, generateWALink } from '../../utils/wa_utils';
import { useSalesData } from '../../hooks/useSalesData';

export default function NegotiationsDashboard() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  
  // Product Management State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: 0,
    floor_price: 0,
    image_url: '',
    min_bulk_qty: 1,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { masterCategories } = useSalesData();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { title: 'Marketplace', sub: 'Manajemen Penawaran Harga Pelanggan' } 
    }));
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const { data } = await store.fetchNegotiations();
    setNegotiations(data || []);
    setLoading(false);
  };

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

  const openProductModal = (existingData?: any) => {
    if (existingData) {
      setProductForm({ 
        name: existingData.name, 
        category: existingData.category, 
        price: existingData.price, 
        floor_price: existingData.floor_price, 
        image_url: existingData.image_url, 
        min_bulk_qty: existingData.min_bulk_qty,
        is_active: existingData.is_active 
      });
      setEditingProduct(existingData);
    } else {
      setProductForm({ name: '', category: '', price: 0, floor_price: 0, image_url: '', min_bulk_qty: 1, is_active: true });
      setEditingProduct(null);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await store.updateProduct(editingProduct.id, productForm);
      } else {
        await store.addProduct(productForm as any);
      }
      setProductModalOpen(false);
      loadAllData();
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Hapus produk ini dari katalog?')) {
      await store.deleteProduct(id);
      loadAllData();
    }
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
      </div>      {/* Tabs & Controls */}
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => openProductModal()} 
            style={{ background: '#FFCC00', color: '#111827', border: 'none', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 204, 0, 0.2)' }}
          >
            <Plus size={16} strokeWidth={3} /> Tambah Produk
          </button>
          <button 
            onClick={loadAllData} 
            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
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
                <div style={{ position: 'relative' }}>
                  <img 
                    src={nego.products?.image_url} 
                    alt="" 
                    style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', background: '#f1f5f9' }} 
                  />
                  <button 
                    onClick={() => openProductModal(nego.products)}
                    style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    <Edit2 size={12} color="#3b82f6" />
                  </button>
                </div>
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
                {nego.offered_price < (nego.products?.floor_price || 0) && (
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

      {/* PRODUCT MODAL (Shopee Style) */}
      {productModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <div style={{ 
            background: '#f5f5f5', borderRadius: '16px', width: '100%', maxWidth: '700px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ background: '#fff', padding: '20px 24px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '18px', color: '#212121' }}>
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#757575" /></button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Section: Informasi Produk */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#ee4d2d', borderLeft: '4px solid #ee4d2d', paddingLeft: '12px' }}>Informasi Produk</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                      <label style={{ width: '140px', fontSize: '14px', color: '#757575', marginTop: '10px' }}>Nama Produk</label>
                      <div style={{ flex: 1 }}>
                        <input 
                          required 
                          placeholder="Masukkan nama produk..."
                          style={{ width: '100%', padding: '12px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '14px' }} 
                          value={productForm.name} 
                          onChange={e => setProductForm({...productForm, name: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                      <label style={{ width: '140px', fontSize: '14px', color: '#757575', marginTop: '10px' }}>Kategori</label>
                      <div style={{ flex: 1 }}>
                        <select 
                          required 
                          style={{ width: '100%', padding: '12px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '14px', background: '#fff' }} 
                          value={productForm.category} 
                          onChange={e => setProductForm({...productForm, category: e.target.value})}
                        >
                          <option value="">Pilih Kategori</option>
                          {masterCategories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>*Kategori dikelola di Data Management</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                      <label style={{ width: '140px', fontSize: '14px', color: '#757575', marginTop: '10px' }}>Deskripsi</label>
                      <div style={{ flex: 1 }}>
                        <textarea 
                          placeholder="Jelaskan detail produk Anda..."
                          rows={4}
                          style={{ width: '100%', padding: '12px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '14px', resize: 'none' }} 
                          value={(productForm as any).description || ''} 
                          onChange={e => setProductForm({...productForm, description: e.target.value} as any)} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Informasi Penjualan */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#ee4d2d', borderLeft: '4px solid #ee4d2d', paddingLeft: '12px' }}>Informasi Penjualan</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                      <label style={{ width: '140px', fontSize: '14px', color: '#757575', marginTop: '10px' }}>Harga Katalog</label>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 600, color: '#212121' }}>Rp</span>
                        <input 
                          type="number" 
                          required 
                          style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '14px' }} 
                          value={productForm.price} 
                          onChange={e => setProductForm({...productForm, price: parseInt(e.target.value) || 0})} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                      <label style={{ width: '140px', fontSize: '14px', color: '#757575', marginTop: '10px' }}>Harga Dasar</label>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 600, color: '#212121' }}>Rp</span>
                        <input 
                          type="number" 
                          required 
                          style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '14px' }} 
                          value={productForm.floor_price} 
                          onChange={e => setProductForm({...productForm, floor_price: parseInt(e.target.value) || 0})} 
                        />
                        <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>*Harga minimal yang bisa diterima saat Nego</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                      <label style={{ width: '140px', fontSize: '14px', color: '#757575', marginTop: '10px' }}>Min Qty Nego</label>
                      <div style={{ flex: 1 }}>
                        <input 
                          type="number" 
                          style={{ width: '100%', padding: '12px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '14px' }} 
                          value={productForm.min_bulk_qty} 
                          onChange={e => setProductForm({...productForm, min_bulk_qty: parseInt(e.target.value) || 1})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Media */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#ee4d2d', borderLeft: '4px solid #ee4d2d', paddingLeft: '12px' }}>Media</h4>
                  
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    <label style={{ width: '140px', fontSize: '14px', color: '#757575', marginTop: '10px' }}>URL Foto Produk</label>
                    <div style={{ flex: 1 }}>
                      <input 
                        required 
                        placeholder="https://..."
                        style={{ width: '100%', padding: '12px', border: '1px solid #e8e8e8', borderRadius: '4px', fontSize: '14px' }} 
                        value={productForm.image_url} 
                        onChange={e => setProductForm({...productForm, image_url: e.target.value})} 
                      />
                      {productForm.image_url && (
                        <div style={{ marginTop: '12px' }}>
                          <img src={productForm.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f1f1f1' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setProductModalOpen(false)} 
                    style={{ padding: '12px 32px', borderRadius: '4px', border: '1px solid #e8e8e8', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    style={{ 
                      padding: '12px 48px', borderRadius: '4px', border: 'none', 
                      background: '#ee4d2d', color: '#fff', fontSize: '14px', 
                      fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(238, 77, 45, 0.2)' 
                    }}
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>

                {editingProduct && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteProduct(editingProduct.id)}
                    style={{ width: 'fit-content', alignSelf: 'center', marginTop: '0', padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: 700 }}
                  >
                    Hapus Produk
                  </button>
                )}

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
