import React, { useState, useEffect } from 'react';
import { Camera, Save, User, Key, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ManagerSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    nama: user?.nama || 'Unknown',
    username: user?.username || 'user',
    role: user?.role || 'Manager',
    phone: user?.no_wa || '',
    avatar: user?.foto_profil || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.nama}`,
    password: ''
  });

  const isSuperAdmin = (profile.role || '').toLowerCase().includes('admin');

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: 'Pengaturan Profil', sub: 'Kelola informasi diri, kredensial login, dan keamanan akun Anda.' } }));
    return () => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    window.alert('Profil berhasil diperbarui!');
    setProfile(prev => ({ ...prev, password: '' }));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
    background: '#fff', color: '#0f172a', marginTop: '6px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 700, color: '#475569', marginTop: '20px'
  };


  return (
    <div className="mgr-page" style={{ position: 'relative', marginTop: '24px' }}>

      {/* ─── SECTION: CONTENT ─── */}
      <div style={{ marginBottom: '40px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'flex-start' }}>
          {/* Avatar Card */}
          <div className="content-card" style={{ padding: '32px', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <img src={profile.avatar} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f8fafc', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />
              <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--brand-yellow)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(250, 204, 21, 0.4)' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                <Camera size={18} color="#111827" />
              </label>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{profile.nama}</h2>
            <span style={{ background: '#fef08a', color: '#a16207', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>{profile.role}</span>
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #e2e8f0', width: '100%', textAlign: 'left' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> @{profile.username}</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color={isSuperAdmin ? "#b45309" : "#0369a1"} />
                <span style={{ fontWeight: 800, color: isSuperAdmin ? '#b45309' : '#0369a1' }}>
                  {isSuperAdmin ? 'Pemegang Kuasa Penuh (Super Admin)' : 'Akses Terbatas (Dasbor Manajer)'}
                </span>
              </p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="content-card" style={{ padding: '32px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', margin: 0 }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Informasi Pribadi</h3>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Perbarui data diri dan kredensial login Anda di sini.</p>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Nama Lengkap</label>
                  <input type="text" style={inputStyle} value={profile.nama} onChange={e => setProfile({ ...profile, nama: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Nomor Handphone</label>
                  <input type="text" style={inputStyle} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Key size={18} /> Ganti Password</h4>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Kosongkan jika tidak ingin mengubah password.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Username Login</label>
                    <input type="text" style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} value={profile.username} disabled />
                  </div>
                  <div>
                    <label style={labelStyle}>Password Baru</label>
                    <input type="password" style={inputStyle} placeholder="Ketik kata sandi baru..." value={profile.password} onChange={e => setProfile({ ...profile, password: e.target.value })} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                <button type="submit" style={{ background: 'var(--brand-yellow)', color: '#111827', padding: '14px 28px', fontSize: '14px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(250, 204, 21, 0.3)' }}>
                  <Save size={18} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
