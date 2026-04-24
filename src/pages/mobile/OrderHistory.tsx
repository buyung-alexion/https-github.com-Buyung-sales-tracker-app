import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../store/dataStore';
import { ArrowLeft, ShoppingCart, Search, Plus, X, Loader2, CheckCircle, ChevronDown, ChevronRight, Edit3, BarChart2, FileText } from 'lucide-react';
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

  // Live date tracking for midnight transitions
  const [todayStr, setTodayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  
  useEffect(() => {
    const interval = setInterval(() => {
      const current = format(new Date(), 'yyyy-MM-dd');
      if (current !== todayStr) setTodayStr(current);
    }, 10000);
    return () => clearInterval(interval);
  }, [todayStr]);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return format(d, 'yyyy-MM-dd');
  }, [todayStr]);

  const myOrders = useMemo(() => orders.filter(o => o.sales_id === user.id), [orders, user.id]);
  
  // Grouping by local date
  const groupedOrders = useMemo(() => {
    const groups: Record<string, typeof myOrders> = {};
    myOrders.forEach(order => {
      // Convert to local date string for correct grouping
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return groups;
  }, [myOrders, todayStr]);

  const sortedDates = useMemo(() => Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a)), [groupedOrders]); 

  // Expand "Hari ini" by default on first load
  useMemo(() => {
    if (sortedDates.includes(todayStr) && expandedDates.length === 0) {
      setExpandedDates([todayStr]);
    }
  }, [sortedDates, todayStr]);

  const formatGroupName = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hari ini';
    if (dateStr === yesterdayStr) return 'Kemarin';
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
    <>
    <div className="page-content" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Header Branding Yellow Style */}
      <div style={{ background: 'var(--brand-yellow)', padding: 'calc(20px + env(safe-area-inset-top)) 20px 40px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 10px 30px rgba(255, 193, 7, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="#000" />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#000', letterSpacing: '-0.5px' }}>Pesanan Penjualan</h1>
        </div>

        {/* Total Summary Row */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
           <div style={{ flex: 1, background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={14} color="#2563eb" />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pesanan</div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 950, color: '#1e293b' }}>
                {myOrders.length} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Order</span>
              </div>
           </div>
           
           <div style={{ flex: 1, background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={14} color="#d97706" />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Omzet Total</div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 950, color: '#1e293b', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>Rp</span>
                <span>{myOrders.reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString('id-ID')}</span>
              </div>
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
                <div key={date} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                  {/* Card Header (Accordion Trigger) */}
                  <div 
                    onClick={() => toggleExpand(date)}
                    style={{ 
                      padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', 
                      background: '#fff',
                      borderLeft: '6px solid #06b6d4',
                      position: 'relative'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 950, color: '#1e293b', marginBottom: '4px' }}>{formatGroupName(date)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                         <FileText size={12} style={{ opacity: 0.7 }} />
                         <span style={{ fontSize: '11px', fontWeight: 800 }}>{ordersInGroup.length} Pesanan</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                       <div style={{ fontSize: '16px', fontWeight: 950, color: '#1e293b' }}>Rp {totalAmount.toLocaleString('id-ID')}</div>
                       {isExpanded ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
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

      {/* Quick Order / Edit Drawer (Moved outside page-content for stable positioning) */}
      {isOrderModalOpen && (
        <div onClick={() => setIsOrderModalOpen(false)} style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', 
          zIndex: 999999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' 
        }}>
          <div onClick={e => e.stopPropagation()} style={{ 
            height: '92vh', width: '100%', maxWidth: '100%', background: '#f8fafc', 
            borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
            display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'hidden',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
            position: 'relative', boxSizing: 'border-box'
          }}>
            {/* 1. Header & Drag Handle */}
            <div style={{ padding: '12px 0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div style={{ width: '36px', height: '5px', background: '#E2E8F0', borderRadius: '10px', marginBottom: '20px' }} />
              <div style={{ width: '100%', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#EFF6FF', color: '#3B82F6', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 950, color: '#1e293b' }}>{editOrderId ? 'Edit Pesanan' : 'Order Baru'}</h3>
                </div>
                <button onClick={() => setIsOrderModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="#64748b" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Card 1: Customer Selection */}
              <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informasi Pelanggan</div>
                
                {editOrderId || selectedCust ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F0F9FF', borderRadius: '16px', border: '1px solid #BAE6FD' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{selectedCust?.nama_toko || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{selectedCust?.area || '-'}</div>
                    </div>
                    {!editOrderId && (
                      <button 
                        onClick={() => { setSelectedCust(null); setOrderSearch(''); }}
                        style={{ border: 'none', background: 'none', color: '#3B82F6', fontSize: '11px', fontWeight: 800 }}
                      >
                        Ganti
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text" 
                        placeholder="Cari nama toko atau area..." 
                        style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px 12px 12px 42px', fontSize: '14px', fontWeight: 700, outline: 'none' }}
                        value={orderSearch}
                        onChange={e => setOrderSearch(e.target.value)}
                      />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedCust(c)}
                          style={{ padding: '12px 16px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}
                        >
                          <div style={{ fontSize: '16px' }}>🏬</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{c.nama_toko}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{c.area}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Order Detail */}
              {selectedCust && (
                <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detail Pesanan</div>
                  
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>NOMINAL ORDER (RP)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0' }}>
                      <span style={{ fontSize: '20px', fontWeight: 950, color: '#3B82F6' }}>Rp</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0"
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '24px', fontWeight: 950, color: '#1e293b', width: '100%' }}
                        value={orderAmount}
                        onChange={e => setOrderAmount(e.target.value.replace(/[^0-9]/g, ''))}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Tracker (Optional Visual Only) */}
              {selectedCust && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px' }}>
                   <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#3B82F6' }} />
                   <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: orderAmount ? '#3B82F6' : '#E2E8F0' }} />
                   <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#E2E8F0' }} />
                </div>
              )}

            </div>

            {/* 3. Action Footer */}
            <div style={{ padding: '20px 20px 40px', background: '#fff', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
              <button 
                onClick={handleOrderSubmit}
                disabled={!selectedCust || !orderAmount || isSubmitting}
                style={{ 
                  width: '100%', height: '60px', borderRadius: '16px', border: 'none', 
                  background: (!selectedCust || !orderAmount) ? '#E2E8F0' : (isSubmitting ? '#94a3b8' : '#3B82F6'),
                  color: '#fff', fontSize: '16px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: (!selectedCust || !orderAmount) ? 'none' : '0 8px 25px rgba(59, 130, 246, 0.3)'
                }}
              >
                {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : orderSuccess ? <><CheckCircle size={24} /> Berhasil!</> : (editOrderId ? 'Update Pesanan' : 'Kirim & Lanjut Accurate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
