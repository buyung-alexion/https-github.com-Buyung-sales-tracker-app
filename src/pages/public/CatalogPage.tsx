import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ChevronLeft, Send, Search, Loader2, CheckCircle, Info, MessageCircle, AlertCircle } from 'lucide-react';
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
    console.log('DEBUG: Referral Parameter from URL:', ref);
    if (ref) {
      const { data, error } = await store.fetchSalesPublicInfo(ref);
      if (error) {
        console.error('DEBUG: Fetch Sales Info Error:', error);
      }
      console.log('DEBUG: Sales Data Found:', data);
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

    console.log('DEBUG: Submitting Order with Sales ID:', referrerSales?.id || 'NULL');
    
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
      if (error) {
        console.error('DEBUG: Submit Error Details:', error);
        throw error;
      }
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
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className="bg-white px-5 py-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center shadow-lg shadow-yellow-200">
                <ShoppingBag size={20} className="text-black" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">IKT Marketplace</h1>
                {referrerSales && (
                   <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner: {referrerSales.nama}</p>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari daging, ayam, atau produk lainnya..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-yellow transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-sm font-bold">Memuat Katalog Produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-10">
             <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-slate-300" />
             </div>
             <h3 className="text-lg font-black text-slate-800 mb-2">Produk Tidak Ditemukan</h3>
             <p className="text-slate-500 text-sm font-medium">Coba gunakan kata kunci lain atau hubungi admin kami.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-100 group transition-all active:scale-95">
                <div className="aspect-square relative overflow-hidden">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-black text-slate-800">4.9 (120+)</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black text-brand-yellow bg-yellow-50 px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">{product.category}</span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{product.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 block mb-1">Mulai Dari</span>
                      <span className="text-xl font-black text-slate-900 tracking-tighter">Rp {product.base_price.toLocaleString('id-ID')}<span className="text-sm text-slate-400 font-bold">/kg</span></span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">{product.description}</p>
                  
                  <button 
                    onClick={() => { setSelectedProduct(product); setShowForm(true); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black tracking-wide flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg shadow-slate-200"
                  >
                    AJUKAN PENAWARAN <Send size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Negotiation Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowForm(false)}></div>
          
          <div className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom duration-300">
            {success ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 scale-in">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Penawaran Dikirim!</h3>
                <p className="text-slate-500 font-medium px-10">Admin atau Sales kami akan segera menghubungi Anda melalui WhatsApp.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                      <ChevronLeft size={20} className="text-slate-900" />
                    </button>
                    <h3 className="text-xl font-black text-slate-900">Form Pesanan</h3>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-5 mb-8 flex items-center gap-4 border border-slate-100">
                  <img src={selectedProduct?.image_url} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedProduct?.category}</p>
                    <p className="font-black text-slate-900">{selectedProduct?.name}</p>
                    <p className="text-sm font-black text-brand-yellow">Rp {selectedProduct?.base_price.toLocaleString('id-ID')}/kg</p>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                    <AlertCircle size={20} />
                    <p className="text-xs font-bold">{errorMsg}</p>
                  </div>
                )}

                <form onSubmit={handleSubmitNegotiation} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Masukkan nama Anda"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-brand-yellow focus:ring-0 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">No. WhatsApp</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="Contoh: 08123456789"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-brand-yellow focus:ring-0 transition-all"
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Jumlah (Kg)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Qty"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-brand-yellow focus:ring-0 transition-all"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Harga Ajuan</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Rp"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-brand-yellow focus:ring-0 transition-all"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-5 bg-brand-yellow text-black rounded-2xl text-sm font-black tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-yellow-200/50 hover:bg-yellow-400 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><MessageCircle size={20} /> KIRIM PENAWARAN</>}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-bold mt-4 uppercase tracking-widest flex items-center justify-center gap-1">
                      <Info size={10} /> Data aman & terenkripsi oleh sistem IKT
                    </p>
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
