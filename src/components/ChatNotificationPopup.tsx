import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface Props {
  newMsg: any;
  onClear: () => void;
  onClick: (msg: any) => void;
}

export default function ChatNotificationPopup({ newMsg, onClear, onClick }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (newMsg) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClear, 500); // Wait for animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newMsg, onClear]);

  if (!newMsg && !visible) return null;

  return (
    <div 
      className={`chat-notif-popup ${visible ? 'show' : 'hide'}`}
      onClick={() => onClick(newMsg)}
      style={{
        position: 'fixed',
        top: 'calc(20px + env(safe-area-inset-top))',
        left: '20px',
        right: '20px',
        background: '#fff',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10000,
        cursor: 'pointer',
        border: '1px solid #f1f5f9',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
        transform: visible ? 'translateY(0)' : 'translateY(-100px)',
        opacity: visible ? 1 : 0
      }}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--brand-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <MessageCircle size={22} color="#111827" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827', marginBottom: '2px' }}>{newMsg?.sender_name || 'Pesan Baru'}</div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {newMsg?.text || '📷 Mengirim foto...'}
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onClear, 500); }}
        style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <X size={14} color="#64748B" strokeWidth={3} />
      </button>
    </div>
  );
}
