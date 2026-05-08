import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ChevronLeft, Send, Search, Loader2, CheckCircle, Info, MessageCircle, AlertCircle, X } from 'lucide-react';
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
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '40px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Premium */}
      <div style={{ background: '#fff', padding: '24px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
             <div style={{ width: '44px', height: '44px', background: 'var(--brand-yellow)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(255, 204, 0, 0.3)' }}>
                <ShoppingBag size={22} color="#000" strokeWidth={2.5} />
             </div>
             <div>
                <h1 style={{ fontSize: '20px', fontWeight: 950, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>IKT Marketplace</h1>
                {referrerSales && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner: {referrerSales.nama}</span>
                   </div>
                )}
             </div>
          </div>

          <div style={{ position: 'relative' }}>
             <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
             <input 
               type="text" 
               placeholder="Cari produk IKT..." 
               style={{ width: '100%', padding: '16px 16px 16px 48px', background: '#F1F5F9', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
             <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
             <p style={{ fontSize: '14px', fontWeight: 800 }}>Memuat Katalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
             <Search size={48} color="#cbd5e1" style={{ margin: '0 auto 20px', opacity: 0.5 }} />
             <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#1e293b' }}>Produk Tidak Ditemukan</h3>
             <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Coba gunakan kata kunci pencarian lain.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             {filteredProducts.map(product => (
               <div key={product.id} className="shadow-premium" style={{ background: '#fff', borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.02)' }}>
                  <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                     <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} fill="#F59E0B" color="#F59E0B" />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>4.9</span>
                     </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                           <span style={{ fontSize: '9px', fontWeight: 900, color: '#F59E0B', background: '#FFFBEB', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.category}</span>
                           <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#111827', margin: '6px 0 0' }}>{product.name}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>Mulai Dari</div>
                           <div style={{ fontSize: '18px', fontWeight: 950, color: '#111827' }}>Rp {product.base_price?.toLocaleString('id-ID')}<span style={{ fontSize: '12px', color: '#94a3b8' }}>/kg</span></div>
                        </div>
                     </div>
                     <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, lineHeight: '1.6', marginBottom: '20px' }}>{product.description}</p>
                     
                     <button 
                       className="tap-active"
                       onClick={() => { setSelectedProduct(product); setShowForm(true); }}
                       style={{ width: '100%', padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                     >
                       AJUKAN PENAWARAN <Send size={16} />
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Negotiation Form Drawer */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowForm(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ 
            borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
            padding: '24px 20px calc(40px + env(safe-area-inset-bottom))', background: '#fff', border: 'none',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                 <div style={{ width: '72px', height: '72px', background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle size={40} color="#10B981" />
                 </div>
                 <h2 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: '0 0 8px' }}>Penawaran Terkirim!</h2>
                 <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Sales Partner kami akan segera menghubungi Anda melalui WhatsApp.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#F1F5F9', padding: '8px', borderRadius: '12px' }} onClick={() => setShowForm(false)}>
                      <ChevronLeft size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#111827' }}>Buat Pesanan</h3>
                  </div>
                  <X size={24} color="#94a3b8" onClick={() => setShowForm(false)} />
                </div>

                <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '16px', display: 'flex', gap: '12px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
                   <img src={selectedProduct?.image_url} alt="" style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} />
                   <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{selectedProduct?.category}</div>
                      <div style={{ fontSize: '15px', fontWeight: 950, color: '#111827' }}>{selectedProduct?.name}</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--brand-yellow)' }}>Rp {selectedProduct?.base_price?.toLocaleString('id-ID')}/kg</div>
                   </div>
                </div>

                {errorMsg && (
                  <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '12px', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '12px', fontWeight: 700, marginBottom: '20px', display: 'flex', gap: '8px' }}>
                    <AlertCircle size={16} /> {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmitNegotiation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>NAMA LENGKAP</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Siapa nama Anda?"
                        style={{ width: '100%', padding: '14px 16px', background: '#F8FAFC', border: '2px solid #F1F5F9', borderRadius: '14px', fontSize: '14px', fontWeight: 750 }}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>NOMOR WHATSAPP</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="Contoh: 0812345678"
                        style={{ width: '100%', padding: '14px 16px', background: '#F8FAFC', border: '2px solid #F1F5F9', borderRadius: '14px', fontSize: '14px', fontWeight: 750 }}
                        value={formData.whatsapp}
                        onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      />
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>JUMLAH (KG)</label>
                        <input 
                          type="number" 
                          required
                          placeholder="Berapa Kg?"
                          style={{ width: '100%', padding: '14px 16px', background: '#F8FAFC', border: '2px solid #F1F5F9', borderRadius: '14px', fontSize: '14px', fontWeight: 750 }}
                          value={formData.quantity}
                          onChange={e => setFormData({...formData, quantity: e.target.value})}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>HARGA AJUAN</label>
                        <input 
                          type="number" 
                          required
                          placeholder="Rp /kg"
                          style={{ width: '100%', padding: '14px 16px', background: '#F8FAFC', border: '2px solid #F1F5F9', borderRadius: '14px', fontSize: '14px', fontWeight: 750 }}
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                   </div>

                   <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="tap-active"
                     style={{ width: '100%', padding: '18px', background: 'var(--brand-yellow)', color: '#111827', border: 'none', borderRadius: '18px', fontSize: '16px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 12px 24px rgba(255, 204, 0, 0.3)', marginTop: '12px' }}
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><MessageCircle size={20} /> KIRIM PENAWARAN</>}
                   </button>
                   
                   <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>
                      <Info size={12} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }} /> Data aman & terhubung ke sistem IKT
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
