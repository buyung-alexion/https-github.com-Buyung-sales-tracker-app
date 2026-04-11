import React, { useState, useEffect } from 'react';
import { Shield, Users, Target, Edit2, Trash2, X, Plus, MapPin, TrendingUp, CheckSquare, ShoppingCart, MessageSquare, Award, Save } from 'lucide-react';
import { store } from '../../store/dataStore';
import { supabase } from '../../lib/supabase';

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<'role' | 'team' | 'target'>('role');
  const [data, setData] = useState({ roles: [] as any[], teams: [] as any[], targets: {} as any });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const roles = await store.fetchRoles();
      const { data: sales } = await supabase.from('sales').select('*');
      let targets = await store.fetchSystemTargets();
      if (!targets) {
        targets = { 
          ind_poin: 150, 
          b_visit: 5, 
          b_prospek: 5, 
          b_closing: 20, 
          b_order: 20, 
          b_chat: 5 
        };
      }

      setData({
        roles: roles,
        teams: (sales || []).map((s:any) => ({ 
          id: s.id, 
          nama: s.nama, 
          username: s.username, 
          pass: s.password, 
          role: s.role,
          foto_profil: s.foto_profil,
          no_wa: s.no_wa,
          target_visit: s.target_visit
        })),
        targets: {
          indPoin: targets.ind_poin || 150,
          bVisit: targets.b_visit || 5,
          bProspek: targets.b_prospek || 5,
          bClosing: targets.b_closing || 20,
          bOrder: targets.b_order || 5,
          bChat: targets.b_chat || 1
        }
      });
      setIsLoading(false);
    };
    loadData();

    window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: 'Data Management', sub: 'Kelola Struktur Tim, Role Akun, Kredensial Login, dan Bobot Target' } }));
    return () => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  const tabs = [
    { id: 'role', label: 'Role Team', icon: <Shield size={16} /> },
    { id: 'team', label: 'Team Management', icon: <Users size={16} /> },
    { id: 'target', label: 'Target', icon: <Target size={16} /> },
  ];

  // --- MODAL STATES ---
  const [roleModal, setRoleModal] = useState<{isOpen: boolean; data: any}>({isOpen: false, data: null});
  const [roleForm, setRoleForm] = useState({ role: 'Sales', akses: 'Mobile App, Limited Analytics' });

  const [teamModal, setTeamModal] = useState<{isOpen: boolean; data: any}>({isOpen: false, data: null});
  const [teamForm, setTeamForm] = useState({ 
    id: '', 
    nama: '', 
    username: '', 
    pass: '', 
    role: '', 
    foto_profil: '', 
    no_wa: ''
  });

  // --- ROLE ACTIONS ---
  const openRoleModal = (existingData?: any) => {
    if (existingData) {
      setRoleForm({ role: existingData.role, akses: existingData.akses });
      setRoleModal({ isOpen: true, data: existingData });
    } else {
      setRoleForm({ role: 'Sales', akses: 'Mobile App, Limited Analytics' });
      setRoleModal({ isOpen: true, data: null });
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roleModal.data) {
       await store.updateRole(roleModal.data.id, roleForm);
    } else {
       await store.addRole(roleForm);
    }
    setRoleModal({isOpen: false, data: null});
    const roles = await store.fetchRoles();
    setData(d => ({...d, roles}));
  };

  const handleDeleteRole = async (id: string) => {
    if (window.confirm('Hapus role ini?')) {
      await store.deleteRole(id);
      setData(d => ({ ...d, roles: d.roles.filter((r: any) => r.id !== id) }));
    }
  };

  // --- TEAM ACTIONS ---
  const openTeamModal = async (existingData?: any) => {
    if (existingData) {
      setTeamForm({
        id: existingData.id,
        nama: existingData.nama,
        username: existingData.username,
        pass: existingData.pass,
        role: existingData.role,
        foto_profil: existingData.foto_profil,
        no_wa: existingData.no_wa
      });
      setTeamModal({ isOpen: true, data: existingData });
    } else {
      const nextId = await store.generateNextSalesId();
      setTeamForm({ id: nextId, nama: '', username: '', pass: '', role: '', foto_profil: '', no_wa: '' });
      setTeamModal({ isOpen: true, data: null });
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamModal.data) {
       await store.updateSales(teamModal.data.id, {
         nama: teamForm.nama,
         username: teamForm.username,
         password: teamForm.pass,
         role: teamForm.role,
         foto_profil: teamForm.foto_profil,
         no_wa: teamForm.no_wa
       });
    } else {
       if(data.teams.some((t:any) => t.id === teamForm.id)) {
           alert('ID Karyawan sudah digunakan!');
           return;
       }
       await store.addSales({
         id: teamForm.id,
         nama: teamForm.nama,
         armada: 'A',
         username: teamForm.username,
         password: teamForm.pass,
         role: teamForm.role,
         foto_profil: teamForm.foto_profil,
         no_wa: teamForm.no_wa
       } as any);
    }
    setTeamModal({isOpen: false, data: null});
    const { data: sales } = await supabase.from('sales').select('*');
    setData(d => ({...d, teams: (sales || []).map((s:any) => ({ 
      id: s.id, 
      nama: s.nama, 
      username: s.username, 
      pass: s.password, 
      role: s.role,
      foto_profil: s.foto_profil,
      no_wa: s.no_wa
    }))}));
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Hapus kredensial tim ini?')) {
      await store.deleteSales(id);
      setData(d => ({ ...d, teams: d.teams.filter((t: any) => t.id !== id) }));
    }
  };

  const handleSaveTargets = async () => {
    setIsLoading(true);
    try {
      await store.updateSystemTargets({
        ind_poin: data.targets.indPoin,
        b_visit: data.targets.bVisit,
        b_prospek: data.targets.bProspek,
        b_closing: data.targets.bClosing,
        b_order: data.targets.bOrder,
        b_chat: data.targets.bChat
      });
      window.alert('Pengaturan Global Target & Bobot Poin telah disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan target');
    } finally {
      setIsLoading(false);
    }
  };

  // --- REUSABLE MODAL INLINE STYLES ---
  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modalStyle: React.CSSProperties = { background: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', margin: '16px 0 8px', fontSize: '13px', fontWeight: 600, color: '#475569' };

  if (isLoading) {
    return <div className="mgr-page" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Memuat master data...</div>;
  }

  return (
    <div className="mgr-page" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginTop: '24px' }}>
        
        {/* SIDEBAR TABS */}
        {/* SIDEBAR TABS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '240px', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                border: activeTab === tab.id ? 'none' : '1px solid transparent',
                background: activeTab === tab.id ? '#111827' : 'transparent',
                color: activeTab === tab.id ? '#FFCC00' : '#64748b',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                boxShadow: activeTab === tab.id ? '0 12px 24px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}
              onMouseOver={e => { if(activeTab !== tab.id) e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)'; }}
              onMouseOut={e => { if(activeTab !== tab.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '10px', 
                background: activeTab === tab.id ? 'rgba(255, 204, 0, 0.1)' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s'
              }}>
                {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 16, strokeWidth: 3 })}
              </div>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* MAIN CONTENT AREA */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* ROLE TAB */}
          {activeTab === 'role' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ 
                background: '#fff', padding: '32px', borderRadius: '32px', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Role & Hak Akses</h3>
                  <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>STRUKTUR OTORITAS TIM</p>
                </div>
                <button 
                  onClick={() => openRoleModal()} 
                  style={{ background: 'var(--brand-yellow)', color: '#111827', padding: '14px 28px', fontSize: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(250, 204, 21, 0.3)' }}
                >
                  <Plus size={18} strokeWidth={3} /> TAMBAH ROLE
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.roles.map((u: any) => (
                  <div key={u.id} style={{ 
                    background: '#fff', borderRadius: '24px', padding: '24px 32px', 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                      <div style={{ 
                        width: '56px', height: '56px', borderRadius: '18px', 
                        background: u.role === 'Admin' ? '#fee2e2' : u.role === 'Manager' ? '#fffbeb' : '#f0f9ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Shield size={24} color={u.role === 'Admin' ? '#ef4444' : u.role === 'Manager' ? '#f59e0b' : '#0ea5e9'} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>{u.role}</h4>
                          <span style={{ fontSize: '10px', fontWeight: 900, background: '#f8fafc', color: '#94a3b8', padding: '3px 10px', borderRadius: '8px', border: '1px solid #f1f5f9', textTransform: 'uppercase' }}>Active Role</span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, marginTop: '4px', maxWidth: '400px' }}>{u.akses}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => openRoleModal(u)} 
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', color: '#3b82f6', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRole(u.id)} 
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {data.roles.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px', fontWeight: 700 }}>Belum ada data role.</div>}
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ 
                background: '#fff', padding: '32px', borderRadius: '32px', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Tim & Kredensial</h3>
                  <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>KELOLA LOGIN & IDENTITAS</p>
                </div>
                <button 
                  onClick={() => openTeamModal()} 
                  style={{ background: 'var(--brand-yellow)', color: '#111827', padding: '14px 28px', fontSize: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(250, 204, 21, 0.3)' }}
                >
                  <Plus size={18} strokeWidth={3} /> TAMBAH KARYAWAN
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.teams.map((u: any) => (
                  <div key={u.id} style={{ 
                    background: '#fff', borderRadius: '24px', padding: '24px 32px', 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                      <div style={{ 
                        width: '56px', height: '56px', borderRadius: '18px', 
                        background: '#f8fafc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', fontWeight: 900, color: '#1e293b', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                        overflow: 'hidden'
                      }}>
                        {u.foto_profil ? (
                          <img src={u.foto_profil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : u.nama.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>{u.nama}</h4>
                          <span style={{ 
                            fontSize: '10px', fontWeight: 900, 
                            background: u.role === 'Admin' ? '#fee2e2' : u.role === 'Manager' ? '#fffbeb' : '#f0f9ff',
                            color: u.role === 'Admin' ? '#ef4444' : u.role === 'Manager' ? '#f59e0b' : '#0ea5e9',
                            padding: '3px 10px', borderRadius: '8px', textTransform: 'uppercase' 
                          }}>{u.role || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800 }}>ID: <span style={{ color: '#1e293b' }}>{u.id}</span></div>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800 }}>USER: <span style={{ color: '#1e293b', fontFamily: 'monospace' }}>{u.username}</span></div>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800 }}>PWD: <span style={{ color: '#cbd5e1', letterSpacing: '2px' }}>••••••</span></div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => openTeamModal(u)} 
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', color: '#3b82f6', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTeam(u.id)} 
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {data.teams.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px', fontWeight: 700 }}>Belum ada data tim.</div>}
              </div>
            </div>
          )}

          {/* TARGET TAB - ABSOLUTE VISUAL HARMONY */}
          {activeTab === 'target' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              
              {/* HEADER SECTION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Kontrol Target & KPI</h3>
                  <p style={{ color: '#64748b', fontSize: '15px', margin: '4px 0 0 0', fontWeight: 500 }}>Konfigurasi target bulanan dan pembobotan poin kinerja tim.</p>
                </div>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '10px 20px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }}></div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Mode Konfigurasi Aktif</span>
                </div>
              </div>

              {/* 1. STANDAR MINIMAL POIN (Hero Module) */}
              <div style={{ 
                background: '#fff', 
                padding: '24px 32px', 
                borderRadius: '24px', 
                border: '1px solid #e2e8f0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '32px',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}><Award size={180} color="#F59E0B" /></div>
                
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #fef9c3 0%, #fde047 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award size={28} color="#92400e" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>Standar Poin Minimal</h4>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>Target KPI</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Target wajib per sales untuk mencapai performa 100%.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="number" 
                    value={data.targets.indPoin} 
                    onChange={e => setData((d: any) => ({...d, targets: {...d.targets, indPoin: +e.target.value}}))}
                    style={{ 
                      width: '110px', 
                      height: '56px',
                      padding: '0 12px', 
                      borderRadius: '16px', 
                      border: '2px solid #f1f5f9',
                      textAlign: 'center', 
                      fontSize: '24px', 
                      fontWeight: 900, 
                      color: '#0f172a', 
                      background: '#f8fafc',
                      transition: 'all 0.2s',
                      appearance: 'textfield'
                    }}
                  />
                  <span style={{ fontWeight: 900, color: '#94a3b8', fontSize: '14px', letterSpacing: '0.05em' }}>PTS</span>
                </div>
              </div>

              {/* 2 & 3. ACTIVITY WEIGHTS MODULE (NOW PRIMARY) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* COLUMN: ACTIVITY WEIGHTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
                    <div style={{ padding: '8px', borderRadius: '10px', background: '#f5f3ff' }}><Shield size={18} color="#8b5cf6" /></div>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pengali Bobot Aktivitas</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { key: 'bVisit', label: 'Visit / Kunjungan', icon: MapPin, color: '#f59e0b', bg: '#fffbeb', desc: 'Poin visit per toko' },
                      { key: 'bProspek', label: 'New Prospek', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5', desc: 'Poin input prospek baru' },
                      { key: 'bClosing', label: 'Closing Deal', icon: CheckSquare, color: '#3b82f6', bg: '#eff6ff', desc: 'Poin konversi customer' },
                      { key: 'bOrder', label: 'Sales Order (SO)', icon: ShoppingCart, color: '#8b5cf6', bg: '#f5f3ff', desc: 'Poin per input order' },
                      { key: 'bChat', label: 'Followup (WA/Call)', icon: MessageSquare, color: '#ec4899', bg: '#fdf2f8', desc: 'Poin followup client' },
                    ].map(field => {
                      const Icon = field.icon;
                      return (
                        <div key={field.key} style={{ 
                          background: '#fff', 
                          padding: '12px 24px', 
                          borderRadius: '20px', 
                          border: '1px solid #f1f5f9', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          minHeight: '88px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: field.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={20} color={field.color} strokeWidth={2.5} />
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>{field.label}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{field.desc}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                              type="number" 
                              value={data.targets[field.key]} 
                              onChange={e => setData((d: any) => ({...d, targets: {...d.targets, [field.key]: +e.target.value}}))}
                              style={{ 
                                width: '60px', 
                                height: '42px',
                                padding: '0 10px', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0', 
                                textAlign: 'center', 
                                fontWeight: 900, 
                                color: field.color, 
                                background: '#fcfdfd',
                                appearance: 'textfield'
                              }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#cbd5e1' }}>PTS</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* FOOTER BUTTON */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                borderTop: '2px solid #f1f5f9', 
                paddingTop: '40px',
                marginTop: '16px'
              }}>
                <button 
                  onClick={handleSaveTargets} 
                  style={{ 
                    background: 'var(--brand-yellow)', 
                    color: '#111827', 
                    padding: '16px 80px', 
                    fontSize: '15px', 
                    borderRadius: '24px', 
                    border: 'none', 
                    fontWeight: 900, 
                    cursor: 'pointer', 
                    boxShadow: '0 10px 25px rgba(250,204,21,0.4)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.background = '#facc15';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'var(--brand-yellow)';
                  }}
                >
                  <Save size={20} color="#111827" strokeWidth={3} /> Simpan Perubahan Performa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      {roleModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{roleModal.data ? 'Edit Role' : 'Tambah Role Baru'}</h3>
              <button onClick={() => setRoleModal({isOpen: false, data: null})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveRole}>
              <label style={labelStyle}>Role Utama (Pilih atau Ketik Baru)</label>
              <input required list="role-options" style={inputStyle} value={roleForm.role} onChange={e => setRoleForm({...roleForm, role: e.target.value})} placeholder="Contoh: Supervisor" />
              <datalist id="role-options">
                <option value="Sales" />
                <option value="Manager" />
                <option value="Admin" />
              </datalist>

              <label style={labelStyle}>Hak Akses Dashboard (Multi-Pilih)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {['Mobile App', 'Limited Analytics', 'Full Web Dashboard', 'Live Feed', 'All System Settings', 'Database'].map(ak => {
                  const isChecked = roleForm.akses.includes(ak);
                  return (
                    <label key={ak} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          let currentArray = roleForm.akses ? roleForm.akses.split(',').map(s=>s.trim()).filter(Boolean) : [];
                          if (e.target.checked) currentArray.push(ak);
                          else currentArray = currentArray.filter(i => i !== ak);
                          setRoleForm({...roleForm, akses: currentArray.join(', ')});
                        }}
                      />
                      {ak}
                    </label>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setRoleModal({isOpen: false, data: null})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {teamModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{teamModal.data ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</h3>
              <button onClick={() => setTeamModal({isOpen: false, data: null})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTeam}>
              <label style={labelStyle}>ID Karyawan</label>
              <input required disabled={!!teamModal.data} style={{...inputStyle, background: teamModal.data ? '#f1f5f9' : '#fff' }} value={teamForm.id} onChange={e => setTeamForm({...teamForm, id: e.target.value})} placeholder="Contoh: S003" />

              <label style={labelStyle}>Nama Lengkap</label>
              <input required style={inputStyle} value={teamForm.nama} onChange={e => setTeamForm({...teamForm, nama: e.target.value})} placeholder="Contoh: Junaidi" />

              <label style={labelStyle}>Pilih Role Terikat</label>
              <select required style={inputStyle} value={teamForm.role} onChange={e => setTeamForm({...teamForm, role: e.target.value})}>
                <option value="">-- Tentukan Role/Jabatan --</option>
                {data.roles.map((r: any) => (
                  <option key={r.id} value={r.role}>{r.role}</option>
                ))}
              </select>
              
              <label style={labelStyle}>Username Login</label>
              <input required style={inputStyle} value={teamForm.username} onChange={e => setTeamForm({...teamForm, username: e.target.value})} placeholder="Contoh: junaidi_s3" />

              <label style={labelStyle}>Password Kredensial</label>
              <input required style={inputStyle} value={teamForm.pass} onChange={e => setTeamForm({...teamForm, pass: e.target.value})} placeholder="Ketik sandi baru..." />

              <label style={labelStyle}>Nomor WhatsApp</label>
              <input style={inputStyle} value={teamForm.no_wa || ''} onChange={e => setTeamForm({...teamForm, no_wa: e.target.value})} placeholder="Contoh: 62812345678" />


              <label style={labelStyle}>URL Foto Profil (Optional)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={inputStyle} value={teamForm.foto_profil || ''} onChange={e => setTeamForm({...teamForm, foto_profil: e.target.value})} placeholder="https://..." />
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  id="sales-photo-input" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setTeamForm(prev => ({ ...prev, foto_profil: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('sales-photo-input')?.click()}
                  style={{ padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  UP
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setTeamModal({isOpen: false, data: null})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
