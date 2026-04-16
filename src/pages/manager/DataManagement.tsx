import React, { useState, useEffect } from 'react';
import { Shield, Users, Target, Edit2, Trash2, X, Plus, MapPin, TrendingUp, ShoppingCart } from 'lucide-react';
import { store } from '../../store/dataStore';
import { supabase } from '../../lib/supabase';
import { useSalesData } from '../../hooks/useSalesData';

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<'role' | 'team' | 'target' | 'area' | 'category' | 'channel' | 'status' | 'action'>('role');
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
    { id: 'target', label: 'Target & Bobot', icon: <Target size={16} /> },
    { id: 'area', label: 'Area / Wilayah', icon: <MapPin size={16} /> },
    { id: 'category', label: 'Kategori Bisnis', icon: <ShoppingCart size={16} /> },
    { id: 'channel', label: 'Sumber / Channel', icon: <TrendingUp size={16} /> },
    { id: 'status', label: 'Status Prospek', icon: <Target size={16} /> },
    { id: 'action', label: 'Tipe Aktivitas', icon: <Users size={16} /> },
  ];

  // --- MODAL STATES ---
  const [roleModal, setRoleModal] = useState<{isOpen: boolean; data: any}>({isOpen: false, data: null});
  const [roleForm, setRoleForm] = useState({ role: 'Sales', akses: 'Mobile App, Limited Analytics' });

  const [teamModal, setTeamModal] = useState<{isOpen: boolean; data: any}>({isOpen: false, data: null});
  const [teamForm, setTeamForm] = useState({ id: '', nama: '', role: '', username: '', pass: '', foto_profil: '', no_wa: '' });

  const [masterModal, setMasterModal] = useState<{isOpen: boolean; type: 'area' | 'category' | 'channel' | 'status' | 'action' | null; data: any}>({isOpen: false, type: null, data: null});
  const [masterForm, setMasterForm] = useState({ name: '' });


  // Wait, I should use useSalesData hook for the data lists to benefit from context

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



  // --- MASTER DATA ACTIONS ---
  const { masterAreas, masterCategories, masterChannels, masterStatuses, masterActions, refresh: refreshGlobal } = useSalesData();

  const openMasterModal = (type: 'area' | 'category' | 'channel' | 'status' | 'action', existingData?: any) => {
    setMasterForm({ name: existingData ? existingData.name : '' });
    setMasterModal({ isOpen: true, type, data: existingData });
  };

  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = masterModal.type;
    const name = masterForm.name.trim();
    if (!name) return;

    try {
      if (type === 'area') {
        if (masterModal.data) {
           // update is complex if ID changes, so we just restrict to newly added for now
           // For simplicity, we only allow ADD and DELETE in master data to avoid consistency issues
           alert('Update Wilayah tidak tersedia, silakan hapus dan tambah baru.');
        } else {
           await store.addMasterArea(name);
        }
      } else if (type === 'category') {
        if (masterModal.data) alert('Update Kategori tidak tersedia.');
        else await store.addMasterCategory(name);
      } else if (type === 'channel') {
        if (masterModal.data) alert('Update Sumber tidak tersedia.');
        else await store.addMasterChannel(name);
      } else if (type === 'status') {
        if (masterModal.data) alert('Update Status tidak tersedia.');
        else await store.addMasterProspectStatus(name);
      } else if (type === 'action') {
        if (masterModal.data) alert('Update Aktivitas tidak tersedia.');
        else await store.addMasterAction(name);
      }
      setMasterModal({ isOpen: false, type: null, data: null });
      await refreshGlobal();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMaster = async (type: 'area' | 'category' | 'channel', id: string) => {
    if (!window.confirm(`Hapus ${type} ini?`)) return;
    try {
      if (type === 'area') await store.deleteMasterArea(id);
      else if (type === 'category') await store.deleteMasterCategory(id);
      else if (type === 'channel') await store.deleteMasterChannel(id);
      else if (type === 'status') await store.deleteMasterProspectStatus(id);
      else if (type === 'action') await store.deleteMasterAction(id);
      await refreshGlobal();
    } catch (err: any) {
      alert(err.message);
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

          {/* MASTER DATA TABS (Area, Category, Channel, Status, Action) */}
          {(activeTab === 'area' || activeTab === 'category' || activeTab === 'channel' || activeTab === 'status' || activeTab === 'action') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div style={{ 
                background: '#fff', padding: '32px', borderRadius: '32px', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                    {activeTab === 'area' ? 'Manajemen Wilayah' : 
                     activeTab === 'category' ? 'Kategori Bisnis' : 
                     activeTab === 'channel' ? 'Sumber / Channel' :
                     activeTab === 'status' ? 'Status Prospek' : 'Tipe Aktivitas'}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>DATA MASTER SISTEM</p>
                </div>
                <button 
                  onClick={() => openMasterModal(activeTab as any)} 
                  style={{ background: 'var(--brand-yellow)', color: '#111827', padding: '14px 28px', fontSize: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(250, 204, 21, 0.3)' }}
                >
                  <Plus size={18} strokeWidth={3} /> TAMBAH {activeTab.toUpperCase()}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {(activeTab === 'area' ? masterAreas : 
                  activeTab === 'category' ? masterCategories : 
                  activeTab === 'channel' ? masterChannels :
                  activeTab === 'status' ? masterStatuses : masterActions).map((m: any) => (
                  <div key={m.id} style={{ 
                    background: '#fff', borderRadius: '24px', padding: '20px 24px', 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: activeTab === 'area' ? '#f0f9ff' : activeTab === 'category' ? '#fff7ed' : activeTab === 'channel' ? '#f0fdf4' : activeTab === 'status' ? '#fef2f2' : '#f5f3ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {activeTab === 'area' ? <MapPin size={20} color="#0ea5e9" /> : 
                         activeTab === 'category' ? <ShoppingCart size={20} color="#f97316" /> : 
                         activeTab === 'channel' ? <TrendingUp size={20} color="#22c55e" /> :
                         activeTab === 'status' ? <Target size={20} color="#ef4444" /> : <Users size={20} color="#8b5cf6" />}
                      </div>
                      <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>{m.name}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteMaster(activeTab as any, m.id)} 
                      style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MASTER DATA MODAL --- */}
      {masterModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>Tambah {masterModal.type?.toUpperCase()} Baru</h3>
              <button onClick={() => setMasterModal({isOpen: false, type: null, data: null})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveMaster}>
              <label style={labelStyle}>Nama {masterModal.type}</label>
              <input required style={inputStyle} value={masterForm.name} onChange={e => setMasterForm({ name: e.target.value })} placeholder={`Contoh: ${masterModal.type === 'area' ? 'Jakarta' : 'Retail'}`} />
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setMasterModal({isOpen: false, type: null, data: null})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
