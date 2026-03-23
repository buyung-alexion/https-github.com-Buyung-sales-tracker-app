import React, { useState } from 'react';
import { Shield, Users, Target } from 'lucide-react';

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<'role' | 'team' | 'target'>('role');

  const tabs = [
    { id: 'role', label: 'Role Team', icon: <Shield size={16} /> },
    { id: 'team', label: 'Team Management', icon: <Users size={16} /> },
    { id: 'target', label: 'Target', icon: <Target size={16} /> },
  ];

  return (
    <div className="mgr-page">
      <div className="mgr-page-header" style={{ alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <h1 className="mgr-title">Data Management</h1>
          <p className="mgr-sub">Kelola Struktur Tim, Role, Hak Akses dan Bobot Target</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 20px',
              borderRadius: '24px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--brand-yellow)' : '#e2e8f0',
              color: activeTab === tab.id ? '#111827' : '#64748b',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab.id ? '0 4px 14px rgba(250, 204, 21, 0.4)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      <div className="content-card" style={{ padding: '32px', minHeight: '300px', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)', borderRadius: '24px' }}>
        {activeTab === 'role' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Role Team</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Berisi Nama Team, Role dan Akses.</p>
          </div>
        )}
        {activeTab === 'team' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Team Management</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Berisi Nama dan Setting Target masing-masing.</p>
          </div>
        )}
        {activeTab === 'target' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Target Settings</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Berisi konfigurasi Target Metrik dan Bobot Poin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
