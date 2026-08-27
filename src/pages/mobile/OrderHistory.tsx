// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';

import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../store/dataStore';
import { ShoppingCart, Search, Plus, X, Loader2, CheckCircle, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function OrderHistory() {
  
  const { user } = useAuth();
  const { orders = [], customers = [] } = useSalesData();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Quick Order / Edit State
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderAmount, setOrderAmount] = useState('');
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  
  const [orderDate, setOrderDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [orderTime, setOrderTime] = useState(() => format(new Date(), 'HH:mm'));

  if (!user) return null;

  const myOrders = useMemo(() => {
    return orders.filter(o => o.sales_id === user.id)
                 .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, user.id]);

  const handleOpenEdit = (order: any) => {
    const cust = customers.find(c => c.id === order.customer_id);
    setSelectedCust(cust || { id: order.customer_id, nama_toko: order.customer_name });
    setEditOrderId(order.id);
    setOrderAmount(order.amount?.toString() || '');
    
    // Parse order date for editing
    const d = new Date(order.created_at);
    setOrderDate(format(d, 'yyyy-MM-dd'));
    setOrderTime(format(d, 'HH:mm'));
    
    setIsOrderModalOpen(true);
  };

  const handleOrderSubmit = async () => {
    if (!selectedCust || !orderAmount) return;
    
    const amount = parseFloat(orderAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      alert('Quantity tidak valid.');
      return;
    }

    const dateObj = new Date(`${orderDate}T${orderTime}:00`);
    const customDateIso = dateObj.toISOString();

    setIsSubmitting(true);
    try {
      if (editOrderId) {
        await store.updateOrder(editOrderId, amount, customDateIso);
      } else {
        await store.logOrder(user.id, selectedCust.id, selectedCust.nama_toko, amount, user.nama, customDateIso);
      }
      
      setOrderSuccess(true);
      
      // Intent redirect to Accurate
      window.location.href = 'intent:#Intent;package=com.cpssoft.mobile.alpha;end';

      setTimeout(() => {
        setIsOrderModalOpen(false);
        setOrderSuccess(false);
        setSelectedCust(null);
        setOrderSearch('');
        setEditOrderId(null);
        setOrderDate(format(new Date(), 'yyyy-MM-dd'));
        setOrderTime(format(new Date(), 'HH:mm'));
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.sales_pic === user.id &&
    (c.nama_toko.toLowerCase().includes(orderSearch.toLowerCase()) ||
     c.area.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  return (
    <>
    <div className="page-content" style={{ background: '#F5F6F8', minHeight: '100vh', paddingBottom: '120px', paddingTop: 0 }}>
      {/* Header - White Gojek Style */}
      <div style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: 'calc(16px + env(safe-area-inset-top)) 20px 16px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1C1C1C' }}>Pesanan</h1>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {myOrders.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#727272' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #E8E8E8' }}>
              <ShoppingCart size={32} opacity={0.3} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1C' }}>Belum Ada Pesanan</div>
          </div>
        ) : (
          myOrders.map(order => {
            const dateStr = format(new Date(order.created_at), 'dd MMM, HH:mm', { locale: localeId });
            
            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8E8E8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#727272', fontWeight: 600 }}>{dateStr}</div>
                  <div style={{ fontSize: '14px', color: '#1C1C1C', fontWeight: 800 }}>
                    {order.amount ? order.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) : 'Rp0'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Thumbnail */}
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#E6F6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingCart size={24} color="#00AA13" />
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1C', marginBottom: '4px', lineHeight: 1.2 }}>
                      {order.customer_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#727272', fontWeight: 500, marginBottom: '8px', lineHeight: 1.4 }}>
                      Pesanan Sales
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} color="#00AA13" fill="#00AA13" stroke="#fff" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#727272' }}>Selesai</span>
                      </div>
                      
                      {/* Action Button (Edit) */}
                      <button style={{ 
                        background: '#00AA13', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '20px', 
                        padding: '6px 12px', 
                        fontSize: '12px', 
                        fontWeight: 800,
                        cursor: 'pointer'
                      }} onClick={() => handleOpenEdit(order)}>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Order Button */}
      <button 
        onClick={() => {
          setSelectedCust(null);
          setOrderAmount('');
          setEditOrderId(null);
          setOrderDate(format(new Date(), 'yyyy-MM-dd'));
          setOrderTime(format(new Date(), 'HH:mm'));
          setIsOrderModalOpen(true);
        }}
        style={{ 
          position: 'fixed', 
          bottom: 'calc(98px + env(safe-area-inset-bottom))', 
          right: '20px', 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          background: '#00AA13', 
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 4px 15px rgba(0, 170, 19, 0.4)',
          border: 'none',
          zIndex: 99,
          cursor: 'pointer'
        }}
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {/* Quick Order Modal */}
      {isOrderModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', animation: 'slideUp 0.3s ease-out' }}>
            {orderSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={40} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Pesanan Berhasil!</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                  {editOrderId ? 'Pesanan berhasil diperbarui.' : 'Sedang dialihkan ke Accurate...'}
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                    {editOrderId ? 'Edit Pesanan' : 'Input Pesanan Cepat'}
                  </h3>
                  <button onClick={() => setIsOrderModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <X size={18} />
                  </button>
                </div>

                {!selectedCust ? (
                  <>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        placeholder="Cari Toko..." 
                        value={orderSearch}
                        onChange={e => setOrderSearch(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none' }}
                        autoFocus
                      />
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedCust(c)}
                          style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        >
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 800 }}>
                            {c.nama_toko.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{c.nama_toko}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{c.area}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Toko Terpilih</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>{selectedCust.nama_toko}</div>
                      </div>
                      <button onClick={() => setSelectedCust(null)} style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 700, background: 'none', border: 'none' }}>Ganti</button>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Quantity order (Kg)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="Contoh: 1500000" 
                        value={orderAmount}
                        onChange={e => setOrderAmount(e.target.value)}
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #00AA13', fontSize: '18px', fontWeight: 900, outline: 'none', textAlign: 'right' }}
                        autoFocus
                      />
                    </div>
                    
                    {/* Waktu & Tanggal (Editable now) */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ flex: 1 }}>
                         <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Tanggal</label>
                         <div style={{ position: 'relative' }}>
                           <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                           <input 
                              type="date" 
                              value={orderDate}
                              onChange={e => setOrderDate(e.target.value)}
                              style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', fontWeight: 700, color: '#1e293b' }}
                           />
                         </div>
                      </div>
                      <div style={{ flex: 1 }}>
                         <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Waktu</label>
                         <div style={{ position: 'relative' }}>
                           <Clock size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                           <input 
                              type="time" 
                              value={orderTime}
                              onChange={e => setOrderTime(e.target.value)}
                              style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', fontWeight: 700, color: '#1e293b' }}
                           />
                         </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleOrderSubmit}
                      disabled={isSubmitting || !orderAmount}
                      style={{ 
                        width: '100%', padding: '18px', borderRadius: '16px', background: '#00AA13', color: '#fff', fontSize: '16px', fontWeight: 900, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (isSubmitting || !orderAmount) ? 0.7 : 1
                      }}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                      {editOrderId ? 'Simpan Perubahan' : 'Lanjut ke Accurate'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
