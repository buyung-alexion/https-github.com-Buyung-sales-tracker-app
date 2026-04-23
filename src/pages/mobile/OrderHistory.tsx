import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../store/dataStore';
import { ArrowLeft, ShoppingCart, Search, Plus, X, Loader2, CheckCircle, Users, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function OrderHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders = [], customers = [] } = useSalesData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  
  // Quick Order / Edit State
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderAmount, setOrderAmount] = useState('');
  const [editOrderId, setEditOrderId] = useState<string | null>(null);

  if (!user) return null;

  const myOrders = useMemo(() => orders.filter(o => o.sales_id === user.id), [orders, user.id]);
  
  // Grouping by date
  const groupedOrders = useMemo(() => {
    const groups: Record<string, typeof myOrders> = {};
    myOrders.forEach(order => {
      const date = order.created_at.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return groups;
  }, [myOrders]);

  const sortedDates = useMemo(() => Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a)), [groupedOrders]);

  // Expand "Hari ini" by default on first load
  useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (sortedDates.includes(today) && expandedDates.length === 0) {
      setExpandedDates([today]);
    }
  }, [sortedDates]);

  const formatGroupName = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Hari ini';
    if (dateStr === yesterday) return 'Kemarin';
    
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: localeId });
  };

  const toggleExpand = (date: string) => {
    setExpandedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const handleOpenEdit = (order: any) => {
    const cust = customers.find(c => c.id === order.customer_id);
    setSelectedCust(cust || { id: order.customer_id, nama_toko: order.customer_name });
    setEditOrderId(order.id);
    setOrderAmount(order.amount?.toString() || '');
    setIsOrderModalOpen(true);
  };

  const handleOrderSubmit = async () => {
    if (!selectedCust || !orderAmount) return;
    
    const amount = parseFloat(orderAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      alert('Nominal tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editOrderId) {
        await store.updateOrder(editOrderId, amount);
      } else {
        await store.logOrder(user.id, selectedCust.id, selectedCust.nama_toko, amount, user.nama);
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
    <div className="page-content" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Header Branding Yellow Style */}
      <div style={{ background: '#FFC107', padding: 'calc(20px + env(safe-area-inset-top)) 20px 40px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 10px 30px rgba(255, 193, 7, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="#000" />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#000', letterSpacing: '-0.5px' }}>Pesanan Penjualan</h1>
        </div>

        {/* Total Summary Row */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
           <div style={{ flex: 1, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' }}>Total Pesanan</div>
              <div style={{ fontSize: '18px', fontWeight: 950, color: '#000' }}>{myOrders.length} Pesanan</div>
           </div>
           <div style={{ flex: 1, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' }}>Omzet Total</div>
              <div style={{ fontSize: '18px', fontWeight: 950, color: '#000' }}>Rp {myOrders.reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString('id-ID')}</div>
           </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ padding: '0 20px', marginTop: '-20px' }}>
         <div style={{ background: '#fff', borderRadius: '16px', padding: '4px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ padding: '10px', color: '#94a3b8' }}><Search size={18} /></div>
            <input 
              type="text" 
              placeholder="Cari histori pesanan..." 
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: 700, padding: '10px 0' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* History List Grouped by Date (Accordion style) */}
      <div style={{ padding: '24px 20px' }}>
        {sortedDates.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShoppingCart size={32} opacity={0.3} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#475569' }}>Belum Ada Pesanan</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedDates.map(date => {
              const ordersInGroup = groupedOrders[date].filter(o => 
                o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              
              if (ordersInGroup.length === 0) return null;

              const totalAmount = ordersInGroup.reduce((sum, o) => sum + (o.amount || 0), 0);
              const isExpanded = expandedDates.includes(date);

              return (
                <div key={date} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleExpand(date)}
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{formatGroupName(date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '14px', fontWeight: 900, color: '#F59E0B' }}>Rp {totalAmount.toLocaleString('id-ID')}</div>
                       <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{ordersInGroup.length} Pesanan</div>
                    </div>
                  </div>
                  
                  {/* Accordion Content */}
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ordersInGroup.map(order => (
                        <div key={order.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                             <ShoppingCart size={16} color="#F59E0B" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{order.customer_name}</div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{format(new Date(order.created_at), 'HH:mm')}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>Rp {order.amount?.toLocaleString('id-ID')}</div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(order); }}
                              style={{ border: 'none', background: 'none', padding: '4px', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, marginLeft: 'auto' }}
                            >
                              <Edit3 size={12} /> EDIT
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => { 
          setEditOrderId(null); 
          setSelectedCust(null); 
          setOrderAmount('');
          setIsOrderModalOpen(true); 
        }}
        style={{ position: 'fixed', bottom: '110px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#3B82F6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)', zIndex: 100 }}
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Quick Order / Edit Drawer */}
      {isOrderModalOpen && (
        <div className="modal-overlay" onClick={() => setIsOrderModalOpen(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ 
            maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
            padding: '24px 20px calc(120px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' 
          }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#FEF3C7', color: '#F59E0B', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editOrderId ? <Edit3 size={20} /> : <Plus size={20} strokeWidth={3} />}
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#111827' }}>{editOrderId ? 'Edit Pesanan' : 'Buat Pesanan Baru'}</h3>
              </div>
              <button className="tap-active" onClick={() => setIsOrderModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Search Customer (Only for new orders) */}
              {!editOrderId && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Cari Customer..." 
                    style={{ width: '100%', borderRadius: '16px', border: '2px solid #f1f5f9', padding: '14px 14px 14px 48px', fontWeight: 700, fontSize: '15px' }}
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                  />
                </div>
              )}

              {/* Customer Info (Edit Mode) */}
              {editOrderId && selectedCust && (
                 <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '18px', border: '2px solid #3B82F6' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, marginBottom: '4px' }}>CUSTOMER</div>
                    <div style={{ fontSize: '16px', fontWeight: 950, color: '#1e293b' }}>{selectedCust.nama_toko}</div>
                 </div>
              )}

              {/* Nominal Order Input */}
              {selectedCust && (
                <div style={{ background: '#F0F9FF', borderRadius: '18px', padding: '16px', border: '2px solid #BAE6FD' }}>
                  <label style={{ fontSize: '12px', color: '#0369a1', fontWeight: 900, marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Nominal Order (IDR)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '4px 16px', borderRadius: '12px', border: '1px solid #7DD3FC' }}>
                    <span style={{ fontWeight: 900, color: '#0369a1', fontSize: '18px' }}>Rp</span>
                    <input 
                      type="number"
                      placeholder="Contoh: 1500000"
                      value={orderAmount}
                      onChange={e => setOrderAmount(e.target.value)}
                      style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', fontSize: '18px', fontWeight: 900, color: '#0369a1' }}
                    />
                  </div>
                </div>
              )}

              {/* Customer Selection List (Only for new orders) */}
              {!editOrderId && (
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <div 
                        key={c.id} 
                        className="tap-active"
                        onClick={() => setSelectedCust(c)}
                        style={{ 
                          padding: '14px 16px', borderRadius: '18px', border: '2px solid',
                          borderColor: selectedCust?.id === c.id ? '#3B82F6' : '#f8fafc',
                          background: selectedCust?.id === c.id ? '#EFF6FF' : '#F8FAFC',
                          display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏢</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{c.nama_toko}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{c.area}</div>
                        </div>
                        {selectedCust?.id === c.id && <CheckCircle size={20} color="#3B82F6" />}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                      <Users size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>Customer Tidak Ditemukan</div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button - Moved higher up to avoid overlap */}
              <button 
                className="tap-active" 
                disabled={!selectedCust || isSubmitting}
                onClick={handleOrderSubmit}
                style={{ 
                  width: '100%', height: '62px', borderRadius: '18px', fontSize: '16px', fontWeight: 950,
                  background: isSubmitting ? '#e2e8f0' : orderSuccess ? '#10b981' : '#3B82F6',
                  color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 12px 24px rgba(59, 130, 246, 0.3)',
                  marginTop: '10px'
                }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : orderSuccess ? <><CheckCircle size={24} /> Berhasil!</> : editOrderId ? 'Update & Lanjut' : 'Lanjut ke Accurate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
