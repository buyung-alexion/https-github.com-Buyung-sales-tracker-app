import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, X, Send, CheckCircle } from 'lucide-react';
import { Product, LeadNegotiation } from '../../types';
import { store } from '../../store/dataStore';
import ProductCard from '../../components/public/ProductCard';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Negotiation Modal State
  const [negoModalOpen, setNegoModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [negoQty, setNegoQty] = useState(0);
  const [negoForm, setNegoForm] = useState({
    customer_name: '',
    customer_wa: '',
    offered_price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await store.fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenNego = (product: Product, qty: number) => {
    setSelectedProduct(product);
    setNegoQty(qty);
    setNegoForm({
      customer_name: '',
      customer_wa: '',
      offered_price: product.price // Default to current price
    });
    setNegoModalOpen(true);
  };

  const handleSubmitNego = async () => {
    if (!selectedProduct || !negoForm.customer_name || !negoForm.customer_wa || negoForm.offered_price <= 0) {
      alert('Mohon lengkapi semua data.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await store.submitNegotiation({
      product_id: selectedProduct.id,
      customer_name: negoForm.customer_name,
      customer_wa: negoForm.customer_wa,
      requested_qty: negoQty,
      offered_price: negoForm.offered_price
    });

    if (error) {
      alert('Gagal mengirim penawaran: ' + error.message);
    } else {
      setSubmitSuccess(true);
      setTimeout(() => {
        setNegoModalOpen(false);
        setSubmitSuccess(false);
        setSelectedProduct(null);
      }, 2000);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
      {/* Premium Header */}
      <div style={{ 
        background: 'var(--brand-yellow)', 
        padding: '40px 20px 60px', 
        borderBottomLeftRadius: '40px', 
        borderBottomRightRadius: '40px',
        boxShadow: '0 10px 30px rgba(255, 204, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: '0 0 8px 0' }}>Marketplace</h1>
        <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)', fontWeight: 700, maxWidth: '300px', margin: '0 auto' }}>
          Dapatkan harga terbaik untuk pembelian grosir dan eceran.
        </p>
      </div>

      {/* Search & Filter Container */}
      <div style={{ marginTop: '-30px', padding: '0 20px' }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '20px', 
          padding: '8px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          gap: '12px'
        }}>
          <Search size={20} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari produk..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              border: 'none', 
              flex: 1, 
              padding: '12px 0', 
              fontSize: '15px', 
              fontWeight: 700, 
              outline: 'none',
              color: '#111827'
            }}
          />
          <Filter size={20} color="#94a3b8" />
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        overflowX: 'auto', 
        padding: '24px 20px',
        scrollbarWidth: 'none'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '12px', 
              background: activeCategory === cat ? '#111827' : '#fff', 
              color: activeCategory === cat ? '#FFCC00' : '#64748b',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader2 className="animate-spin" size={32} color="var(--brand-yellow)" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
            gap: '16px' 
          }}>
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onNegotiate={handleOpenNego}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
            <p style={{ fontWeight: 700 }}>Produk tidak ditemukan.</p>
          </div>
        )}
      </div>

      {/* Negotiation Modal */}
      {negoModalOpen && selectedProduct && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', zIndex: 1000
        }} onClick={() => !isSubmitting && setNegoModalOpen(false)}>
          <div 
            style={{ 
              width: '100%', 
              background: '#fff', 
              borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
              padding: '24px 20px calc(30px + env(safe-area-inset-bottom))',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '10px', margin: '-8px auto 20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: 0 }}>Ajukan Penawaran</h2>
              <button onClick={() => setNegoModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px' }}>
                <X size={20} color="#111827" />
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: '#ECFDF5', color: '#10B981', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <CheckCircle size={48} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Penawaran Terkirim!</h3>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Tim kami akan segera menghubungi Anda melalui WhatsApp.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img 
                    src={selectedProduct.image_url} 
                    alt="" 
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{selectedProduct.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Qty: {negoQty} unit</div>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block' }}>Nama Lengkap / Toko</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Toko Berkah"
                    value={negoForm.customer_name}
                    onChange={e => setNegoForm({...negoForm, customer_name: e.target.value})}
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #f1f5f9', fontSize: '15px', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block' }}>Nomor WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="0812..."
                    value={negoForm.customer_wa}
                    onChange={e => setNegoForm({...negoForm, customer_wa: e.target.value})}
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #f1f5f9', fontSize: '15px', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block' }}>Harga Tawaran (per unit)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#111827' }}>Rp</span>
                    <input 
                      type="number" 
                      value={negoForm.offered_price}
                      onChange={e => setNegoForm({...negoForm, offered_price: parseInt(e.target.value) || 0})}
                      style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '14px', border: '2px solid #f1f5f9', fontSize: '15px', fontWeight: 700 }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontWeight: 600 }}>
                    Harga katalog: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedProduct.price)}
                  </p>
                </div>

                <button 
                  onClick={handleSubmitNego}
                  disabled={isSubmitting}
                  style={{ 
                    width: '100%', padding: '18px', borderRadius: '18px', 
                    background: '#111827', color: '#FFCC00', 
                    border: 'none', fontWeight: 900, fontSize: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    marginTop: '10px'
                  }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Kirim Penawaran</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
