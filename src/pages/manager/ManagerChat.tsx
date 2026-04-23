import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Send, Paperclip, Smile, CheckSquare, MessageCircle, Users, X } from 'lucide-react';
import { chatStore } from '../../store/chatStore';
import type { ChatMessage, ChatContact } from '../../types';

export default function ManagerChat() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [inputText, setInputText] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const EMOJI_LIST = ['😀','😂','😍','🙏','👍','🔥','🎉','😊','👋','😎'];

  const handleSelectContact = (c: ChatContact) => {
    const cid = chatStore.getChatId('Manager-1', c.id);
    setSelectedContact(c);
    setActiveChatId(cid);
  };

  useEffect(() => {
    // Hide title from ManagerShell top nav to save space as requested
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    }, 50);
    
    // Load dynamic contacts from backend
    chatStore.loadContacts('Manager-1').then(c => {
      setContacts(c);
      if (c.length > 0) {
        handleSelectContact(c[0]);
      }
    });

    return () => {
      clearTimeout(timer);
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  // Fetch and Subscribe to DB Real-Time for Active Chat Messages
  useEffect(() => {
    if (!activeChatId) return;

    let isMounted = true;
    
    // Initial Load
    chatStore.loadMessages(activeChatId).then(msgs => {
      if (isMounted) setActiveMessages(msgs);
    });

    // Subscribing to messages in the current active chat
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

  // Global Subscription to all messages to update contact list (WhatsApp Style sorting)
  useEffect(() => {
    const channel = chatStore.subscribeToMessages('*', (payload) => {
      if (payload.eventType === 'INSERT') {
        // Refresh contacts to move the latest to the top
        chatStore.loadContacts('Manager-1').then(c => {
          setContacts(c);
        });
      }
    });

    return () => {
      channel();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom whenever active messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const activeContact = selectedContact;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if((!inputText.trim() && !attachmentBase64) || !activeChatId) return;

    const payloadText = inputText.trim();
    const currentAttachment = attachmentBase64;
    setInputText('');
    setAttachmentBase64(null);
    
    // Inject sent message optimistically to Database
    const sentMsg = await chatStore.sendMessage({
      chat_id: activeChatId,
      sender_id: 'Manager-1', // Default Manager Role representation
      sender_name: 'Anda',
      text: payloadText,
      attachment: currentAttachment || undefined
    });

    if (sentMsg) {
      setActiveMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    }
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setAttachmentBase64(canvas.toDataURL('image/jpeg', 0.6));
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let h = d.getHours().toString().padStart(2, '0');
    let m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pesan atau kontak..." 
              style={{ border: 'none', outline: 'none', width: '100%', marginLeft: '8px', fontSize: '14px', color: '#0f172a' }}
            />
          </div>
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredContacts.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => handleSelectContact(contact)}
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
            {/* Chat Header Portaled to Topbar */}
            {document.getElementById('mgr-topbar-center') && createPortal(
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingLeft: '8px' }}>
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
              </div>,
              document.getElementById('mgr-topbar-center')!
            )}

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
                        {msg.attachment && (
                          <div style={{ marginBottom: msg.text ? '8px' : '0' }}>
                            <img src={msg.attachment} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }} onClick={() => window.open(msg.attachment, '_blank')} />
                          </div>
                        )}
                        {msg.text && (
                          <span style={{ fontSize: '15px', color: '#0f172a', lineHeight: '1.4', wordBreak: 'break-word' }}>{msg.text}</span>
                        )}
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
            <div style={{ padding: '16px 24px', background: '#f0f2f5', borderTop: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column' }}>
              
              {/* Attachment Preview Box */}
              {attachmentBase64 && (
                <div style={{ paddingBottom: '12px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={attachmentBase64} alt="Preview" style={{ height: '80px', borderRadius: '8px', border: '2px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                    <button 
                      onClick={() => setAttachmentBase64(null)}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#111827', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <Smile size={24} color="#64748b" />
                  </button>
                  {showEmojiPicker && (
                    <div style={{ position: 'absolute', bottom: '100%', left: '0', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', width: '220px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, marginBottom: '16px' }}>
                      {EMOJI_LIST.map(e => (
                        <span key={e} style={{ cursor: 'pointer', fontSize: '24px', transition: 'transform 0.1s' }} onClick={() => { setInputText(prev => prev + e); setShowEmojiPicker(false); }}>{e}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <Paperclip size={24} color="#64748b" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleCapturePhoto} 
                />
                <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '24px', padding: '8px 16px', border: 'none' }}>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Ketik pesan..." 
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px' }}
                  />
                  <button type="submit" disabled={!inputText.trim() && !attachmentBase64} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: (inputText.trim() || attachmentBase64) ? '#0ea5e9' : '#94a3b8', padding: 0 }}>
                    <Send size={20} />
                  </button>
                </form>
              </div>
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
