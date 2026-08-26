import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, X, CheckCircle, ChevronLeft, MoreVertical, MessageCircle, Star, ChevronDown, Info, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product, Sales } from '../../types';
import { store } from '../../store/dataStore';
import ProductCard from '../../components/public/ProductCard';

export default function CatalogPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Produk');
  const [activeFilter, setActiveFilter] = useState('Populer');
  const [priceSort, setPriceSort] = useState<'asc' | 'desc'>('asc');
  const [followerCount, setFollowerCount] = useState(0);

  
  const [negoModalOpen, setNegoModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cart, setCart] = useState<{product: Product, qty: number, offered_price: number}[]>([]);
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
  const [referrerSales, setReferrerSales] = useState<Sales | null>(null);

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
    } else if (activeFilter === 'Harga') {
      if (priceSort === 'asc') {
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else {
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
      }
    }

    return result;
  }, [products, search, activeTab, selectedCategory, activeFilter]);

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setNegoQty(1);
    setNegoForm({
      ...negoForm,
      offered_price: product.price
    });
    setNegoModalOpen(true);
  };

  const addToCart = (openCart = false) => {
    if (!selectedProduct) return;
    
    const existingIndex = cart.findIndex(item => item.product.id === selectedProduct.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].qty += negoQty;
      newCart[existingIndex].offered_price = negoForm.offered_price;
      setCart(newCart);
    } else {
      setCart([...cart, { product: selectedProduct, qty: negoQty, offered_price: negoForm.offered_price }]);
    }
    setNegoModalOpen(false);
    if (openCart) {
      setCartModalOpen(true);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
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
    if (cart.length === 0 || !negoForm.customer_name || !negoForm.customer_wa) {
      alert('Mohon lengkapi data pemesan dan pastikan keranjang tidak kosong.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Loop through cart to submit each as a negotiation
      const promises = cart.map(item => 
        store.submitNegotiation({
          product_id: item.product.id,
          sales_id: referrerSales?.id || undefined,
          customer_name: negoForm.customer_name,
          customer_wa: negoForm.customer_wa,
          requested_qty: item.qty,
          offered_price: item.offered_price
        })
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        const errorMsg = errors[0].error?.message || 'Unknown Error';
        console.error('Submission Errors:', errors);
        alert(`Gagal menyimpan pesanan: ${errorMsg}`);
        setIsSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      setCart([]);
      setTimeout(() => {
        setCartModalOpen(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim penawaran. Mohon coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
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
            <ChevronLeft size={24} color="#2563EB" />
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
              color: activeTab === tab ? '#2563EB' : '#757575',
              fontWeight: activeTab === tab ? 700 : 500,
              position: 'relative'
            }}
          >
            {tab}
            {activeTab === tab && (
              <div style={{ 
                position: 'absolute', bottom: 0, left: '20%', right: '20%', 
                height: '2px', background: '#2563EB' 
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
              fontSize: '14px', color: activeFilter === f ? '#2563EB' : '#757575',
              fontWeight: activeFilter === f ? 600 : 500,
              display: 'flex', alignItems: 'center', gap: '2px'
            }}
          >
            {f} {f === 'Terbaru' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }} />}
          </button>
        ))}
        <button 
          onClick={() => {
            if (activeFilter === 'Harga') {
              setPriceSort(priceSort === 'asc' ? 'desc' : 'asc');
            } else {
              setActiveFilter('Harga');
              setPriceSort('asc');
            }
          }}
          style={{ 
            background: 'transparent', border: 'none', padding: 0,
            fontSize: '14px', color: activeFilter === 'Harga' ? '#2563EB' : '#757575', fontWeight: activeFilter === 'Harga' ? 600 : 500,
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          Harga <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
             <ChevronDown size={10} style={{ transform: 'rotate(180deg)', color: (activeFilter === 'Harga' && priceSort === 'asc') ? '#2563EB' : '#757575' }} />
             <ChevronDown size={10} style={{ color: (activeFilter === 'Harga' && priceSort === 'desc') ? '#2563EB' : '#757575' }} />
          </div>
        </button>
      </div>

      {/* Product Grid / Categories List */}
      <div style={{ padding: '8px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader2 className="animate-spin" size={32} color="#2563EB" />
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
                 <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563EB' }}>
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
                        style={{ width: '100%', padding: '14px 16px 14px 40px', borderRadius: '4px', border: '1px solid #2563EB', fontSize: '14px', fontWeight: 700, outline: 'none' }}
                        value={negoForm.offered_price || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/^0+/, ''));
                          setNegoForm({...negoForm, offered_price: isNaN(val) ? 0 : val});
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => addToCart(false)}
                    style={{ 
                      flex: 1, padding: '14px', borderRadius: '4px', 
                      background: '#fff', color: '#2563EB', 
                      border: '1px solid #2563EB', fontWeight: 600, fontSize: '13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}
                  >
                    <ShoppingCart size={16} /> +Keranjang
                  </button>
                  <button 
                    onClick={() => addToCart(true)}
                    style={{ 
                      flex: 1.5, padding: '14px', borderRadius: '4px', 
                      background: '#2563EB', color: '#fff', 
                      border: 'none', fontWeight: 700, fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    Beli & Pesan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && !cartModalOpen && (
        <button 
          onClick={() => setCartModalOpen(true)}
          style={{ 
            position: 'fixed', bottom: '24px', left: '16px', right: '16px', 
            background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 4px 20px rgba(238, 77, 45, 0.4)', zIndex: 900
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={24} />
              <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#fff', color: '#2563EB', width: '18px', height: '18px', borderRadius: '50%', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2563EB' }}>{cart.length}</div>
            </div>
            <span style={{ fontWeight: 700 }}>Lihat Keranjang</span>
          </div>
          <span style={{ fontWeight: 900 }}>Rp{cart.reduce((acc, item) => acc + (item.offered_price * item.qty), 0).toLocaleString('id-ID')}</span>
        </button>
      )}

      {/* Cart & Checkout Modal */}
      {cartModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', zIndex: 1001
        }} onClick={() => !isSubmitting && setCartModalOpen(false)}>
          <div 
            style={{ 
              width: '100%', background: '#fff', 
              borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
              padding: '24px 20px calc(30px + env(safe-area-inset-bottom))',
              maxHeight: '90vh', overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Keranjang Saya</h3>
                <button onClick={() => setCartModalOpen(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', padding: '4px' }}><X size={24} /></button>
             </div>

             {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                   <CheckCircle size={64} color="#52c41a" style={{ marginBottom: '16px' }} />
                   <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Pesanan Berhasil!</h3>
                   <p style={{ color: '#757575', marginTop: '8px' }}>Sales kami akan segera menghubungi Anda.</p>
                </div>
             ) : (
               <>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                   {cart.map(item => (
                     <div key={item.product.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f1f1' }}>
                        <img src={item.product.image_url} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '14px', fontWeight: 700 }}>{item.product.name}</div>
                           <div style={{ fontSize: '14px', color: '#2563EB', fontWeight: 800, marginTop: '2px' }}>Rp{item.offered_price.toLocaleString('id-ID')}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <button onClick={() => updateCartQty(item.product.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff' }}>-</button>
                           <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                           <button onClick={() => updateCartQty(item.product.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff' }}>+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} style={{ color: '#ff4d4f', padding: '4px' }}><X size={18} /></button>
                     </div>
                   ))}
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Data Pemesan</div>
                    <input 
                      type="text" placeholder="Nama Anda / Toko" 
                      value={negoForm.customer_name}
                      onChange={e => setNegoForm({...negoForm, customer_name: e.target.value})}
                      style={{ padding: '16px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px' }} 
                    />
                    <input 
                      type="tel" placeholder="No. WhatsApp (0812...)" 
                      value={negoForm.customer_wa}
                      onChange={e => setNegoForm({...negoForm, customer_wa: e.target.value})}
                      style={{ padding: '16px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px' }} 
                    />
                 </div>

                 <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>Total Pesanan</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#2563EB' }}>Rp{cart.reduce((acc, item) => acc + (item.offered_price * item.qty), 0).toLocaleString('id-ID')}</span>
                 </div>

                 <button 
                   onClick={handleSubmitNego}
                   disabled={isSubmitting || !negoForm.customer_name || !negoForm.customer_wa}
                   style={{ 
                     width: '100%', padding: '18px', borderRadius: '12px', 
                     background: isSubmitting ? '#ccc' : '#2563EB', color: '#fff', 
                     border: 'none', fontWeight: 800, fontSize: '16px' 
                   }}
                 >
                   {isSubmitting ? <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /> : 'Pesan & Ajukan Nego Sekarang'}
                 </button>
               </>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
