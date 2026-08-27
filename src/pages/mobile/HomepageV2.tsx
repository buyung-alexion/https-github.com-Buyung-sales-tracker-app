import { useState, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Clock, Target, MessageSquare, ShoppingCart, BarChart3, Users, MapPin, Trophy, X, ShoppingBag, Share, Menu, List, Loader2 } from 'lucide-react';
import { store } from '../../store/dataStore';
import { calculateSalesPoints } from '../../utils/points';

interface Props { salesId: string; setSidebarOpen?: (open: boolean) => void; }

export default function Homepage({ salesId, setSidebarOpen }: Props) {
  const { user } = useAuth();
  const { activities = [], prospek = [], customers = [], sales = [], systemTargets = null } = useSalesData() || {};
  const currentSales = sales.find(s => s.id === salesId) || (user as any);
  const navigate = useNavigate();
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [incomingOrdersModalOpen, setIncomingOrdersModalOpen] = useState(false);
  const [myNegotiations, setMyNegotiations] = useState<any[]>([]);
  const [loadingNego, setLoadingNego] = useState(false);
  const [negoTab, setNegoTab] = useState<'pending' | 'processed'>('pending');
  
  const salesName = user?.nama || currentSales?.nama;
  const salesDisplayName = salesName?.split(' ')[0] || 'Sales';

  useEffect(() => {
    document.body.classList.add('wallet-theme');
    return () => { document.body.classList.remove('wallet-theme'); }
  }, []);

  useEffect(() => {
    loadMyNegotiations();
    const channel = store.subscribeToNegotiations(() => {
      loadMyNegotiations();
    });
    return () => {
      store.unsubscribeFromNegotiations(channel);
    };
  }, []);

  useEffect(() => {
    if (marketplaceModalOpen || incomingOrdersModalOpen) {
      loadMyNegotiations();
    }
  }, [marketplaceModalOpen, incomingOrdersModalOpen]);

  const loadMyNegotiations = async () => {
    if (!salesId) return;
    setLoadingNego(true);
    const { data, error } = await store.fetchNegotiations();
    if (error) {
      console.error('Fetch Nego Error:', error);
    }
    const allNego = data || [];
    const filtered = allNego.filter(n => String(n.sales_id) === String(salesId));
    setMyNegotiations(filtered);
    setLoadingNego(false);
  };

  const handleProcessNego = async (nego: any) => {
    // 1. Update status to processed in DB
    await store.updateNegotiationStatus(nego.id, 'processed');
    
    // 2. Refresh local list
    loadMyNegotiations();

    // 3. Find all other pending negotiations for the same customer to group them in the message
    const otherItems = myNegotiations.filter(n => n.customer_wa === nego.customer_wa && n.status === 'pending');
    const productList = otherItems.map(item => `- ${item.products?.name || 'Produk'} (${item.requested_qty} ${item.products?.unit || ''})`).join('\n');

    // 4. Open WhatsApp with formatted number
    let phone = nego.customer_wa || '';
    // Format 08... to 628...
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    const message = encodeURIComponent(
      `Hallo ka ${nego.customer_name}, Saya ${salesName} dari *PT. Industri Keluarga Timur*, saya mau konfirmasi untuk orderannya item sebagai berikut:\n\n${productList}\n\nApakah pesanannya sudah sesuai ?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const recentActs = activities
    .filter(a => a.id_sales === salesId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const handleShareMarketplace = async () => {
    const shareUrl = `${window.location.origin}/catalog?ref=${salesId}`;
    const shareData = {
      title: 'IKT Marketplace',
      text: `Halo! Cek produk IKT terbaru di katalog saya. Hubungi saya langsung untuk penawaran terbaik!`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link katalog personal Anda berhasil disalin!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const uncontactedProspekCount = prospek.filter(p => 
    p.sales_owner === salesId && 
    !activities.some(act => act.target_id === p.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  const uncontactedCustomerCount = customers.filter(c => 
    c.sales_pic === salesId && 
    !activities.some(act => act.target_id === c.id && (act.tipe_aksi === 'WA' || act.tipe_aksi === 'Call'))
  ).length;

  const { totalActual: totalActualPoints, breakdown } = calculateSalesPoints(
    salesId,
    activities,
    prospek,
    systemTargets,
    'month'
  );

  const totalSO = breakdown?.order || 0;
  const totalVisit = (breakdown?.visitProspek || 0) + (breakdown?.visitCustomer || 0);
  const totalMyCustomer = customers.filter(c => c.sales_pic === salesId).length;
  const totalMyProspek = prospek.filter(p => p.sales_owner === salesId).length;

  return (
    <div style={{ paddingBottom: '0' }}>
      
      {/* Wallet Style Hero */}
      <div className="wallet-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              className="tap-active"
              onClick={() => navigate('/mobile/profile')}
              style={{ 
                width: '44px', height: '44px', borderRadius: '50%', 
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                overflow: 'hidden'
              }}
            >
              <img 
                src={(user as any)?.foto_profil || currentSales?.foto_profil || `https://ui-avatars.com/api/?name=${user?.nama || 'Sales'}&background=f1f5f9&color=64748b&bold=true`} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
               <div style={{ fontSize: '14px', color: '#111827', opacity: 0.9 }}>Halo,</div>
               <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
                 {salesDisplayName}
               </h2>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="tap-active" 
              onClick={() => setNotificationsModalOpen(true)}
              style={{ 
                width: '40px', height: '40px', borderRadius: '12px', 
                background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
              }}
            >
              <Bell size={22} color="#111827" strokeWidth={2.5} />
              <span style={{ position: 'absolute', top: '8px', right: '10px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid var(--brand-yellow)' }}></span>
            </button>

            <button 
              className="tap-active" 
              onClick={() => (window as any).toggleSidebar?.() || setSidebarOpen?.(true)}
              style={{ 
                width: '40px', height: '40px', borderRadius: '12px', 
                background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Menu size={22} color="#111827" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="wallet-balance-label">POIN BULAN INI</div>
        <div className="wallet-balance-value">
          {totalActualPoints.toLocaleString('id-ID')}
          <span style={{ fontSize: '20px', color: '#111827', opacity: 0.8 }}>★</span>
        </div>


      </div>

      {/* Overlapping Stats Card */}
      <div className="wallet-overlap-card">
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>Sales Status</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>Aktif</span>
            <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>Sisa {daysRemaining} Hari</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/mobile/analytic')}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
        >
          Analisis Pribadi <ChevronRight size={14} />
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="wallet-actions-grid">
        {[
          { label: 'Activity', icon: MapPin, color: '#10B981', path: '/mobile/activity' },
          { label: 'Prospek', icon: Target, color: '#F43F5E', path: '/mobile/prospek', badge: uncontactedProspekCount },
          { label: 'Customer', icon: Users, color: '#3B82F6', path: '/mobile/customer', badge: uncontactedCustomerCount },
          { label: 'Chat', icon: MessageSquare, color: '#F59E0B', path: '/mobile/chat' },
          { label: 'Ranking', icon: Trophy, color: '#8B5CF6', path: '/mobile/rank' },
          { label: 'Order', icon: ShoppingCart, color: '#14B8A6', path: '/mobile/order-history' },
          { label: 'Market', icon: ShoppingBag, color: '#F97316', action: () => setMarketplaceModalOpen(true), badge: myNegotiations.filter(n => n.status === 'pending').length },
          { label: 'Analytic', icon: BarChart3, color: '#6366F1', path: '/mobile/analytic' },
        ].map((item) => (
          <div key={item.label} 
            className="wallet-action-item tap-active" 
            onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  navigate(item.path);
                }
            }}
          >
            <div className="wallet-action-circle" style={{ position: 'relative' }}>
              <item.icon size={22} color={item.color} strokeWidth={2.5} />
              {item.badge !== undefined && item.badge > 0 && (
                <div style={{ 
                  position: 'absolute', top: '0', right: '0', background: '#EF4444', color: '#fff', 
                  fontSize: '9px', fontWeight: 900, minWidth: '16px', height: '16px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff'
                }}>
                  {item.badge}
                </div>
              )}
            </div>
            <span className="wallet-action-lbl">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      {/* Horizontal Stats Slider */}
      <div style={{ margin: '0 0 24px 0', padding: '0 20px' }}>
         <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }} className="hide-scrollbar">
            <div style={{ minWidth: '140px', background: '#EF4444', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #DC2626' }}>
               <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Order</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{totalSO}</div>
            </div>
            <div style={{ minWidth: '140px', background: '#FFCC00', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #EAB308' }}>
               <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Visit</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>{totalVisit}</div>
            </div>
            <div style={{ minWidth: '140px', background: '#22C55E', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #16A34A' }}>
               <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Customer</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{totalMyCustomer}</div>
            </div>
            <div style={{ minWidth: '140px', background: '#3B82F6', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #2563EB' }}>
               <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Prospek</div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{totalMyProspek}</div>
            </div>
         </div>
      </div>

      <div className="wallet-recent-section">
         <div className="wallet-recent-header">
           <div className="wallet-recent-title">Log Aktivitas</div>
           <div className="wallet-recent-seeall tap-active" onClick={() => navigate('/mobile/activity')}>Lihat Semua</div>
         </div>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {recentActs.map(act => (
             <div key={act.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Clock size={20} color="#10B981" />
                </div>
                <div style={{ flex: 1, borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>{act.tipe_aksi}</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>+5 Pts</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, margin: 0 }}>
                        {act.catatan_hasil.length > 30 ? act.catatan_hasil.substring(0, 30) + '...' : act.catatan_hasil}
                      </p>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                        {act.timestamp ? (() => {
                          try { return formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }); }
                          catch(e) { return 'Baru saja'; }
                        })() : 'Baru saja'}
                      </span>
                   </div>
                </div>
             </div>
           ))}
         </div>
      </div>

      {/* Marketplace Selector Drawer */}
      {marketplaceModalOpen && (
        <div className="modal-overlay" onClick={() => setMarketplaceModalOpen(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ 
            borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
            padding: '24px 20px calc(40px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' 
          }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#f0f9ff', color: '#0ea5e9', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={20} strokeWidth={3} />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#111827', letterSpacing: '-0.5px' }}>Marketplace IKT</h3>
              </div>
              <button className="tap-active" onClick={() => setMarketplaceModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <button 
                 className="tap-active"
                 onClick={() => { setMarketplaceModalOpen(false); navigate(`/catalog?ref=${user?.id}`); }}
                 style={{ width: '100%', padding: '20px', borderRadius: '24px', border: '2px solid #f8fafc', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', transition: 'all 0.2s' }}
               >
                 <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><ShoppingBag size={24} /></div>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 900, fontSize: '15px', color: '#111827' }}>Buka Katalog</div>
                   <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Lihat semua produk IKT sekarang</div>
                 </div>
                 <ChevronRight size={18} color="#cbd5e1" />
               </button>

               <button 
                 className="tap-active"
                 onClick={() => { setMarketplaceModalOpen(false); handleShareMarketplace(); }}
                 style={{ width: '100%', padding: '20px', borderRadius: '24px', border: '2px solid #f8fafc', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', transition: 'all 0.2s' }}
               >
                 <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fff', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><Share size={24} /></div>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 900, fontSize: '15px', color: '#111827' }}>Bagikan Link Sales</div>
                   <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Kirim link personal ke konsumen</div>
                 </div>
                 <ChevronRight size={18} color="#cbd5e1" />
               </button>

               <button 
                  className="tap-active"
                  onClick={() => { setMarketplaceModalOpen(false); setIncomingOrdersModalOpen(true); }}
                  style={{ width: '100%', padding: '20px', borderRadius: '24px', border: '2px solid #f8fafc', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fff', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><List size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: '15px', color: '#111827' }}>Pesanan Masuk</div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{myNegotiations.filter(n => n.status === 'pending').length} Pesanan baru butuh proses</div>
                  </div>
                  {myNegotiations.filter(n => n.status === 'pending').length > 0 && (
                    <div style={{ background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '10px' }}>
                      {myNegotiations.filter(n => n.status === 'pending').length}
                    </div>
                  )}
                  <ChevronRight size={18} color="#cbd5e1" />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {notificationsModalOpen && (
        <div className="modal-overlay" onClick={() => setNotificationsModalOpen(false)}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>🔔 Notifikasi</h3>
              <button className="tap-active" onClick={() => setNotificationsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800 }}>Update Sistem</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tampilan baru telah aktif!</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Orders Drawer */}
      {incomingOrdersModalOpen && (
        <div className="modal-overlay" onClick={() => setIncomingOrdersModalOpen(false)} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className="modal-card animate-fade-up" onClick={e => e.stopPropagation()} style={{ 
            maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
            padding: '24px 20px calc(40px + env(safe-area-inset-bottom))', background: '#fff', border: 'none' 
          }}>
            <div style={{ width: '40px', height: '5px', background: '#e2e8f0', borderRadius: '10px', margin: '-10px auto 20px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#FFFBEB', color: '#f59e0b', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <List size={20} strokeWidth={3} />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#111827', letterSpacing: '-0.5px' }}>Pesanan Marketplace</h3>
              </div>
              <button className="tap-active" onClick={() => setIncomingOrdersModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px' }}><X size={20} /></button>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#F1F5F9', padding: '6px', borderRadius: '16px' }}>
              <button 
                className="tap-active"
                onClick={() => setNegoTab('pending')}
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 900,
                  background: negoTab === 'pending' ? '#fff' : 'transparent',
                  color: negoTab === 'pending' ? '#111827' : '#64748b',
                  boxShadow: negoTab === 'pending' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Perlu Diproses ({myNegotiations.filter(n => n.status === 'pending').length})
              </button>
              <button 
                className="tap-active"
                onClick={() => setNegoTab('processed')}
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 900,
                  background: negoTab === 'processed' ? '#fff' : 'transparent',
                  color: negoTab === 'processed' ? '#111827' : '#64748b',
                  boxShadow: negoTab === 'processed' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Sudah Diproses ({myNegotiations.filter(n => n.status === 'processed').length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loadingNego ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
              ) : myNegotiations.filter(n => n.status === negoTab).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>Belum ada data</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Semua pesanan di tab ini kosong.</div>
                </div>
              ) : (
                myNegotiations.filter(n => n.status === negoTab).map(nego => (
                  <div key={nego.id} style={{ background: '#F8FAFC', borderRadius: '24px', padding: '20px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>{new Date(nego.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span style={{ 
                        fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px',
                        background: nego.status === 'pending' ? '#FFFBEB' : '#F0FDF4',
                        color: nego.status === 'pending' ? '#F59E0B' : '#10B981'
                      }}>{nego.status === 'pending' ? 'BELUM DIPROSES' : 'TERPROSES'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff', overflow: 'hidden', border: '1px solid #eee' }}>
                        <img src={nego.products?.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 950, color: '#111827' }}>{nego.customer_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{nego.products?.name} • {nego.requested_qty} Kg</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em' }}>OFFERED PRICE</div>
                        <div style={{ fontSize: '15px', fontWeight: 950, color: '#111827' }}>Rp {nego.offered_price?.toLocaleString('id-ID')}</div>
                      </div>
                      
                      {nego.status === 'pending' && (
                        <button 
                          className="tap-active"
                          onClick={() => handleProcessNego(nego)}
                          style={{ 
                            background: 'var(--gojek-green)', color: '#111827', border: 'none',
                            padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 950,
                            boxShadow: '0 4px 12px rgba(255, 204, 0, 0.3)'
                          }}
                        >
                          PROSES
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
