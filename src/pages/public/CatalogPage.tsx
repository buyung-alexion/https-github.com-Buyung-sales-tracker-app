import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, X, CheckCircle, ChevronLeft, MoreVertical, MessageCircle, Star, ChevronDown, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { store } from '../../store/dataStore';
import ProductCard from '../../components/public/ProductCard';

export default function CatalogPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Produk');
  const [activeFilter, setActiveFilter] = useState('Populer');
  const [followerCount, setFollowerCount] = useState(0);

  
  // Negotiation Modal State
  const [negoModalOpen, setNegoModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [negoQty, setNegoQty] = useState(1);
  const [negoForm, setNegoForm] = useState({
    customer_name: '',
    customer_wa: '',
    offered_price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [referrerSales, setReferrerSales] = useState<any>(null);

  useEffect(() => {
    loadProducts();
    loadFollowers();
    loadCategories();
    checkReferrer();
  }, []);

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

  const loadCategories = async () => {
    const data = await store.fetchMasterProductCategories();
    setCategories(data);
  };

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await store.fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  const loadFollowers = async () => {
    const count = await store.fetchCustomerCount();
    setFollowerCount(count);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Filter
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    // 2. Category Filter (If in Kategori tab and category selected)
    if (activeTab === 'Kategori' && selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 3. Sorting
    if (activeFilter === 'Terbaru') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (activeFilter === 'Terlaris') {
      // Mock sorting for now as we don't have sales count per product yet
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [products, search, activeTab, selectedCategory, activeFilter]);

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setNegoQty(1);
    setNegoForm({
      customer_name: '',
      customer_wa: '',
      offered_price: product.price
    });
    setNegoModalOpen(true);
  };

  const handleChatToko = () => {
    // Arahkan ke WhatsApp Sales (Referrer) atau Admin/Owner jika tidak ada referrer
    const waNumber = referrerSales?.no_wa || '6281234567890';
    const message = encodeURIComponent(`Halo ${referrerSales?.nama || 'Admin'}, saya ingin bertanya tentang produk di katalog PT. Industri Keluarga Timur.`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  };

  const handleShareCatalog = async () => {
    const shareData = {
      title: 'Katalog PT. Industri Keluarga Timur',
      text: 'Cek katalog produk terbaru kami di PT. Industri Keluarga Timur!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link katalog berhasil disalin ke clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleSubmitNego = async () => {
    if (!selectedProduct || !negoForm.customer_name || !negoForm.customer_wa || negoForm.offered_price <= 0) {
      alert('Mohon lengkapi semua data.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await store.submitNegotiation({
      product_id: selectedProduct.id,
      sales_id: referrerSales?.id || null,
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '40px' }}>
      
      {/* Shopee-style Header Overlay */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100, 
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        padding: '12px 16px', borderBottom: '1px solid #f1f1f1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <ChevronLeft size={24} color="#ee4d2d" />
          </button>
          
          <div style={{ 
            flex: 1, background: '#f5f5f5', borderRadius: '4px', 
            display: 'flex', alignItems: 'center', padding: '0 12px',
            border: '1px solid #e8e8e8'
          }}>
            <Search size={18} color="#757575" />
            <input 
              type="text" 
              placeholder="Cari di PT. IKT" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ 
                border: 'none', background: 'transparent', flex: 1, 
                padding: '8px 10px', fontSize: '14px', outline: 'none',
                color: '#212121'
              }}
            />
          </div>
          
          <button 
            onClick={handleShareCatalog}
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          >
            <MoreVertical size={24} color="#757575" />
          </button>
        </div>
      </div>

      {/* Store Profile Section */}
      <div style={{ 
        background: '#fff', padding: '24px 16px', 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
             <div style={{ 
               width: '64px', height: '64px', borderRadius: '50%', 
               border: '2px solid #fff', overflow: 'hidden', background: '#fff',
               flexShrink: 0, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}>
               <img src="/assets/image/logo_ikt.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
             </div>
             <div style={{ flex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>PT. Industri Keluarga Timur</h2>
                 <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} />
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                 <Star size={10} fill="#ffce3d" color="#ffce3d" />
                 <span style={{ fontSize: '12px', fontWeight: 500 }}>4.9</span>
                 <span style={{ fontSize: '12px', opacity: 0.9, marginLeft: '8px' }}>{followerCount.toLocaleString('id-ID')} Pengikut</span>
               </div>
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
             <button 
               onClick={handleChatToko}
               style={{ 
                 flex: 1,
                 background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid #fff', 
                 borderRadius: '4px', padding: '8px 12px', fontSize: '14px', 
                 fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                 backdropFilter: 'blur(4px)'
               }}
             >
               <MessageCircle size={16} /> Chat Sekarang
             </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ 
        background: '#fff', display: 'flex', 
        borderBottom: '1px solid #f1f1f1' 
      }}>
        {['Toko', 'Produk', 'Kategori'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              flex: 1, padding: '14px 0', border: 'none', 
              background: 'transparent', fontSize: '14px', 
              color: activeTab === tab ? '#ee4d2d' : '#757575',
              fontWeight: activeTab === tab ? 700 : 500,
              position: 'relative'
            }}
          >
            {tab}
            {activeTab === tab && (
              <div style={{ 
                position: 'absolute', bottom: 0, left: '20%', right: '20%', 
                height: '2px', background: '#ee4d2d' 
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Sub-tabs / Filters */}
      <div style={{ 
        background: '#fff', display: 'flex', 
        padding: '12px 16px', gap: '24px',
        borderBottom: '1px solid #f1f1f1'
      }}>
        {['Populer', 'Terbaru', 'Terlaris'].map(f => (
          <button 
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{ 
              background: 'transparent', border: 'none', padding: 0,
              fontSize: '14px', color: activeFilter === f ? '#ee4d2d' : '#757575',
              fontWeight: activeFilter === f ? 600 : 500,
              display: 'flex', alignItems: 'center', gap: '2px'
            }}
          >
            {f} {f === 'Terbaru' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ee4d2d' }} />}
          </button>
        ))}
        <button style={{ 
          background: 'transparent', border: 'none', padding: 0,
          fontSize: '14px', color: '#757575', fontWeight: 500,
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          Harga <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
             <ChevronDown size={10} style={{ transform: 'rotate(180deg)' }} />
             <ChevronDown size={10} />
          </div>
        </button>
      </div>

      {/* Product Grid / Categories List */}
      <div style={{ padding: '8px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader2 className="animate-spin" size={32} color="#ee4d2d" />
          </div>
        ) : activeTab === 'Kategori' && !selectedCategory ? (
          /* Categories Selection View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
            {categories.map(cat => (
              <div 
                key={cat.id}
                className="tap-active"
                onClick={() => setSelectedCategory(cat.name)}
                style={{ 
                  background: '#fff', padding: '20px', borderRadius: '12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontWeight: 700
                }}
              >
                <span>{cat.name}</span>
                <ChevronLeft size={18} style={{ transform: 'rotate(180deg)', opacity: 0.3 }} />
              </div>
            ))}
          </div>
        ) : (
          /* Products Grid View */
          <>
            {selectedCategory && activeTab === 'Kategori' && (
              <div style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  style={{ background: '#eee', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}
                >
                  <ChevronLeft size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Kembali
                </button>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>Kategori: {selectedCategory}</span>
              </div>
            )}
            
            {filteredProducts.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px' 
              }}>
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={handleOpenDetail}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
                <p style={{ fontWeight: 700 }}>Produk tidak ditemukan.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Negotiation/Detail Modal (Shopee Style Bottom Sheet) */}
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
              borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
              padding: '20px 16px calc(30px + env(safe-area-inset-bottom))',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
               <img 
                 src={selectedProduct.image_url} 
                 alt="" 
                 style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f1f1f1' }}
               />
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                 <div style={{ fontSize: '18px', fontWeight: 700, color: '#ee4d2d' }}>
                   Rp{selectedProduct.price.toLocaleString('id-ID')}
                 </div>
                 <div style={{ fontSize: '12px', color: '#757575', marginTop: '4px' }}>
                   Stok: 99+
                 </div>
               </div>
               <button onClick={() => setNegoModalOpen(false)} style={{ background: 'transparent', border: 'none', padding: 0, height: 'fit-content' }}>
                 <X size={24} color="#757575" />
               </button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', 
                  background: '#f6ffed', color: '#52c41a', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', border: '1px solid #b7eb8f'
                }}>
                  <CheckCircle size={32} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#212121' }}>Penawaran Berhasil Dikirim</h3>
                <p style={{ color: '#757575', fontSize: '13px', marginTop: '8px' }}>Sales kami akan menghubungi Anda segera.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Quantity Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#212121' }}>Jumlah</div>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e8e8e8', borderRadius: '2px' }}>
                    <button 
                      onClick={() => setNegoQty(Math.max(1, negoQty - 1))}
                      style={{ padding: '8px 12px', border: 'none', background: '#fff', fontSize: '18px' }}
                    >-</button>
                    <input 
                      type="number"
                      value={negoQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setNegoQty(isNaN(val) ? 0 : val);
                      }}
                      onBlur={() => {
                        if (negoQty < 1) setNegoQty(1);
                      }}
                      style={{ 
                        width: '50px', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        borderLeft: '1px solid #e8e8e8', 
                        borderRight: '1px solid #e8e8e8', 
                        borderTop: 'none', 
                        borderBottom: 'none', 
                        outline: 'none',
                        background: '#fff',
                        fontWeight: 700,
                        WebkitAppearance: 'none',
                        margin: 0
                      }}
                    />
                    <button 
                      onClick={() => setNegoQty(negoQty + 1)}
                      style={{ padding: '8px 12px', border: 'none', background: '#fff', fontSize: '18px' }}
                    >+</button>
                  </div>
                </div>

                {selectedProduct.min_bulk_qty > 0 && negoQty < selectedProduct.min_bulk_qty && (
                  <div style={{ background: '#fffbe6', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ffe58f', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={14} color="#faad14" />
                    <span style={{ fontSize: '11px', color: '#856404' }}>Min. {selectedProduct.min_bulk_qty} unit untuk fitur Nego Harga</span>
                  </div>
                )}

                {/* Nego Form (Only if above min_bulk_qty or for all?) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Nama Anda / Toko"
                    value={negoForm.customer_name}
                    onChange={e => setNegoForm({...negoForm, customer_name: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #e8e8e8', fontSize: '14px' }}
                  />
                  <input 
                    type="tel" 
                    placeholder="Nomor WhatsApp (0812...)"
                    value={negoForm.customer_wa}
                    onChange={e => setNegoForm({...negoForm, customer_wa: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #e8e8e8', fontSize: '14px' }}
                  />
                  
                  {negoQty >= (selectedProduct.min_bulk_qty || 1) && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 700, color: '#212121' }}>Rp</div>
                      <input 
                        type="number" 
                        placeholder="Harga yang Anda tawarkan"
                        style={{ width: '100%', padding: '14px 16px 14px 40px', borderRadius: '4px', border: '1px solid #ee4d2d', fontSize: '14px', fontWeight: 700, outline: 'none' }}
                        value={negoForm.offered_price || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/^0+/, ''));
                          setNegoForm({...negoForm, offered_price: isNaN(val) ? 0 : val});
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button 
                    onClick={() => {
                      const waNumber = referrerSales?.no_wa || '6281234567890';
                      const message = encodeURIComponent(`Halo, saya ingin bertanya tentang ${selectedProduct.name}`);
                      window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
                    }}
                    style={{ 
                      flex: 1, padding: '14px', borderRadius: '4px', 
                      background: '#00bfa5', color: '#fff', 
                      border: 'none', fontWeight: 600, fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <MessageCircle size={18} /> Chat
                  </button>
                  <button 
                    onClick={handleSubmitNego}
                    disabled={isSubmitting}
                    style={{ 
                      flex: 2, padding: '14px', borderRadius: '4px', 
                      background: '#ee4d2d', color: '#fff', 
                      border: 'none', fontWeight: 600, fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (negoQty >= (selectedProduct.min_bulk_qty || 1) ? 'Ajukan Nego' : 'Beli Sekarang')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
