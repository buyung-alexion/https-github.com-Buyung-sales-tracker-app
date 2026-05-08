import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ChevronLeft, Send, Search, Loader2, CheckCircle, Info, MessageCircle, AlertCircle, X, ShoppingCart } from 'lucide-react';
import { store } from '../../store/dataStore';

export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [referrerSales, setReferrerSales] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    quantity: '',
    price: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadProducts();
    checkReferrer();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await store.fetchProducts();
    setProducts(data || []);
    setLoading(false);
  };

  const checkReferrer = async () => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const { data } = await store.fetchSalesPublicInfo(ref);
      if (data) {
        setReferrerSales(data);
      }
    }
  };

  const handleSubmitNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      product_id: selectedProduct.id,
      sales_id: referrerSales?.id ? String(referrerSales.id) : undefined,
      customer_name: formData.name,
      customer_wa: formData.whatsapp,
      requested_qty: parseFloat(formData.quantity),
      offered_price: parseFloat(formData.price),
      status: 'pending' as any
    };

    try {
      const { error } = await store.submitNegotiation(payload as any);
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
        setSelectedProduct(null);
        setFormData({ name: '', whatsapp: '', quantity: '', price: '' });
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', paddingBottom: '60px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Shopee Header Style */}
      <div style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)', padding: '20px 16px 30px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={24} color="#FF5722" strokeWidth={2.5} />
             </div>
             <div>
                <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>IKT Official Store</h1>
                {referrerSales && (
                   <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 700 }}>Sales Partner: {referrerSales.nama}</p>
                )}
             </div>
          </div>

          <div style={{ position: 'relative' }}>
             <Search size={16} color="#999" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
             <input 
               type="text" 
               placeholder="Cari produk di toko ini..." 
               style={{ width: '100%', padding: '12px 16px 12px 42px', background: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '12px' }}>
        
        {/* Promo Banner Style */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
           <div style={{ background: '#FFF3E0', padding: '10px', borderRadius: '8px' }}><Star color="#FF9800" fill="#FF9800" size={20} /></div>
           <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#333' }}>Katalog Produk IKT</div>
              <div style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>Dapatkan harga terbaik dengan ajuan penawaran</div>
           </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
             <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
             <p style={{ fontSize: '12px', fontWeight: 700 }}>Memuat Produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
             <Search size={48} color="#ddd" style={{ margin: '0 auto 20px' }} />
             <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#666' }}>Produk Tidak Ditemukan</h3>
          </div>
        ) : (
          /* SHOPEE GRID 2 COLUMNS */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
             {filteredProducts.map(product => (
               <div key={product.id} className="tap-active" style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }} onClick={() => { setSelectedProduct(product); setShowForm(true); }}>
                  <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
                     <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     {/* Label Category Style */}
                     <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(255, 87, 34, 0.9)', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '4px 8px', borderRadius: '0 0 8px 0' }}>{product.category}</div>
                  </div>
                  <div style={{ padding: '10px' }}>
                     <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#333', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '34px' }}>{product.name}</h3>
                     <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#FF5722', fontWeight: 800 }}>Rp</span>
                        <span style={{ fontSize: '15px', color: '#FF5722', fontWeight: 900 }}>{product.base_price?.toLocaleString('id-ID')}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                           <Star size={10} fill="#FFC107" color="#FFC107" />
                           <span style={{ fontSize: '10px', color: '#666', fontWeight: 600 }}>4.9 | 100+ terjual</span>
                        </div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Shopee Style Bottom Drawer */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowForm(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ 
            borderTopLeftRadius: '16px', borderTopRightRadius: '16px', 
            padding: '20px 16px calc(40px + env(safe-area-inset-bottom))', background: '#fff', border: 'none',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                 <div style={{ width: '60px', height: '60px', background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle size={32} color="#4CAF50" />
                 </div>
                 <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#333', margin: '0 0 8px' }}>Pesan Terkirim!</h2>
                 <p style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>Sales Partner kami akan segera menghubungi Anda melalui WhatsApp.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #f5f5f5', paddingBottom: '16px' }}>
                   <div style={{ width: '100px', height: '100px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #eee' }}>
                      <img src={selectedProduct?.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   </div>
                   <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#FF5722' }}>Rp {selectedProduct?.base_price?.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>Stok: Banyak</div>
                      <X size={20} color="#999" style={{ position: 'absolute', top: '20px', right: '16px' }} onClick={() => setShowForm(false)} />
                   </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                   <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#333', marginBottom: '12px' }}>{selectedProduct?.name}</h3>
                   <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>{selectedProduct?.description}</p>
                </div>

                {errorMsg && (
                  <div style={{ background: '#FFEBEE', padding: '10px', borderRadius: '4px', color: '#D32F2F', fontSize: '11px', fontWeight: 700, marginBottom: '20px' }}>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmitNegotiation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#444', display: 'block', marginBottom: '8px' }}>Nama Lengkap</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Masukkan nama Anda"
                        style={{ width: '100%', padding: '12px', background: '#F5F5F5', border: '1px solid #eee', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#444', display: 'block', marginBottom: '8px' }}>Nomor WhatsApp</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="Contoh: 0812345678"
                        style={{ width: '100%', padding: '12px', background: '#F5F5F5', border: '1px solid #eee', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}
                        value={formData.whatsapp}
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      />
                   </div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '16px', marginTop: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#333' }}>Jumlah Order</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <input 
                            type="number" 
                            required
                            placeholder="Qty"
                            style={{ width: '70px', padding: '8px', background: '#F5F5F5', border: '1px solid #eee', borderRadius: '4px', fontSize: '13px', fontWeight: 800, textAlign: 'center' }}
                            value={formData.quantity}
                            onChange={e => setFormData({...formData, quantity: e.target.value})}
                         />
                         <span style={{ fontSize: '13px', fontWeight: 700, color: '#666' }}>Kg</span>
                      </div>
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#333' }}>Ajukan Harga</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ fontSize: '13px', fontWeight: 700, color: '#666' }}>Rp</span>
                         <input 
                            type="number" 
                            required
                            placeholder="Harga /kg"
                            style={{ width: '120px', padding: '8px', background: '#F5F5F5', border: '1px solid #eee', borderRadius: '4px', fontSize: '13px', fontWeight: 800, textAlign: 'right' }}
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: e.target.value})}
                         />
                      </div>
                   </div>

                   <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        type="button"
                        onClick={() => setShowForm(false)}
                        style={{ flex: 1, padding: '16px', background: '#E8F5E9', color: '#2E7D32', border: '1px solid #2E7D32', borderRadius: '4px', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <MessageCircle size={18} /> Chat
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        style={{ flex: 2, padding: '16px', background: '#FF5722', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)' }}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><ShoppingCart size={18} /> BELI SEKARANG</>}
                      </button>
                   </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
