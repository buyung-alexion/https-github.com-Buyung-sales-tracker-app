import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Camera, Target, 
  LogOut, Check, User, Phone, Activity, TrendingUp, Lock
} from 'lucide-react';
import { useSalesData, useCurrentSales } from '../../hooks/useSalesData';
import { store } from '../../store/dataStore';

export default function Profile() {
  const navigate = useNavigate();
  const { currentSalesId, setSales, salesData } = useCurrentSales();
  const { activities } = useSalesData();

  const [searchParams, setSearchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const setIsEditing = (val: boolean) => {
    if (val) {
      setSearchParams({ edit: 'true' });
    } else {
      setSearchParams({});
    }
  };

  const [profilePhoto, setProfilePhoto] = useState<string | null>((salesData as any)?.foto_profil || null);
  const [formData, setFormData] = useState({
    nama: salesData?.nama || '',
    no_wa: salesData?.no_wa || '',
    username: salesData?.username || '',
    password: salesData?.password || '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!salesData) return null;

  // Actual Stats
  const actCount = activities.filter(a => a.id_sales === currentSalesId).length;
  // A rough estimate of total points achieved (Prospek + Closing + FollowUp + Visit)
  const achievedPoints = activities.filter(a => a.id_sales === currentSalesId && ['Visit', 'Call', 'WA'].includes(a.tipe_aksi)).length * 5 
    + (activities.filter(a => a.id_sales === currentSalesId && a.catatan_hasil.toLowerCase().includes('closing')).length * 50);

  const handleLogout = () => {
    setSales('');
    navigate('/mobile');
  };

  const handleSave = async () => {
    await store.updateSales(salesData.id, { ...formData, foto_profil: profilePhoto } as any);
    setIsEditing(false);
  };

  const handleCaptureProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > 400 ? 400 / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        setProfilePhoto(base64);
        // Auto-save photo immediately
        store.updateSales(salesData.id, { foto_profil: base64 } as any);
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };



  const handleCancel = () => {
    setFormData({
      nama: salesData?.nama || '',
      no_wa: salesData?.no_wa || '',
      username: salesData?.username || '',
      password: salesData?.password || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="page-content" style={{ paddingBottom: '120px', background: '#F9FBFC', minHeight: '100vh' }}>
      
      {/* Top Header - Premium Brand Theme */}
      <div style={{ 
        padding: '36px 24px 56px', 
        background: 'var(--brand-yellow)', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background highlights */}
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', filter: 'blur(30px)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 5 }}>
          <button 
            className="tap-active" 
            onClick={() => navigate('/mobile/home')} 
            style={{ 
              background: 'rgba(255,255,255,0.4)', 
              border: '2px solid rgba(255,255,255,0.6)', 
              borderRadius: '16px', 
              width: '46px', height: '46px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={3} />
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 950, color: '#111827', margin: 0, letterSpacing: '-1px' }}>Profil Saya</h2>
          <button 
            className="tap-active" 
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Keluar <LogOut size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginTop: '-32px', position: 'relative', zIndex: 10 }}>
        
        {/* Profile Identity Card */}
        <div 
          className="shadow-premium animate-fade-up" 
          style={{ 
            background: '#fff', 
            borderRadius: '32px', 
            padding: '32px 20px 24px', 
            textAlign: 'center', 
            position: 'relative', 
            border: '1px solid rgba(0,0,0,0.02)'
          }}
        >
          {/* Avatar Section */}
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '38px', padding: '4px', background: 'linear-gradient(135deg, #FFCC00 0%, #F59E0B 100%)', boxShadow: '0 12px 24px rgba(245,158,11,0.2)' }}>
              <img
                src={profilePhoto || `https://ui-avatars.com/api/?name=${salesData.nama}&background=random`}
                alt="Avatar"
                style={{ width: '100%', height: '100%', borderRadius: '34px', objectFit: 'cover', border: '3px solid #fff' }}
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="tap-active"
              style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#111827', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              <Camera size={16} color="#fff" strokeWidth={3} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleCaptureProfilePhoto} />
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.8px' }}>{salesData.nama}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sales Manager
            </div>
            <div style={{ background: '#ECFDF5', color: '#10B981', fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} /> ACTIVE
            </div>
          </div>

          {/* Premium Stats Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '32px 0 0', gap: '12px' }}>
            {[
              { label: 'Aktivitas', val: actCount, icon: Activity, color: '#10B981' },
              { label: 'Poin', val: achievedPoints, icon: Target, color: '#F59E0B' },
              { label: 'Rating', val: '5.0', icon: TrendingUp, color: '#3B82F6' }
            ].map((stat, i) => (
              <div key={i} style={{ flex: 1, background: '#F8FAFC', borderRadius: '20px', padding: '16px 10px', border: '1px solid #F1F5F9' }}>
                <div style={{ color: stat.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: '#111827', marginBottom: '2px' }}>{stat.val}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Content Section */}
        <div style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Pengaturan Akun</h3>
          </div>

          {/* Group 1: Personal Info */}
          <div className="animate-fade-up" style={{ background: '#fff', borderRadius: '28px', padding: '8px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', animationDelay: '0.1s' }}>
            {[
              { label: 'Nama Lengkap', val: formData.nama, key: 'nama', icon: User, type: 'text', color: '#3B82F6', bg: '#EFF6FF' },
              { label: 'WhatsApp', val: formData.no_wa || 'Belum diatur', key: 'no_wa', icon: Phone, type: 'tel', color: '#10B981', bg: '#ECFDF5' }
            ].map((field, i) => (
              <div key={field.key} style={{ padding: '18px 0', borderBottom: i < 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: field.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: field.color }}>
                    <field.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>{field.label}</label>
                    {isEditing ? (
                      <input 
                        type={field.type}
                        style={{ width: '100%', border: '1.5px solid #F1F5F9', background: '#F8FAFC', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 800, color: '#111827' }} 
                        value={field.val === 'Belum diatur' ? '' : field.val} 
                        onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                        placeholder={field.label}
                      />
                    ) : (
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{field.val}</div>
                    )}
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="tap-active"
                      style={{ background: 'none', border: 'none', color: '#CBD5E1', padding: '8px' }}
                    >
                      <Edit3 size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '36px', marginBottom: '12px', padding: '0 4px' }}>Keamanan & Autentikasi</h3>

          {/* Group 2: Account Security */}
          <div className="animate-fade-up" style={{ background: '#fff', borderRadius: '28px', padding: '8px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', animationDelay: '0.2s' }}>
            {[
              { label: 'Username Login', val: formData.username || 'Belum diatur', key: 'username', type: 'text', icon: User, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Password', val: formData.password || 'Belum diatur', key: 'password', type: 'text', icon: Lock, color: '#EF4444', bg: '#FEF2F2' }
            ].map((field, i) => (
              <div key={field.key} style={{ padding: '18px 0', borderBottom: i < 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: field.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: field.color }}>
                    <field.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>{field.label}</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        style={{ width: '100%', border: '1.5px solid #F1F5F9', background: '#F8FAFC', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 800, color: '#111827' }} 
                        value={field.val === 'Belum diatur' ? '' : field.val} 
                        onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                        placeholder={`Isi ${field.label}`}
                      />
                    ) : (
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', fontFamily: field.key === 'password' && field.val !== 'Belum diatur' ? 'monospace' : 'inherit' }}>
                        {field.key === 'password' && field.val !== 'Belum diatur' ? '••••••••' : field.val}
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="tap-active"
                      style={{ background: 'none', border: 'none', color: '#CBD5E1', padding: '8px' }}
                    >
                      <Edit3 size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Action Bar for Edit Mode - Replaces Nav Area */}
      {isEditing && (
        <div 
          className="animate-fade-up"
          style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            background: '#ffffff', 
            padding: '16px 24px calc(16px + env(safe-area-inset-bottom))', 
            borderTop: '2px solid #F1F5F9',
            display: 'flex', 
            gap: '12px', 
            zIndex: 2000, 
            boxShadow: '0 -8px 30px rgba(0,0,0,0.08)'
          }}
        >
          <button 
            className="tap-active"
            onClick={handleCancel}
            style={{ 
              flex: 1, 
              height: '54px', 
              borderRadius: '20px', 
              background: '#F8FAFC', 
              color: '#64748B', 
              fontSize: '15px', 
              fontWeight: 800,
              border: '1.5px solid #F1F5F9'
            }}
          >
            Batal
          </button>
          <button 
            className="tap-active"
            onClick={handleSave}
            style={{ 
              flex: 2, 
              height: '54px', 
              borderRadius: '20px', 
              background: 'var(--brand-yellow)', 
              color: '#111827', 
              fontSize: '15px', 
              fontWeight: 950, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              boxShadow: '0 8px 24px rgba(255, 204, 0, 0.4)'
            }}
          >
            <Check size={20} strokeWidth={3} /> Simpan Perubahan
          </button>
        </div>
      )}
    </div>
  );
}
