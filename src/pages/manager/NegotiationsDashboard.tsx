import { useState, useEffect } from 'react';
import { RefreshCw, Plus, X, Search, Filter, ChevronRight, List, Star, ShoppingCart, ShoppingBag } from 'lucide-react';
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

  const { masterCategories } = useSalesData();

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

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      
      {/* SHOPEE TOP BAR (TINY) */}
      <div style={{ background: '#ee4d2d', color: '#fff', fontSize: '12px', padding: '4px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Seller Centre</span>
          <span style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '16px' }}>Mulai Berjualan</span>
          <span style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '16px' }}>Download</span>
          <span style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '16px' }}>Ikuti kami di <span style={{ fontWeight: 700 }}>f t i</span></span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Notifikasi</span>
          <span>Bantuan</span>
          <span>Bahasa Indonesia</span>
          <span style={{ fontWeight: 700 }}>Daftar | Log In</span>
        </div>
      </div>

      {/* SHOPEE MAIN HEADER */}
      <div style={{ background: '#ee4d2d', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '48px', position: 'sticky', top: 0, zIndex: 100, paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', cursor: 'pointer' }}>
          <ShoppingBag size={44} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>PT. Industri</span>
            <span style={{ fontSize: '18px', fontWeight: 600, opacity: 0.9 }}>Keluarga Timur</span>
          </div>
        </div>
        
        <div style={{ flex: 1, maxWidth: '800px' }}>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input 
              type="text" 
              placeholder="Daftar & Dapat Voucher Gratis" 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '2px', border: 'none', fontSize: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button style={{ position: 'absolute', right: '4px', top: '4px', bottom: '4px', background: '#ee4d2d', border: 'none', borderRadius: '2px', padding: '0 20px', color: '#fff', cursor: 'pointer' }}>
              <Search size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
            <span>Celana Pants</span>
            <span>Baju Kemeja Korean Style</span>
            <span>Basreng 1 Kilo</span>
            <span>Jam Tangan HP Android</span>
            <span>Baju One Set Korean Style</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ color: '#fff', position: 'relative', cursor: 'pointer' }}>
            <ShoppingCart size={28} />
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#fff', color: '#ee4d2d', fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '10px', border: '1px solid #ee4d2d' }}>0</span>
          </div>
          <button 
            onClick={() => openProductModal()} 
            style={{ background: '#fff', color: '#ee4d2d', border: 'none', borderRadius: '4px', padding: '10px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '24px', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 700, color: '#212121' }}>
            <List size={18} /> Semua Kategori
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              onClick={() => setSelectedCategory('Semua')}
              style={{ fontSize: '14px', cursor: 'pointer', color: selectedCategory === 'Semua' ? '#ee4d2d' : '#212121', fontWeight: selectedCategory === 'Semua' ? 700 : 400 }}
            >
              Semua Produk
            </div>
            {masterCategories.map((cat: any) => (
              <div 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                style={{ fontSize: '14px', cursor: 'pointer', color: selectedCategory === cat.name ? '#ee4d2d' : '#212121', fontWeight: selectedCategory === cat.name ? 700 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                {cat.name}
                {selectedCategory === cat.name && <ChevronRight size={14} />}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 700, color: '#212121' }}>
              <Filter size={18} /> FILTER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#212121' }}>
                <input type="checkbox" /> Jabodetabek
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#212121' }}>
                <input type="checkbox" /> DKI Jakarta
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#212121' }}>
                <input type="checkbox" /> Jawa Barat
              </label>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1 }}>
          
          {/* SHOPEE MALL BRANDS (DUMMY) */}
          <div style={{ background: '#fff', borderRadius: '4px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#d0011b', fontWeight: 700, fontSize: '16px' }}>SHOPEE MALL</span>
              <span style={{ color: '#ee4d2d', fontSize: '13px', cursor: 'pointer' }}>Lihat Semua &gt;</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
              {['Nubia', 'Advan', 'Garmin', 'Suunto', 'Anker', 'Lenovo'].map(brand => (
                <div key={brand} style={{ border: '1px solid #f1f1f1', borderRadius: '4px', padding: '16px', textAlign: 'center', color: '#999', fontSize: '14px', fontWeight: 700 }}>
                  {brand.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* SORT BAR */}
          <div style={{ background: '#ededed', borderRadius: '4px', padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#555' }}>Urutkan</span>
            <button style={{ background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '2px', padding: '8px 16px', fontSize: '14px' }}>Populer</button>
            <button style={{ background: '#fff', color: '#212121', border: 'none', borderRadius: '2px', padding: '8px 16px', fontSize: '14px' }}>Terbaru</button>
            <button style={{ background: '#fff', color: '#212121', border: 'none', borderRadius: '2px', padding: '8px 16px', fontSize: '14px' }}>Terlaris</button>
            <select style={{ background: '#fff', color: '#212121', border: 'none', borderRadius: '2px', padding: '8px 16px', fontSize: '14px', flex: 1, maxWidth: '200px' }}>
              <option>Harga</option>
              <option>Harga: Rendah ke Tinggi</option>
              <option>Harga: Tinggi ke Rendah</option>
            </select>
          </div>

          {/* PRODUCT GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
            ) : filteredProducts.map(p => (
              <div 
                key={p.id} 
                style={{ background: '#fff', borderRadius: '2px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                className="product-card-hover"
                onClick={() => openProductModal(p)}
              >
                <div style={{ position: 'relative', paddingTop: '100%' }}>
                  <img src={p.image_url} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.price > p.floor_price && (
                    <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,212,36,.9)', color: '#ee4d2d', padding: '2px 4px', fontSize: '10px', fontWeight: 700, borderRadius: '2px' }}>
                      PROMO
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#212121', height: '32px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '16px', marginBottom: '8px' }}>
                    <span style={{ background: '#ee4d2d', color: '#fff', fontSize: '10px', padding: '1px 3px', borderRadius: '2px', marginRight: '4px' }}>Star+</span>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ color: '#ee4d2d', fontSize: '16px', fontWeight: 500 }}>
                      <span style={{ fontSize: '11px' }}>Rp</span>{p.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#757575', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#ffce3d' }}><Star size={10} fill="currentColor" /></span>
                    <span>4.8 | 10RB+ terjual</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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

function Loader2({ className }: { className: string }) {
  return (
    <RefreshCw className={className} />
  );
}
