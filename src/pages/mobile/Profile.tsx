import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Camera, CheckSquare, Target, Settings, LogOut, Check } from 'lucide-react';
import { useSalesData, useCurrentSales } from '../../hooks/useSalesData';
import { store } from '../../store/dataStore';
import type { Armada } from '../../types';

export default function Profile() {
  const navigate = useNavigate();
  const { currentSalesId, setSales, salesData } = useCurrentSales();
  const { activities } = useSalesData();

  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>((salesData as any)?.foto_profil || null);
  const [formData, setFormData] = useState({
    nama: salesData?.nama || '',
    no_wa: salesData?.no_wa || '',
    armada: salesData?.armada || 'A',
    target_prospek_baru: salesData?.target_prospek_baru || 0,
    target_closing_baru: salesData?.target_closing_baru || 0,
    target_maintenance: salesData?.target_maintenance || 0,
    target_visit: salesData?.target_visit || 0,
  });

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="page-content" style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#fff' }}>
        <button onClick={() => navigate('/mobile/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginLeft: '-8px' }}>
          <ArrowLeft size={24} color="#111827" />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Profile</h2>
        <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
      </div>

      <div style={{ padding: '0 20px', marginTop: '10px' }}>
        
        {/* Profile Info Card */}
        <div style={{ background: '#fff', borderRadius: '30px', padding: '30px 20px 20px', textAlign: 'center', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          
          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleCaptureProfilePhoto} />

          <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 16px' }}>
            <img
              src={profilePhoto || `https://ui-avatars.com/api/?name=${salesData.nama}&background=random`}
              alt="Avatar"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, background: '#111827', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', cursor: 'pointer' }}
            >
              <Camera size={14} color="#fff" />
            </div>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{salesData.nama}</h3>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, margin: 0 }}>Sales Armada {salesData.armada}</p>

          {/* Points / Rank Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0 0', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><CheckSquare size={20} color="#10B981" /></div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>Aktivitas</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>{actCount}</div>
            </div>
            <div style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', padding: '0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><Target size={20} color="var(--brand-yellow)" /></div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>Poin</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>{achievedPoints}</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><Settings size={20} color="#3B82F6" /></div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>Rating</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>5.0</div>
            </div>
          </div>
        </div>

        {/* Settings Form or List */}
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Pengaturan</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <button onClick={handleSave} style={{ background: '#10B981', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, padding: '6px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <Check size={14} /> Simpan
              </button>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '24px', padding: '10px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            
            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Nama Sales</label>
                {isEditing ? (
                  <input style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: 600 }} value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                ) : (
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{salesData.nama}</div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Nomor WhatsApp Anda</label>
                {isEditing ? (
                  <input placeholder="628..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: 600 }} value={formData.no_wa} onChange={e => setFormData({...formData, no_wa: e.target.value})} />
                ) : (
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{salesData.no_wa || 'Belum diatur'}</div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Role Armada</label>
                {isEditing ? (
                  <select style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: 600 }} value={formData.armada} onChange={e => setFormData({...formData, armada: e.target.value as Armada})}>
                    <option value="A">Armada A (Motor)</option>
                    <option value="B">Armada B (Moko)</option>
                    <option value="C">Armada C (Mobil)</option>
                  </select>
                ) : (
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Armada {salesData.armada}</div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Target Prospek Bulanan</label>
                {isEditing ? (
                  <input type="number" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: 600 }} value={formData.target_prospek_baru} onChange={e => setFormData({...formData, target_prospek_baru: parseInt(e.target.value) || 0})} />
                ) : (
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{salesData.target_prospek_baru} Prospek</div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Target Closing Bulanan</label>
                {isEditing ? (
                  <input type="number" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: 600 }} value={formData.target_closing_baru} onChange={e => setFormData({...formData, target_closing_baru: parseInt(e.target.value) || 0})} />
                ) : (
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{salesData.target_closing_baru} Closing</div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Target Visit Bulanan</label>
                {isEditing ? (
                  <input type="number" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '14px', fontWeight: 600 }} value={formData.target_visit} onChange={e => setFormData({...formData, target_visit: parseInt(e.target.value) || 0})} />
                ) : (
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{salesData.target_visit} Visit</div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} style={{ width: '100%', marginTop: '30px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', fontSize: '15px', fontWeight: 800, padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

    </div>
  );
}
