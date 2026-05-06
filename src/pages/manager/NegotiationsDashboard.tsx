import { useState, useEffect } from 'react';
import { Plus, X, Search, Filter, ChevronRight, List, Star, ShoppingCart, Loader2 } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';

export default function NegotiationsDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
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
    is_active: true,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { masterProductCategories } = useSalesData();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { title: 'Marketplace Dashboard', sub: 'Preview & Manajemen Katalog Produk' } 
    }));
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const { data } = await store.fetchProducts(false);
    setProducts(data || []);
    setLoading(false);
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
        is_active: existingData.is_active,
        description: existingData.description || ''
      });
      setEditingProduct(existingData);
    } else {
      setProductForm({ name: '', category: '', price: 0, floor_price: 0, image_url: '', min_bulk_qty: 1, is_active: true, description: '' });
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
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm({ ...productForm, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif" }}>
      


      {/* BRAND MAIN HEADER */}
      <div style={{ background: '#111827', padding: '24px 24px 32px', display: 'flex', alignItems: 'center', gap: '48px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#fff', cursor: 'pointer' }} onClick={() => window.location.reload()}>
          <div style={{ background: '#FFCC00', color: '#111827', width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '22px', boxShadow: '0 4px 15px rgba(255, 204, 0, 0.4)' }}>
            IKT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFCC00', letterSpacing: '0.5px' }}>PT. INDUSTRI</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', opacity: 0.8 }}>Keluarga Timur</span>
          </div>
        </div>
        
        <div style={{ flex: 1, maxWidth: '800px' }}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input 
              type="text" 
              placeholder="Cari produk berkualitas di IKT Marketplace..." 
              style={{ width: '100%', padding: '14px 20px', borderRadius: '8px', border: 'none', fontSize: '15px', fontWeight: 600, background: '#fff', color: '#111827', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', background: '#111827', border: 'none', borderRadius: '6px', padding: '0 24px', color: '#FFCC00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={22} strokeWidth={3} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ color: '#FFCC00' }}>Produk Terlaris</span>
            <span>Beras Premium</span>
            <span>Minyak Goreng</span>
            <span>Gula Pasir</span>
            <span>Sembako Murah</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ color: '#fff', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }} className="tap-active">
            <ShoppingCart size={32} />
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#FFCC00', color: '#111827', fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '10px', border: '2px solid #111827' }}>0</span>
          </div>
          <button 
            onClick={() => openProductModal()} 
            style={{ background: '#FFCC00', color: '#111827', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(255, 204, 0, 0.3)' }}
          >
            <Plus size={20} strokeWidth={3} /> TAMBAH PRODUK
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '24px', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, color: '#111827', fontSize: '15px' }}>
            <List size={20} /> SEMUA KATEGORI
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div 
              onClick={() => setSelectedCategory('Semua')}
              style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: selectedCategory === 'Semua' ? '#111827' : 'transparent', color: selectedCategory === 'Semua' ? '#FFCC00' : '#475569', fontWeight: 700, transition: 'all 0.2s' }}
            >
              Semua Produk
            </div>
            {masterProductCategories.map((cat: any) => (
              <div 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: selectedCategory === cat.name ? '#111827' : 'transparent', color: selectedCategory === cat.name ? '#FFCC00' : '#475569', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
              >
                {cat.name}
                {selectedCategory === cat.name && <ChevronRight size={16} />}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1.5px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, color: '#111827', fontSize: '15px' }}>
              <Filter size={20} /> STATUS STOK
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Ready Stock', 'Indent / Pre-Order', 'Premium Only', 'Promo Diskon'].map(loc => (
                <label key={loc} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
                  <input type="checkbox" style={{ accentColor: '#111827', width: '16px', height: '16px' }} /> {loc}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1 }}>
          
          {/* IKT EXCLUSIVE (Replaces Shopee Mall) */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#111827', fontWeight: 900, fontSize: '18px', letterSpacing: '0.5px' }}>IKT EXCLUSIVE</span>
                <span style={{ background: '#FFCC00', color: '#111827', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '4px' }}>OFFICIAL</span>
              </div>
              <span style={{ color: '#111827', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: 0.7 }}>Lihat Semua &gt;</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
              {['Premium', 'Quality', 'Trusted', 'Family', 'Legacy', 'Global'].map(brand => (
                <div key={brand} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#111827', fontSize: '12px', fontWeight: 800, background: '#f8fafc' }}>
                  {brand.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* SORT BAR */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1.5px solid #e2e8f0' }}>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Urutkan</span>
            <button style={{ background: '#111827', color: '#FFCC00', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 800 }}>Populer</button>
            <button style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700 }}>Terbaru</button>
            <button style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700 }}>Terlaris</button>
            <select style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', flex: 1, maxWidth: '200px', fontWeight: 700 }}>
              <option>Harga</option>
              <option>Harga: Rendah ke Tinggi</option>
              <option>Harga: Tinggi ke Rendah</option>
            </select>
          </div>

          {/* PRODUCT GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
            ) : filteredProducts.map(p => (
              <div 
                key={p.id} 
                style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.3s', position: 'relative', border: '1.5px solid #f1f5f9' }}
                className="product-card-hover"
                onClick={() => openProductModal(p)}
              >
                <div style={{ position: 'relative', paddingTop: '100%' }}>
                  <img src={p.image_url} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.price > p.floor_price && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#FFCC00', color: '#111827', padding: '4px 8px', fontSize: '10px', fontWeight: 900, borderRadius: '6px', boxShadow: '0 4px 10px rgba(255, 204, 0, 0.3)' }}>
                      IKT DEAL
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#111827', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '20px', marginBottom: '12px', fontWeight: 600 }}>
                    <span style={{ background: '#111827', color: '#FFCC00', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', fontWeight: 900 }}>PRO+</span>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ color: '#111827', fontSize: '20px', fontWeight: 900 }}>
                      <span style={{ fontSize: '13px', color: '#64748b', marginRight: '2px' }}>Rp</span>{p.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <span style={{ color: '#FFCC00' }}><Star size={12} fill="currentColor" /></span>
                    <span>5.0 | Best Seller</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD/EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '800px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '95vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '24px 32px', background: '#111827', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#FFCC00', textTransform: 'uppercase' }}>
                  {editingProduct ? 'EDIT DATA PRODUK' : 'TAMBAH PRODUK BARU'}
                </h3>
                <p style={{ fontSize: '12px', opacity: 0.7, fontWeight: 600 }}>PT. Industri Keluarga Timur Marketplace</p>
              </div>
              <button onClick={() => setProductModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                
                {/* LEFT COL: INFO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ borderLeft: '4px solid #FFCC00', paddingLeft: '16px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginBottom: '2px' }}>INFORMASI PRODUK</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Detail dasar untuk katalog produk</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Nama Produk</label>
                    <input 
                      required
                      placeholder="Masukkan nama produk..."
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 600, background: '#f8fafc', outline: 'none' }}
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Kategori</label>
                    <select 
                      required
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 600, background: '#f8fafc', outline: 'none' }}
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    >
                      <option value="">Pilih Kategori</option>
                      {masterProductCategories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Deskripsi</label>
                    <textarea 
                      placeholder="Jelaskan detail produk Anda..."
                      rows={5}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 600, background: '#f8fafc', outline: 'none', resize: 'none' }}
                      value={(productForm as any).description || ''}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value} as any)}
                    />
                  </div>
                </div>

                {/* RIGHT COL: SALES & MEDIA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ borderLeft: '4px solid #111827', paddingLeft: '16px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginBottom: '2px' }}>HARGA & MEDIA</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Pengaturan penjualan dan foto</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Harga Jual (Rp)</label>
                      <input 
                        type="number"
                        required
                        placeholder="0"
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 900, background: '#f8fafc', outline: 'none', color: '#111827' }}
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Harga Dasar (Rp)</label>
                      <input 
                        type="number"
                        required
                        placeholder="0"
                        style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 900, background: '#f8fafc', outline: 'none', color: '#64748b' }}
                        value={productForm.floor_price}
                        onChange={(e) => setProductForm({...productForm, floor_price: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Foto Produk (JPG/PNG)</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <label style={{ flex: 1, cursor: 'pointer' }}>
                        <div style={{ padding: '14px 18px', borderRadius: '12px', border: '2px dashed #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                          <Plus size={18} /> {productForm.image_url ? 'Ganti Foto' : 'Pilih Foto'}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleImageUpload}
                        />
                      </label>
                      {productForm.image_url && (
                        <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #f1f5f9', flexShrink: 0, position: 'relative' }}>
                          <img src={productForm.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setProductForm({...productForm, image_url: ''})}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '0 0 0 8px', padding: '2px', cursor: 'pointer' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '16px', border: '1px dashed #fcd34d' }}>
                    <p style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, lineHeight: '1.5' }}>
                      💡 TIPS: Gunakan gambar dengan rasio 1:1 untuk tampilan marketplace yang lebih optimal. Harga dasar digunakan sebagai batas minimal negosiasi sistem.
                    </p>
                  </div>
                </div>

              </div>

              <div style={{ marginTop: '40px', padding: '24px 0 0', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editingProduct ? (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteProduct(editingProduct.id)}
                    style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Hapus Produk
                  </button>
                ) : <div />}
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    type="button" 
                    onClick={() => setProductModalOpen(false)}
                    style={{ padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ padding: '12px 48px', borderRadius: '12px', fontSize: '14px', fontWeight: 900, color: '#111827', background: '#FFCC00', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 204, 0, 0.4)', opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN PRODUK'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

