import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Info, Star, Archive, Trash2, Clock, MoreVertical, CheckSquare, Square, RefreshCcw, User, ChevronLeft, ChevronRight, ArrowLeft, Send, Edit3, Navigation } from 'lucide-react';
import { useSalesData } from '../../hooks/useSalesData';
import { formatDistanceToNow } from 'date-fns';

type TabType = 'primary' | 'update';

type Message = {
  id: number;
  tab: TabType;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  details?: {
    nama?: string;
    kategori?: string;
    alamat?: string;
    noHp?: string;
    catatan?: string;
    fullText?: React.ReactNode;
  };
};


export default function ManagerInbox() {
  const { activities, prospek, customers, sales } = useSalesData();
  const [activeTab, setActiveTab] = useState<TabType>('primary');
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Layout View State: 'inbox' | 'compose' | 'sent'
  const [activeView, setActiveView] = useState<'inbox' | 'compose' | 'sent'>('inbox');
  
  // Compose State
  const [composeTo, setComposeTo] = useState('Semua Sales');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);
  const ITEMS_PER_PAGE = 8; 

  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Convert Live Activities to Inbox Messages
  const messages: Message[] = useMemo(() => {
    // 1. Primary: Reports from Activities
    const reports = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)
      .map((act, index) => {
        const salesName = sales.find(s => s.id === act.id_sales)?.nama || 'Sales';
        const target = act.target_type === 'prospek' 
          ? prospek.find(p => p.id === act.target_id)
          : customers.find(c => c.id === act.target_id);

        let subject = `${act.tipe_aksi} Report`;
        if (act.tipe_aksi === 'Order') subject = `📦 Pesanan Baru: ${act.target_nama}`;
        if (act.tipe_aksi === 'Visit') subject = `📍 Kunjungan: ${act.target_nama}`;
        if (act.tipe_aksi === 'Note') subject = `📝 Catatan: ${act.target_nama}`;

        return {
          id: index + 1000,
          tab: 'primary' as TabType,
          sender: salesName,
          subject,
          snippet: act.catatan_hasil,
          date: formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }),
          isRead: false,
          isStarred: act.tipe_aksi === 'Order',
          isArchived: false,
          details: {
            nama: act.target_nama,
            kategori: (target as any)?.kategori || '-',
            alamat: (target as any)?.area || '-',
            noHp: (target as any)?.no_wa || '-',
            catatan: act.catatan_hasil,
          }
        };
      });

    // 2. Updates: System messages
    const systemUpdates: Message[] = [
      {
        id: 1,
        tab: 'update',
        sender: 'System Admin',
        subject: '🚀 Dashboard v4.0 is Live!',
        snippet: 'Aesthetics improved with GrabFood style and real-time Chat sync.',
        date: 'Just Now',
        isRead: false,
        isStarred: true,
        isArchived: false,
        details: {
          fullText: (
            <div>
              <p style={{marginBottom: '16px', fontSize: '16px'}}><strong>Update Fitur Dashboard versi 4.0 telah Live! 🚀</strong></p>
              <ul style={{marginLeft: '24px', marginBottom: '24px', lineHeight: '1.8'}}>
                <li><strong>Gaya GrabFood:</strong> Layout header di HP lebih ramping dan premium.</li>
                <li><strong>Chat Sync:</strong> Sinkronisasi pesan antara Manager & Sales sudah real-time.</li>
                <li><strong>Data Inbox:</strong> Sekarang Inbox menampilkan aktivitas tim secara langsung!</li>
              </ul>
              <p>Selamat bekerja dan sukses hari ini!</p>
            </div>
          )
        }
      }
    ];

    return [...reports, ...systemUpdates];
  }, [activities, sales, prospek, customers]);

  useEffect(() => {
    // Lift title to ManagerShell top nav
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { 
        title: 'Info Tim', 
        sub: 'Pantau aktivitas real-time & kirim instruksi' 
      } 
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  const filteredMessages = messages.filter(m => m.tab === activeTab && !m.isArchived);
  
  const unreadPrimary = messages.filter(m => m.tab === 'primary' && !m.isRead && !m.isArchived).length;
  const unreadUpdate = messages.filter(m => m.tab === 'update' && !m.isRead && !m.isArchived).length;

  const toggleStar = (id: number) => {
     console.log('Toggling star for:', id);
  };

  const markAsRead = (id: number) => {
    console.log('Marking as read:', id);
  };

  const handleArchive = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Archiving:', id);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Deleting:', id);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleMarkAllRead = () => {
    setShowMoreMenu(false);
  };

  const handleOpenMessage = (id: number) => {
    markAsRead(id);
    setActiveMessageId(id);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if(!composeSubject || !composeBody) return;
    
    const newSentMsg = {
      id: Date.now(),
      to: composeTo,
      subject: composeSubject,
      snippet: composeBody.length > 50 ? composeBody.substring(0, 50) + '...' : composeBody,
      body: composeBody,
      date: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    
    setSentMessages([newSentMsg, ...sentMessages]);
    setComposeTo('Semua Sales');
    setComposeSubject('');
    setComposeBody('');
    setActiveView('sent');
  };

  const activeMessage = activeMessageId !== null ? messages.find(m => m.id === activeMessageId) : null;

  return (
    <div className="mgr-page" style={{ padding: '0 32px 32px 32px', height: '100%', display: 'flex', flexDirection: 'row', gap: '24px' }}>
      
      {/* LEFT INNER SIDEBAR */}
      <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '16px' }}>
        <button 
          onClick={() => { setActiveView('compose'); setActiveMessageId(null); }}
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#c2e7ff', color: '#001d35', border: 'none', padding: '16px 24px', borderRadius: '16px', fontWeight: 500, fontSize: '15px', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'}
        >
          <Edit3 size={20} />
          Tulis Pesan
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '-16px' }}>
          <button 
            onClick={() => { setActiveView('inbox'); setActiveMessageId(null); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 10px 32px', borderRadius: '0 50px 50px 0', border: 'none', cursor: 'pointer', background: activeView === 'inbox' ? '#d3e3fd' : 'transparent', color: activeView === 'inbox' ? '#041e49' : '#444746', fontWeight: activeView === 'inbox' ? 700 : 500 }}
            onMouseOver={e => !activeView.includes('inbox') && (e.currentTarget.style.background = '#e2e8f0')}
            onMouseOut={e => !activeView.includes('inbox') && (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <Mail size={18} />
               Inbox
            </div>
            {(unreadPrimary + unreadUpdate) > 0 && <span style={{ fontWeight: 700, fontSize: '13px' }}>{unreadPrimary + unreadUpdate}</span>}
          </button>
          
          <button 
            onClick={() => { setActiveView('sent'); setActiveMessageId(null); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 10px 32px', borderRadius: '0 50px 50px 0', border: 'none', cursor: 'pointer', background: activeView === 'sent' ? '#d3e3fd' : 'transparent', color: activeView === 'sent' ? '#041e49' : '#444746', fontWeight: activeView === 'sent' ? 700 : 500 }}
            onMouseOver={e => !activeView.includes('sent') && (e.currentTarget.style.background = '#e2e8f0')}
            onMouseOut={e => !activeView.includes('sent') && (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <Navigation size={18} />
               Terkirim
            </div>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {activeView === 'compose' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ background: '#e0f2fe', color: '#0ea5e9', padding: '8px', borderRadius: '8px' }}><Edit3 size={20} /></div>
               <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Pesan Baru</h2>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Kirim pesan atau broadcast instruksi per area</div>
               </div>
            </div>
            <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                 <span style={{ width: '100px', fontWeight: 500, color: '#64748b' }}>Kepada:</span>
                 <select 
                   value={composeTo} 
                   onChange={e => setComposeTo(e.target.value)}
                   style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#0f172a', fontWeight: 500, cursor: 'pointer', background: 'transparent' }}
                 >
                   <option value="Semua Sales">Semua Tim Sales</option>
                   {sales.map(s => (
                     <option key={s.id} value={s.nama}>{s.nama}</option>
                   ))}
                 </select>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                 <span style={{ width: '100px', fontWeight: 500, color: '#64748b' }}>Subjek:</span>
                 <input 
                   type="text" 
                   value={composeSubject}
                   onChange={e => setComposeSubject(e.target.value)}
                   placeholder="Contoh: Arahan Push Sell Produk XYZ" 
                   required
                   style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#0f172a' }}
                 />
               </div>
               <textarea 
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Tulis pesan lengkap di sini..."
                  required
                  style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '15px', color: '#334155', lineHeight: '1.6' }}
               />
               <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                 <button type="submit" style={{ background: '#0ea5e9', color: 'white', padding: '12px 32px', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' }}><Send size={18} /> Kirim Pesan</button>
               </div>
            </form>
          </div>
        ) : activeView === 'sent' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
               <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '16px', paddingLeft: '8px' }}>Pesan Terkirim</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {sentMessages.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                  <Navigation size={48} opacity={0.2} style={{ margin: '0 auto 16px auto' }}/>
                  Pesan terkirim masih kosong.
                </div>
              ) : (
                sentMessages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                     <div style={{ width: '150px', fontWeight: 500, color: '#0f172a', fontSize: '14px' }}>Ke: {msg.to}</div>
                     <div style={{ flex: 1, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#475569' }}>{msg.subject}</span>
                        <span style={{ color: '#64748b' }}>- {msg.snippet}</span>
                     </div>
                     <div style={{ minWidth: '100px', textAlign: 'right', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>{msg.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeMessage ? (
          <>
            {/* Detail View Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
               <button onClick={() => setActiveMessageId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748b', padding: '8px', borderRadius: '50%' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Kembali ke Inbox">
                 <ArrowLeft size={18} />
               </button>
               <button onClick={(e) => { handleArchive(activeMessage.id, e); setActiveMessageId(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748b', padding: '8px', borderRadius: '50%' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Arsipkan">
                 <Archive size={16} />
               </button>
               <button onClick={(e) => { handleDelete(activeMessage.id, e); setActiveMessageId(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748b', padding: '8px', borderRadius: '50%' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} title="Hapus">
                 <Trash2 size={16} />
               </button>
            </div>
            
            {/* Email Content Detail */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
               <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '24px' }}>{activeMessage.subject}</h2>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                 <div style={{ display: 'flex', gap: '12px' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                     <User size={20} />
                   </div>
                   <div>
                     <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>
                       {activeMessage.sender} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '13px', marginLeft: '4px' }}>&lt;{activeMessage.sender.toLowerCase().replace(' ', '')}@salestracker.app&gt;</span>
                     </div>
                     <div style={{ fontSize: '13px', color: '#64748b' }}>Kepada saya</div>
                   </div>
                 </div>
                 <div style={{ fontSize: '13px', color: '#64748b' }}>{activeMessage.date}</div>
               </div>
               
               <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                 {activeMessage.details && activeMessage.details.fullText ? (
                   activeMessage.details.fullText
                 ) : activeMessage.details && activeMessage.details.nama ? (
                   <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
                     <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>Detail Informasi:</h3>
                     <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ padding: '10px 0', width: '150px', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Nama Instansi/Toko</td>
                           <td style={{ padding: '10px 0', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>: {activeMessage.details.nama}</td>
                         </tr>
                         <tr>
                           <td style={{ padding: '10px 0', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Kategori</td>
                           <td style={{ padding: '10px 0', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>: {activeMessage.details.kategori}</td>
                         </tr>
                         <tr>
                           <td style={{ padding: '10px 0', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Alamat</td>
                           <td style={{ padding: '10px 0', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>: {activeMessage.details.alamat}</td>
                         </tr>
                         <tr>
                           <td style={{ padding: '10px 0', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>No. HP Owner</td>
                           <td style={{ padding: '10px 0', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>: <a href={`tel:${activeMessage.details.noHp}`} style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 500 }}>{activeMessage.details.noHp}</a></td>
                         </tr>
                         <tr>
                           <td style={{ padding: '10px 0', fontWeight: 500, color: '#64748b', verticalAlign: 'top' }}>Catatan Sales</td>
                           <td style={{ padding: '10px 0', color: '#334155', fontStyle: 'italic' }}>: "{activeMessage.details.catatan}"</td>
                         </tr>
                       </tbody>
                     </table>
                     <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button style={{ background: '#0ea5e9', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Lihat Data Utuh</button>
                        <button style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Jadwalkan Follow up</button>
                     </div>
                   </div>
                 ) : (
                   <p>{activeMessage.snippet}</p>
                 )}
               </div>
            </div>
          </>
        ) : (
          <>
        {/* INBOX TOOLBAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b' }}>
             <button onClick={() => setSelectAll(!selectAll)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748b' }}>
               {selectAll ? <CheckSquare size={18} /> : <Square size={18} />}
             </button>
             <button onClick={handleRefresh} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748b' }} title="Refresh (Reset Mock)">
               <RefreshCcw size={16} />
             </button>
             <div style={{ position: 'relative' }}>
               <button onClick={() => setShowMoreMenu(!showMoreMenu)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748b' }} title="More">
                 <MoreVertical size={16} />
               </button>
               {showMoreMenu && (
                 <div style={{ position: 'absolute', top: '24px', left: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '4px', zIndex: 50, minWidth: '160px' }}>
                   <button onClick={handleMarkAllRead} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#475569', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                     Tandai Semua Dibaca
                   </button>
                 </div>
               )}
             </div>
          </div>
          
          {/* Pagination Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
               {viewAll ? `1-${filteredMessages.length} of ${filteredMessages.length}` : `${filteredMessages.length > 0 ? Math.min(1 + (page - 1) * ITEMS_PER_PAGE, filteredMessages.length) : 0}-${Math.min(page * ITEMS_PER_PAGE, filteredMessages.length)} of ${filteredMessages.length}`}
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                disabled={page === 1 || viewAll} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ background: 'none', border: 'none', cursor: (page === 1 || viewAll) ? 'default' : 'pointer', opacity: (page === 1 || viewAll) ? 0.3 : 1, color: '#64748b' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={(page * ITEMS_PER_PAGE) >= filteredMessages.length || viewAll} 
                onClick={() => setPage(p => p + 1)}
                style={{ background: 'none', border: 'none', cursor: ((page * ITEMS_PER_PAGE) >= filteredMessages.length || viewAll) ? 'default' : 'pointer', opacity: ((page * ITEMS_PER_PAGE) >= filteredMessages.length || viewAll) ? 0.3 : 1, color: '#64748b' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            <button 
              onClick={() => { setViewAll(!viewAll); setPage(1); }}
              style={{ fontSize: '13px', fontWeight: 600, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {viewAll ? 'Tampilkan Sebagian' : 'View All'}
            </button>
          </div>
        </div>

        {/* GMAIL SUB TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {/* Primary Tab */}
          <button 
            onClick={() => setActiveTab('primary')}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              padding: '16px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              borderBottom: activeTab === 'primary' ? '3px solid #ef4444' : '3px solid transparent',
              color: activeTab === 'primary' ? '#dc2626' : '#64748b',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
          >
            <Mail size={18} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Primary</div>
            </div>
            {unreadPrimary > 0 && (
              <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                {unreadPrimary} baru
              </span>
            )}
          </button>

          {/* Update Tab */}
          <button 
            onClick={() => setActiveTab('update')}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              padding: '16px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              borderBottom: activeTab === 'update' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'update' ? '#2563eb' : '#64748b',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
          >
            <Info size={18} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Updates</div>
            </div>
            {unreadUpdate > 0 && (
              <span style={{ background: '#dbeafe', color: '#3b82f6', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                {unreadUpdate} baru
              </span>
            )}
          </button>
        </div>

        {/* MESSAGES LIST */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff' }}>
          {filteredMessages.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
               <div style={{ marginBottom: '16px' }}><Archive size={48} opacity={0.2} style={{ margin: '0 auto' }}/></div>
               Keren! Semua pesan di folder ini sudah arsip atau kosong.
            </div>
          ) : (
            (viewAll ? filteredMessages : filteredMessages.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)).map((msg) => (
              <div 
                key={msg.id}
                onMouseEnter={() => setHoveredRow(msg.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => handleOpenMessage(msg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  background: msg.isRead ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  boxShadow: hoveredRow === msg.id ? 'inset 1px 0 0 #cbd5e1, inset -1px 0 0 #cbd5e1, 0 1px 4px rgba(0,0,0,0.05)' : 'none',
                  zIndex: hoveredRow === msg.id ? 10 : 1,
                  position: 'relative',
                  minHeight: '44px'
                }}
              >
                {/* Checkbox & Star */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '60px', color: '#94a3b8' }}>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}>
                    {selectAll ? <CheckSquare size={18} color="#64748b"/> : <Square size={18} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleStar(msg.id); }} 
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star size={18} fill={msg.isStarred ? '#facc15' : 'transparent'} color={msg.isStarred ? '#facc15' : '#cbd5e1'} />
                  </button>
                </div>

                {/* Sender */}
                <div style={{ width: '150px', fontWeight: msg.isRead ? 500 : 700, color: msg.isRead ? '#64748b' : '#0f172a', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {msg.sender}
                </div>

                {/* Subject & Snippet */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px', gap: '8px' }}>
                  <span style={{ fontWeight: msg.isRead ? 500 : 700, color: msg.isRead ? '#475569' : '#0f172a' }}>{msg.subject}</span>
                  <span style={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>- {msg.snippet}</span>
                </div>

                {/* Date & Hover Actions */}
                <div style={{ minWidth: '120px', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                  {hoveredRow === msg.id ? (
                    <div style={{ display: 'flex', gap: '8px', color: '#64748b', background: msg.isRead ? '#f8fafc' : '#ffffff', paddingLeft: '8px' }}>
                      <button onClick={(e) => handleArchive(msg.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = 'none'} title="Arsipkan"><Archive size={16} /></button>
                      <button onClick={(e) => handleDelete(msg.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = 'none'} title="Hapus"><Trash2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); markAsRead(msg.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = 'none'} title="Tandai Dibaca"><Mail size={16} /></button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = 'none'} title="Tunda"><Clock size={16} /></button>
                    </div>
                  ) : (
                    <span style={{ fontWeight: msg.isRead ? 500 : 700, color: msg.isRead ? '#64748b' : '#0f172a', fontSize: '13px' }}>
                      {msg.date}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
          </>
        )}
        
      </div>
    </div>
  );
}
