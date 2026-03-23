import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, User, CheckSquare, MessageCircle, Users } from 'lucide-react';
import { chatStore } from '../../store/chatStore';
import type { ChatMessage } from '../../types';

type ChatContact = {
  id: string;
  name: string;
  type: 'group' | 'direct';
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
};

const MOCK_CONTACTS: ChatContact[] = [
  { id: 'g1', name: 'Grup Sales Balikpapan', type: 'group', lastMessage: 'Burhan: Siap pak, meluncur.', lastMessageTime: '10:45', unreadCount: 2 },
  { id: 'g2', name: 'Grup Pengumuman Pusat', type: 'group', lastMessage: 'System: Maintenance selesai', lastMessageTime: 'Kemarin', unreadCount: 0 },
  { id: 'u1', name: 'Burhan', type: 'direct', lastMessage: 'Toko Budi tutup hari ini pak', lastMessageTime: '10:30', unreadCount: 1, online: true },
  { id: 'u2', name: 'Erlan', type: 'direct', lastMessage: 'Sip', lastMessageTime: '09:15', unreadCount: 0, online: false },
  { id: 'u3', name: 'Pepin', type: 'direct', lastMessage: 'File laporan attachment', lastMessageTime: 'Senin', unreadCount: 0, online: true },
];

export default function ManagerChat() {
  const [activeChatId, setActiveChatId] = useState<string | null>('u1');
  const [inputText, setInputText] = useState('');
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lift title to ManagerShell top nav
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: 'Live Chat', sub: 'Komunikasi Real-Time Tim Sales' } }));
    }, 50);
    return () => {
      clearTimeout(timer);
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  // Fetch and Subscribe to DB Real-Time
  useEffect(() => {
    if (!activeChatId) return;

    let isMounted = true;
    
    // Initial Load
    chatStore.loadMessages(activeChatId).then(msgs => {
      if (isMounted) setActiveMessages(msgs);
    });

    // Subscribing
    const unsub = chatStore.subscribeToMessages(activeChatId, (payload) => {
      if (!isMounted) return;
      if (payload.eventType === 'INSERT') {
        setActiveMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
      } else if (payload.eventType === 'UPDATE') {
        setActiveMessages(prev => prev.map(m => m.id === payload.new.id ? (payload.new as ChatMessage) : m));
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [activeChatId]);

  useEffect(() => {
    // Scroll to bottom whenever active messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const activeContact = MOCK_CONTACTS.find(c => c.id === activeChatId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!inputText.trim() || !activeChatId) return;

    const payloadText = inputText.trim();
    setInputText('');
    
    // Inject sent message optimistically to Database
    const sentMsg = await chatStore.sendMessage({
      chat_id: activeChatId,
      sender_id: 'Manager-1', // Default Manager Role representation
      sender_name: 'Anda',
      text: payloadText,
    });

    if (sentMsg) {
      setActiveMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let h = d.getHours().toString().padStart(2, '0');
    let m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="mgr-page" style={{ padding: '0 32px 32px 32px', height: '100%', display: 'flex', flexDirection: 'row', gap: '24px' }}>
      
      {/* LEFT CHAT SIDEBAR */}
      <div style={{ width: '320px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Search Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Cari pesan atau kontak..." 
              style={{ border: 'none', outline: 'none', width: '100%', marginLeft: '8px', fontSize: '14px', color: '#0f172a' }}
            />
          </div>
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {MOCK_CONTACTS.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => setActiveChatId(contact.id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '16px', 
                borderBottom: '1px solid #f1f5f9', 
                cursor: 'pointer',
                background: activeChatId === contact.id ? '#f1f5f9' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ position: 'relative', marginRight: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: contact.type === 'group' ? '#e0e7ff' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: contact.type === 'group' ? '#6366f1' : '#0ea5e9', fontSize: '20px', fontWeight: 600 }}>
                  {contact.type === 'group' ? <Users size={24}/> : (contact.avatar ? <img src={contact.avatar} style={{width:'100%', borderRadius:'50%'}}/> : contact.name.charAt(0))}
                </div>
                {contact.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', border: '2px solid #ffffff' }} />}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</span>
                  <span style={{ fontSize: '12px', color: activeChatId === contact.id ? '#0ea5e9' : '#94a3b8', fontWeight: activeChatId === contact.id || contact.unreadCount > 0 ? 600 : 400 }}>{contact.lastMessageTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: contact.unreadCount > 0 ? '#334155' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: contact.unreadCount > 0 ? 500 : 400 }}>{contact.lastMessage}</span>
                  {contact.unreadCount > 0 && (
                    <span style={{ background: '#0ea5e9', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, marginLeft: '8px' }}>
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={{ flex: 1, background: '#f0f2f5', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: activeContact.type === 'group' ? '#e0e7ff' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeContact.type === 'group' ? '#6366f1' : '#0ea5e9', fontSize: '16px', fontWeight: 600 }}>
                  {activeContact.type === 'group' ? <Users size={20}/> : (activeContact.avatar ? <img src={activeContact.avatar} style={{width:'100%', borderRadius:'50%'}}/> : activeContact.name.charAt(0))}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{activeContact.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    {activeContact.type === 'group' ? '3 Anggota, Anda' : (activeContact.online ? 'Online' : 'Terakhir dilihat hari ini')}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', color: '#64748b' }}>
                <Search size={20} style={{ cursor: 'pointer' }}/>
                <Phone size={20} style={{ cursor: 'pointer' }}/>
                <Video size={20} style={{ cursor: 'pointer' }}/>
                <MoreVertical size={20} style={{ cursor: 'pointer' }}/>
              </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundSize: '200px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                   <span style={{ background: '#e2e8f0', color: '#475569', fontSize: '12px', padding: '6px 12px', borderRadius: '16px' }}>HARI INI</span>
                </div>
                
                {activeMessages.map(msg => {
                  const isMe = msg.sender_id === 'Manager-1';
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                      <div style={{ 
                        background: isMe ? '#dcf8c6' : '#ffffff', 
                        padding: '8px 12px 8px 16px', 
                        borderRadius: isMe ? '12px 0px 12px 12px' : '0px 12px 12px 12px', 
                        maxWidth: '70%', 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        position: 'relative'
                      }}>
                        {activeContact.type === 'group' && !isMe && (
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0ea5e9', marginBottom: '2px' }}>{msg.sender_name}</div>
                        )}
                        <span style={{ fontSize: '15px', color: '#0f172a', lineHeight: '1.4' }}>{msg.text}</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatTime(msg.timestamp)}</span>
                          {isMe && (
                            <span style={{ color: msg.status === 'read' ? '#3b82f6' : '#94a3b8' }}>
                              <CheckSquare size={14} /> {/* Placeholder for double check mark */}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Footer / Input */}
            <div style={{ padding: '16px 24px', background: '#f0f2f5', display: 'flex', alignItems: 'center', gap: '16px' }}>
               <Smile size={24} color="#64748b" style={{ cursor: 'pointer' }} />
               <Paperclip size={24} color="#64748b" style={{ cursor: 'pointer' }} />
               <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '24px', padding: '8px 16px', border: 'none' }}>
                 <input 
                   type="text" 
                   value={inputText}
                   onChange={e => setInputText(e.target.value)}
                   placeholder="Ketik pesan..." 
                   style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px' }}
                 />
                 <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: inputText ? '#0ea5e9' : '#94a3b8', padding: 0 }}>
                   <Send size={20} />
                 </button>
               </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
               <MessageCircle size={48} color="#cbd5e1" />
            </div>
            <h2 style={{ fontSize: '24px', color: '#475569', fontWeight: 500, margin: 0 }}>Sales Tracker Web</h2>
            <p style={{ marginTop: '8px' }}>Kirim dan terima pesan tanpa perlu menyimpan ponsel Anda tetap online.</p>
          </div>
        )}
      </div>
    </div>
  );
}
