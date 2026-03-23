import React from 'react';
import { Settings } from 'lucide-react';

export default function ManagerSettings() {
  return (
    <div className="mgr-page">
      <div className="mgr-page-header" style={{ alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <h1 className="mgr-title">Pengaturan Sistem</h1>
          <p className="mgr-sub">Konfigurasi preferensi manajer</p>
        </div>
      </div>
      
      <div className="content-card" style={{ padding: '32px', textAlign: 'center', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)', borderRadius: '24px' }}>
        <Settings size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Konfigurasi Umum</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Pengaturan global akan tampil di sini.</p>
      </div>
    </div>
  );
}
