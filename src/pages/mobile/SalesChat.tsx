import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Search, Users, Camera, CheckCircle2 } from 'lucide-react';
import { chatStore } from '../../store/chatStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { ChatMessage, ChatContact } from '../../types';

interface Props { salesId: string; }

export default function SalesChat({ salesId }: Props) {
  const navigate = useNavigate();
  const { sales } = useSalesData();
  const currentUser = sales.find(s => s.id === salesId);
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Contacts
  useEffect(() => {
    chatStore.loadContacts().then(c => {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const activeContact = contacts.find(c => c.id === activeChatId);
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render Chat List
  if (!activeChatId) {
    return (
      <div className="page-content" style={{ background: '#fff', minHeight: '100vh', padding: '0' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/mobile/home')} style={{ background: 'none', border: 'none', padding: 0 }}><ArrowLeft size={24} /></button>
          <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Live Chat</h2>
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
            <div key={c.id} onClick={() => setActiveChatId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
               <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: c.type === 'group' ? '#e0e7ff' : '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.type === 'group' ? '#6366f1' : '#0ea5e9', fontWeight: 800 }}>
                 {c.type === 'group' ? <Users size={24} /> : c.name.charAt(0)}
               </div>
               <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                   <span style={{ fontWeight: 800, fontSize: '15px' }}>{c.name}</span>
                   <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.lastMessageTime}</span>
                 </div>
                 <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
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
      <div style={{ background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
        <button onClick={() => setActiveChatId(null)} style={{ background: 'none', border: 'none', padding: 0 }}><ArrowLeft size={24} /></button>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: activeContact?.type === 'group' ? '#e0e7ff' : '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeContact?.type === 'group' ? '#6366f1' : '#0ea5e9', fontSize: '16px', fontWeight: 800 }}>
          {activeContact?.type === 'group' ? <Users size={20} /> : activeContact?.name.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800 }}>{activeContact?.name}</div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Online</div>
        </div>
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
                {activeContact?.type === 'group' && !isMe && (
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
      <div style={{ background: '#fff', padding: '12px 16px 30px', borderTop: '1px solid #e2e8f0' }}>
        {attachment && (
          <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
            <img src={attachment} alt="Preview" style={{ height: '80px', borderRadius: '8px', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
            <button onClick={() => setAttachment(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <Camera size={20} />
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapture} />
          
          <form style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '24px', padding: '4px 6px 4px 16px' }} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input 
              placeholder="Type message..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600 }}
            />
            <button type="submit" style={{ background: 'var(--brand-yellow)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
