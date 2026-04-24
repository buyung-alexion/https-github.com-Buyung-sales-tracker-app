import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Camera, Target, LogOut, Check, User, Phone, Activity, TrendingUp, Lock, Loader2, Image as ImageIcon } from 'lucide-react';
import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { store } from '../../store/dataStore';
import { calculateSalesPoints } from '../../utils/points';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { activities, prospek = [], systemTargets = null } = useSalesData();

  const [searchParams, setSearchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const setIsEditing = (val: boolean) => {
    if (val) {
      setSearchParams({ edit: 'true' });
    } else {
      setSearchParams({});
    }
  };

  const [profilePhoto, setProfilePhoto] = useState<string | null>((user as any)?.foto_profil || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: user?.nama || '',
    no_wa: user?.no_wa || '',
    username: user?.username || '',
    password: user?.password || '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // === Accurate Stats using shared point system ===
  const pointsResult = calculateSalesPoints(user.id, activities, prospek, systemTargets, 'month');
  const achievedPoints = pointsResult.totalActual;
  const salesRating = pointsResult.rating;
  const displayRating = salesRating > 0 ? salesRating.toFixed(1) : '0';
  
  // Real visit count (monthly): Visit to prospek + Visit to customer
  const visitCount = pointsResult.breakdown.visitProspek + pointsResult.breakdown.visitCustomer;

  const handleLogout = () => {
    if(window.confirm('Yakin ingin keluar?')) {
      logout();
    }
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Create a clean payload for the update to avoid wiping credentials
      const updatePayload: any = {
        nama: formData.nama,
        no_wa: formData.no_wa,
        foto_profil: profilePhoto
      };

      // Only include password if user explicitly filled it
      if (formData.password && formData.password !== '••••••••' && formData.password !== '') {
        updatePayload.password = formData.password;
      }
      
      // Only include username if explicitly changed
      if (formData.username && formData.username !== '') {
        updatePayload.username = formData.username;
      }

      const { error } = await store.updateSales(user.id, updatePayload);
      if (error) {
        alert('Gagal menyimpan ke Database: ' + error.message);
        return;
      }
      
      updateUser({ ...formData, foto_profil: profilePhoto } as any);
      setIsEditing(false);
      alert('Profil berhasil diperbarui!');
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        const base64 = canvas.toDataURL('image/jpeg', 0.5); // 50% Quality, very small payload
        setProfilePhoto(base64);
        
        // Auto-save photo immediately or let handleSave do it
        if (!isEditing) {
          store.updateSales(user.id, { foto_profil: base64 } as any).then(({ error }) => {
            if (error) {
              alert('Gagal update foto: ' + error.message);
            } else {
              updateUser({ ...user, foto_profil: base64 } as any);
            }
          });
        }
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setFormData({
      nama: user?.nama || '',
      no_wa: user?.no_wa || '',
      username: user?.username || '',
      password: user?.password || '',
    });
    setProfilePhoto((user as any)?.foto_profil || null);
    setIsEditing(false);
  };

  return (
    <div className="page-content" style={{ paddingBottom: '120px', background: '#F9FBFC', minHeight: '100vh' }}>
      
      {/* Top Header - Premium Grab Style */}
      <div className="yellow-bg-top" style={{ 
        height: '180px', 
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 24px 20px',
        zIndex: 50
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '10px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="tap-active" 
              onClick={() => navigate('/mobile/home')} 
              style={{ 
                background: 'rgba(255,255,255,0.45)', 
                border: '1px solid rgba(255,255,255,0.3)', 
                borderRadius: '16px', 
                width: '46px', height: '46px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.03)'
              }}
            >
              <ArrowLeft size={22} color="#111827" strokeWidth={3} />
            </button>
            <h2 className="hero-premium-title" style={{ fontSize: '24px', margin: 0 }}>Profil</h2>
          </div>
          <button 
            className="tap-active" 
            onClick={handleLogout}
            style={{ 
               background: '#111827', 
               color: '#fff', 
               padding: '10px 16px', 
               borderRadius: '14px', 
               fontSize: '13px', 
               fontWeight: 900, 
               display: 'flex', 
               alignItems: 'center', 
               gap: '8px',
               boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}
          >
            Logout <LogOut size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginTop: '-32px', position: 'relative', zIndex: 10 }}>
        
        {/* Profile Identity Card */}
        <div 
          className="shadow-premium animate-fade-up" 
          style={{ 
            background: '#fff', 
            borderRadius: '28px', 
            padding: '24px 20px 20px', 
            textAlign: 'center', 
            position: 'relative', 
            border: '1px solid rgba(0,0,0,0.02)'
          }}
        >
          {/* Avatar Section */}
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '38px', padding: '4px', background: 'linear-gradient(135deg, #FFCC00 0%, #F59E0B 100%)', boxShadow: '0 12px 24px rgba(245,158,11,0.2)' }}>
              <img
                src={profilePhoto || `https://ui-avatars.com/api/?name=${user.nama}&background=f1f5f9&color=64748b&bold=true`}
                alt="Avatar"
                style={{ width: '100%', height: '100%', borderRadius: '34px', objectFit: 'cover', border: '3px solid #fff' }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: '-4px', right: '-12px', display: 'flex', gap: '4px' }}>
               <button
                onClick={() => cameraInputRef.current?.click()}
                className="tap-active"
                style={{ background: '#111827', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
               >
                <Camera size={14} color="#fff" strokeWidth={3} />
               </button>
               <button
                onClick={() => fileInputRef.current?.click()}
                className="tap-active"
                style={{ background: '#F59E0B', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
               >
                <ImageIcon size={14} color="#fff" strokeWidth={3} />
               </button>
            </div>
            
            <input ref={cameraInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFileChange} />
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#111827', margin: 0, letterSpacing: '-1px' }}>{isEditing ? formData.nama : user.nama}</h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="tap-active"
                style={{ background: '#F8FAFC', border: '1.5px solid #F1F5F9', color: '#64748B', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Edit3 size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sales Team
            </div>
            <div style={{ background: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #D1FAE5' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} /> ONLINE
            </div>
          </div>

          {/* Premium Stats Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '32px 0 0', gap: '10px' }}>
            {[
              { label: 'Visits', val: visitCount, icon: Activity, color: '#10B981', bg: '#ECFDF5' },
              { label: 'Points', val: achievedPoints.toLocaleString('id-ID'), icon: Target, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Rating', val: displayRating, icon: TrendingUp, color: '#3B82F6', bg: '#EFF6FF' }
            ].map((stat, i) => (
              <div key={i} style={{ flex: 1, background: stat.bg, borderRadius: '24px', padding: '16px 8px', border: '1px solid rgba(0,0,0,0.02)' }}>
                <div style={{ color: stat.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                  <stat.icon size={20} strokeWidth={3} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 950, color: '#111827', marginBottom: '2px', letterSpacing: '-0.5px' }}>{stat.val}</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{stat.label}</div>
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
          <div className="animate-fade-up" style={{ background: '#fff', borderRadius: '28px', padding: '10px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)', animationDelay: '0.1s' }}>
            {[
              { label: 'Nama Lengkap', val: formData.nama, key: 'nama', icon: User, type: 'text', color: '#6366F1', bg: '#EEF2FF' },
              { label: 'WhatsApp', val: formData.no_wa || 'Belum diatur', key: 'no_wa', icon: Phone, type: 'tel', color: '#10B981', bg: '#ECFDF5' }
            ].map((field, i) => (
              <div key={field.key} style={{ padding: '20px 0', borderBottom: i < 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: field.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: field.color }}>
                    <field.icon size={20} strokeWidth={3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', display: 'block', letterSpacing: '0.05em' }}>{field.label}</label>
                    {isEditing ? (
                      <input 
                        type={field.type}
                        style={{ width: '100%', border: '2px solid #F1F5F9', background: '#F8FAFC', borderRadius: '14px', padding: '12px 14px', fontSize: '14px', fontWeight: 800, color: '#111827', outline: 'none' }} 
                        value={field.val === 'Belum diatur' ? '' : field.val} 
                        onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                        placeholder={field.label}
                      />
                    ) : (
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>{field.val}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '36px', marginBottom: '12px', padding: '0 4px' }}>Keamanan & Autentikasi</h3>

          {/* Group 2: Account Security */}
          <div className="animate-fade-up" style={{ background: '#fff', borderRadius: '28px', padding: '10px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)', animationDelay: '0.2s' }}>
            {[
              { label: 'Username Login', val: formData.username || 'Belum diatur', key: 'username', type: 'text', icon: User, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Keamanan Password', val: formData.password || 'Belum diatur', key: 'password', type: 'text', icon: Lock, color: '#EF4444', bg: '#FEF2F2' }
            ].map((field, i) => (
              <div key={field.key} style={{ padding: '20px 0', borderBottom: i < 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: field.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: field.color }}>
                    <field.icon size={20} strokeWidth={3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', display: 'block', letterSpacing: '0.05em' }}>{field.label}</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        style={{ width: '100%', border: '2px solid #F1F5F9', background: '#F8FAFC', borderRadius: '14px', padding: '12px 14px', fontSize: '14px', fontWeight: 800, color: '#111827', outline: 'none' }} 
                        value={field.val === 'Belum diatur' ? '' : field.val} 
                        onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                        placeholder={`Isi ${field.label}`}
                      />
                    ) : (
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', fontFamily: field.key === 'password' && field.val !== 'Belum diatur' ? 'monospace' : 'inherit', letterSpacing: field.key === 'password' ? '2px' : '-0.3px' }}>
                        {field.key === 'password' && field.val !== 'Belum diatur' ? '••••••••' : field.val}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Action Bar for Edit Mode - Replaces Nav Area */}
      {isEditing && (
        <div 
          className="animate-fade-up shadow-premium"
          style={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0,
            width: '100%',
            background: '#ffffff', 
            padding: '16px 20px calc(24px + env(safe-area-inset-bottom))', 
            borderTop: '1px solid #F1F5F9',
            display: 'flex', 
            gap: '12px', 
            zIndex: 2000, 
            boxShadow: '0 -10px 40px rgba(0,0,0,0.06)'
          }}
        >
          <button 
            className="tap-active"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{ 
              flex: 1, 
              height: '56px', 
              borderRadius: '20px', 
              background: '#F8FAFC', 
              color: '#64748B', 
              fontSize: '14px', 
              fontWeight: 900,
              border: '1.5px solid #F1F5F9'
            }}
          >
            BATAL
          </button>
          <button 
            className="tap-active"
            onClick={handleSave}
            disabled={isSubmitting}
            style={{ 
              flex: 2, 
              height: '56px', 
              borderRadius: '20px', 
              background: isSubmitting ? '#E2E8F0' : 'var(--brand-yellow)', 
              color: '#111827', 
              fontSize: '14px', 
              fontWeight: 950, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(255, 204, 0, 0.25)'
            }}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <>
                <Check size={20} strokeWidth={3} /> SIMPAN PROFIL
              </>
            )}
          </button>
        </div>
      )}
      <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.3, fontSize: '10px', fontWeight: 800, paddingBottom: '20px' }}>
        SALES TRACKER MOBILE v1.4.9 • STABLE
      </div>
    </div>
  );
}

