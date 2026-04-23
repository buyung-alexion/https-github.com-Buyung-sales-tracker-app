import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Search, Users, CheckCircle2, Smile, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { chatStore } from '../../store/chatStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { ChatMessage, ChatContact } from '../../types';

interface Props { salesId: string; }

export default function SalesChat({ salesId }: Props) {
  const navigate = useNavigate();
  const { sales } = useSalesData();
  const currentUser = sales.find(s => s.id === salesId);
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const EMOJI_LIST = ['😀','😂','😍','🙏','👍','🔥','🎉','😊','👋','😎','🙌','✨'];

  // Load Contacts
  useEffect(() => {
    chatStore.loadContacts(salesId, true).then(c => {
      // Filter out self from contacts, but keep groups and Manager
      const filtered = c.filter(contact => contact.id !== salesId);
      setContacts(filtered);
      setLoading(false);
    });
  }, [salesId]);

  // Load and Subscribe to Messages
  useEffect(() => {
    if (!activeChatId) return;

    let isMounted = true;
    chatStore.loadMessages(activeChatId).then(msgs => {
      if (isMounted) setMessages(msgs);
    });

    const unsub = chatStore.subscribeToMessages(activeChatId, (payload) => {
      if (!isMounted) return;
      if (payload.eventType === 'INSERT') {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [activeChatId]);

  // Global Subscription to all messages to update contact list (WhatsApp Style sorting)
  useEffect(() => {
    const channel = chatStore.subscribeToMessages('*', (payload) => {
      if (payload.eventType === 'INSERT') {
        // Refresh contacts to move the latest to the top
        chatStore.loadContacts(salesId, true).then(c => {
          const filtered = c.filter(contact => contact.id !== salesId);
          setContacts(filtered);
        });
      }
    });

    return () => {
      channel();
    };
  }, [salesId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectContact = (c: ChatContact) => {
    const cid = chatStore.getChatId(salesId, c.id);
    setSelectedContact(c);
    setActiveChatId(cid);
    // Mark as read immediately when selected
    chatStore.markAllAsRead(cid, salesId);
    // Update local count
    setContacts(contacts.map(con => con.id === c.id ? { ...con, unreadCount: 0 } : con));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachment) || !activeChatId) return;

    const text = inputText.trim();
    const photo = attachment;
    setInputText('');
    setAttachment(null);

    await chatStore.sendMessage({
      chat_id: activeChatId,
      sender_id: salesId,
      sender_name: currentUser?.nama || 'Sales',
      text,
      attachment: photo || undefined
    });
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > 800 ? 800 / img.width : 1;
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAttachment(canvas.toDataURL('image/jpeg', 0.6));
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render Chat List
  if (!activeChatId) {
    return (
      <div className="page-content" style={{ background: '#fff', minHeight: '100vh', padding: '0' }}>
        <div className="hero-compact" style={{ padding: 'calc(16px + env(safe-area-inset-top)) 20px 48px', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
          {/* Decorative elements */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 6 }}>
            <button onClick={() => navigate('/mobile/home')} style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}><ArrowLeft size={20} color="#111827" strokeWidth={3} /></button>
            <div>
              <h2 className="hero-premium-title" style={{ fontSize: '22px', margin: 0 }}>Live Chat</h2>
              <div className="hero-premium-subtitle">Sales Communication & Support</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '12px', padding: '10px 16px', gap: '10px' }}>
            <Search size={18} color="#64748b" />
            <input 
              placeholder="Search contact..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '14px', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading chats...</div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No contacts found.</div>
          ) : filteredContacts.map(c => (
            <div key={c.id} onClick={() => handleSelectContact(c)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', position: 'relative' }}>
               <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: c.type === 'group' ? '#e0e7ff' : (c.id === 'Manager-1' ? '#FFFBEB' : '#E0F2FE'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.type === 'group' ? '#6366f1' : (c.id === 'Manager-1' ? '#F59E0B' : '#0ea5e9'), fontWeight: 800, position: 'relative', overflow: 'hidden' }}>
                 {c.type === 'group' ? <Users size={24} /> : (c.avatar ? <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name.charAt(0))}
                 {c.unreadCount > 0 && (
                   <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#EF4444', color: '#fff', fontSize: '10px', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', fontWeight: 900 }}>
                     {c.unreadCount}
                   </div>
                 )}
               </div>
               <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                   <span style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>{c.name}</span>
                   <span style={{ fontSize: '11px', color: c.unreadCount > 0 ? '#EF4444' : '#94a3b8', fontWeight: c.unreadCount > 0 ? 800 : 500 }}>{c.lastMessageTime}</span>
                 </div>
                 <div style={{ fontSize: '13px', color: c.unreadCount > 0 ? '#111827' : '#64748b', fontWeight: c.unreadCount > 0 ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                   {c.lastMessage}
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Active Conversation
  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0, background: '#f0f2f5' }}>
      {/* Header */}
       <div className="hero-compact" style={{ background: 'var(--brand-yellow)', padding: 'calc(10px + env(safe-area-inset-top)) 20px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', zIndex: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <button onClick={() => { setActiveChatId(null); setSelectedContact(null); }} style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}><ArrowLeft size={18} color="#111827" strokeWidth={3} /></button>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedContact?.type === 'group' ? '#6366f1' : (selectedContact?.id === 'Manager-1' ? '#F59E0B' : '#0ea5e9'), fontSize: '16px', fontWeight: 800, overflow: 'hidden' }}>
          {selectedContact?.type === 'group' ? <Users size={20} /> : (selectedContact?.avatar ? <img src={selectedContact.avatar} alt={selectedContact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedContact?.name.charAt(0))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>{selectedContact?.name}</div>
          <div style={{ fontSize: '11px', color: '#111827', opacity: 0.6, fontWeight: 700 }}>{selectedContact?.type === 'group' ? `${contacts.length} Members` : 'Online'}</div>
        </div>
        {selectedContact?.type === 'group' && (
          <button 
            onClick={() => setShowInviteModal(true)}
            style={{ background: '#111827', border: 'none', padding: '6px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 900, color: '#FFCC00', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Users size={14} /> INVITE
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map(m => {
          const isMe = m.sender_id === salesId;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                background: isMe ? 'var(--brand-yellow)' : '#fff', 
                color: '#111827',
                padding: '10px 14px', 
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                maxWidth: '80%',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                position: 'relative'
              }}>
                {selectedContact?.type === 'group' && !isMe && (
                   <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 800, marginBottom: '2px' }}>{m.sender_name}</div>
                )}
                {m.attachment && (
                  <img src={m.attachment} alt="Attachment" style={{ width: '100%', borderRadius: '8px', marginBottom: m.text ? '8px' : '0' }} />
                )}
                {m.text && <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: '1.4' }}>{m.text}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                   <span style={{ fontSize: '9px', opacity: 0.6 }}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   {isMe && <CheckCircle2 size={10} style={{ opacity: 0.6 }} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

       {/* Input Area */}
      <div style={{ background: '#fff', padding: '12px 16px 30px', borderTop: '1px solid #e2e8f0', position: 'relative' }}>
        {showEmojiPicker && (
          <div style={{ position: 'absolute', bottom: '100%', left: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', width: '220px', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', zIndex: 50, marginBottom: '10px' }}>
            {EMOJI_LIST.map(e => (
              <span key={e} style={{ cursor: 'pointer', fontSize: '22px' }} onClick={() => { setInputText(prev => prev + e); setShowEmojiPicker(false); }}>{e}</span>
            ))}
          </div>
        )}

        {attachment && (
          <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
            <img src={attachment} alt="Preview" style={{ height: '80px', borderRadius: '8px', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
            <button onClick={() => setAttachment(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={12} />
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', color: '#64748b', padding: '4px' }}>
              <Smile size={24} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#64748b', padding: '4px' }}>
              <Paperclip size={22} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#64748b', padding: '4px' }}>
              <ImageIcon size={22} />
            </button>
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapture} />
          
          <form style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '24px', padding: '4px 6px 4px 16px', border: '1px solid #e2e8f0' }} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input 
              placeholder="Ketik pesan..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, color: '#111827' }}
            />
            <button type="submit" style={{ background: 'var(--brand-yellow)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', boxShadow: '0 4px 10px rgba(255, 193, 7, 0.3)' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>


      {/* Invite Member Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <div className="animate-fade-up" style={{ background: '#fff', width: '100%', borderRadius: '32px 32px 0 0', padding: '24px 20px calc(30px + env(safe-area-inset-bottom))', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: '40px', height: '6px', background: '#f1f5f9', borderRadius: '4px', margin: '0 auto 20px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 950, margin: 0 }}>Undang ke Grup</h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', color: '#64748b', fontWeight: 900 }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contacts.filter(c => c.type === 'direct' && c.id !== 'Manager-1').map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {c.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: '15px' }}>{c.name}</div>
                  <button 
                    onClick={() => { alert(`Anggota ${c.name} telah diundang.`); setShowInviteModal(false); }}
                    style={{ background: 'var(--brand-yellow)', border: 'none', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 900 }}
                  >
                    UNDANG
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
