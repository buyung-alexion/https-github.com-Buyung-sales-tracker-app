import React, { useState, useEffect } from 'react';
import { Shield, Users, Target, Edit2, Trash2, X, Plus, MapPin, TrendingUp, ShoppingCart, Loader2 } from 'lucide-react';
import { store } from '../../store/dataStore';
import { supabase } from '../../lib/supabase';
import { useSalesData } from '../../hooks/useSalesData';

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<'role' | 'team' | 'target' | 'area' | 'category' | 'channel' | 'status' | 'action'>('role');
  const [data, setData] = useState({ roles: [] as any[], teams: [] as any[], targets: {} as any });
  const [isLoading, setIsLoading] = useState(true);

  const { masterAreas, masterCategories, masterChannels, masterStatuses, masterActions, refresh: refreshGlobal } = useSalesData();

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
          no_wa: s.no_wa
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
  const [masterForm, setMasterForm] = useState({ id: '', name: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- ACTIONS ---
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
    if (roleModal.data) await store.updateRole(roleModal.data.id, roleForm);
    else await store.addRole(roleForm);
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
    setFormError(null);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (teamModal.data) {
        const isRenaming = teamForm.id !== teamModal.data.id;
        if (isRenaming) {
          if (!window.confirm(`PERINGATAN: Anda mengubah ID Karyawan dari "${teamModal.data.id}" menjadi "${teamForm.id}". \n\nSemua riwayat (absensi, visit, dll) akan ikut berpindah ke ID baru. Lanjutkan?`)) {
            setIsSubmitting(false); return;
          }
        }

        console.log('DEBUG: Updating team', teamModal.data.id, teamForm);
        const updates: any = {
          nama: teamForm.nama, username: teamForm.username, password: teamForm.pass,
          role: teamForm.role, foto_profil: teamForm.foto_profil, no_wa: teamForm.no_wa
        };
        if (isRenaming) updates.id = teamForm.id;

        const { error, data: updatedData } = await store.updateSales(teamModal.data.id, updates);
        if (error) {
          console.error('DEBUG: Update error', error);
          throw error;
        }
        if (!updatedData || (updatedData as any).length === 0) {
          throw new Error('Data tidak berubah. Pastikan ID karyawan valid.');
        }
      } else {
        if(data.teams.some((t:any) => t.id === teamForm.id)) {
            setFormError(`ID Karyawan ${teamForm.id} sudah digunakan!`);
            setIsSubmitting(false); return;
        }
        const { error } = await store.addSales({
          id: teamForm.id, nama: teamForm.nama, username: teamForm.username,
          password: teamForm.pass, role: teamForm.role, foto_profil: teamForm.foto_profil, no_wa: teamForm.no_wa
        } as any);
        if (error) throw error;
      }
      setTeamModal({isOpen: false, data: null});
      // Force immediate refresh from DB
      const { data: sales, error: fetchError } = await supabase.from('sales').select('*').order('nama');
      if (fetchError) throw fetchError;
      
      setData(d => ({...d, teams: (sales || []).map((s:any) => ({ 
        id: s.id, nama: s.nama, username: s.username, pass: s.password, role: s.role, foto_profil: s.foto_profil, no_wa: s.no_wa
      }))}));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      console.log('DEBUG: Save process complete');
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data karyawan.');
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Hapus kredensial tim ini?')) {
      await store.deleteSales(id);
      setData(d => ({ ...d, teams: d.teams.filter((t: any) => t.id !== id) }));
    }
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ind_poin: data.targets.indPoin, b_visit: data.targets.bVisit, b_prospek: data.targets.bProspek,
        b_closing: data.targets.bClosing, b_order: data.targets.bOrder, b_chat: data.targets.bChat, b_maint: data.targets.bVisit
      };
      await store.updateSystemTargets(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) { alert('Gagal: ' + err.message); }
    finally { setIsSubmitting(false); }
  };

  const openMasterModal = (type: 'area' | 'category' | 'channel' | 'status' | 'action', existingData?: any) => {
    setMasterForm({ id: existingData ? existingData.id : '', name: existingData ? existingData.name : '' });
    setMasterModal({ isOpen: true, type, data: existingData });
  };

  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterModal.type) return;
    try {
      setIsSubmitting(true);
      const name = masterForm.name.trim();
      const customId = masterForm.id.trim();
      if (masterModal.data) {
        const currentId = masterModal.data.id;
        const updates = { name, id: customId || currentId };
        switch (masterModal.type) {
          case 'area': await store.updateMasterArea(currentId, updates); break;
          case 'category': await store.updateMasterCategory(currentId, updates); break;
          case 'channel': await store.updateMasterChannel(currentId, updates); break;
          case 'status': await store.updateMasterProspectStatus(currentId, updates); break;
          case 'action': await store.updateMasterAction(currentId, updates); break;
        }
      } else {
        switch (masterModal.type) {
          case 'area': await store.addMasterArea(name, customId); break;
          case 'category': await store.addMasterCategory(name, customId); break;
          case 'channel': await store.addMasterChannel(name, customId); break;
          case 'status': await store.addMasterProspectStatus(name, customId); break;
          case 'action': await store.addMasterAction(name, customId); break;
        }
      }
      setMasterModal({ isOpen: false, type: null, data: null });
      await refreshGlobal();
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteMaster = async (type: string, id: string) => {
    if (!window.confirm(`Hapus ${type} ini?`)) return;
    try {
      if (type === 'area') await store.deleteMasterArea(id);
      else if (type === 'category') await store.deleteMasterCategory(id);
      else if (type === 'channel') await store.deleteMasterChannel(id);
      else if (type === 'status') await store.deleteMasterProspectStatus(id);
      else if (type === 'action') await store.deleteMasterAction(id);
      await refreshGlobal();
    } catch (err: any) { alert(err.message); }
  };

  // --- STYLES ---
  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
  const modalStyle: React.CSSProperties = { background: '#fff', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box', fontWeight: 600, color: '#1e293b' };
  const labelStyle: React.CSSProperties = { display: 'block', margin: '16px 0 8px', fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const tabContentStyle: React.CSSProperties = { animation: 'fadeIn 0.4s ease-out' };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', background: '#f8fafc' }}>
        <Loader2 size={48} className="animate-spin" color="#FFCC00" />
        <div style={{ fontSize: '16px', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>MENYIAPKAN DATA MANAGEMENT...</div>
      </div>
    );
  }

  return (
    <div className="mgr-page" style={{ position: 'relative', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', marginTop: '24px' }}>
        
        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '260px', flexShrink: 0, position: 'sticky', top: '24px' }}>
          <div style={{ padding: '0 20px 20px', fontSize: '11px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Menu Konfigurasi</div>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: '14px 20px', borderRadius: '20px', border: 'none', background: isActive ? '#111827' : 'transparent', color: isActive ? '#FFCC00' : '#64748b', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.3s', boxShadow: isActive ? '0 15px 30px rgba(0,0,0,0.12)' : 'none', transform: isActive ? 'translateX(10px)' : 'none' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: isActive ? 'rgba(255, 204, 0, 0.15)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 18, strokeWidth: 2.5, color: isActive ? '#FFCC00' : '#cbd5e1' })}
                </div>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
          <div style={tabContentStyle}>
            
            {activeTab === 'role' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0 }}>Role & Hak Akses</h3><p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>STRUKTUR OTORITAS TIM</p></div>
                  <button onClick={() => openRoleModal()} className="btn-primary" style={{ padding: '14px 28px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, border: 'none' }}><Plus size={18} /> TAMBAH ROLE</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.roles.map((u: any) => (
                    <div key={u.id} style={{ background: '#fff', borderRadius: '24px', padding: '24px 32px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}><div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={24} color="#FFCC00" /></div><div><h4 style={{ margin: 0, fontWeight: 900 }}>{u.role}</h4><div style={{ color: '#64748b', fontSize: '13px' }}>{u.akses}</div></div></div>
                      <div style={{ display: 'flex', gap: '12px' }}><button onClick={() => openRoleModal(u)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', border: 'none', cursor: 'pointer' }}><Edit2 size={16} color="#3b82f6" /></button><button onClick={() => handleDeleteRole(u.id)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', border: 'none', cursor: 'pointer' }}><Trash2 size={16} color="#ef4444" /></button></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0 }}>Tim & Kredensial</h3><p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>KELOLA LOGIN & IDENTITAS</p></div>
                  <button onClick={() => openTeamModal()} className="btn-primary" style={{ flex: 'none', padding: '14px 28px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, border: 'none' }}><Plus size={18} /> TAMBAH KARYAWAN</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.teams.map((u: any) => (
                    <div key={u.id} style={{ background: '#fff', borderRadius: '24px', padding: '24px 32px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}><div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#f8fafc', overflow: 'hidden' }}>{u.foto_profil ? <img src={u.foto_profil} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={24} />}</div><div><h4 style={{ margin: 0, fontWeight: 900 }}>{u.nama}</h4><div style={{ fontSize: '12px', color: '#64748b' }}>ID: <span style={{ color: '#1e293b', fontWeight: 900 }}>{u.id}</span> | ROLE: {u.role}</div></div></div>
                      <div style={{ display: 'flex', gap: '12px' }}><button onClick={() => openTeamModal(u)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', border: 'none', cursor: 'pointer' }}><Edit2 size={16} color="#3b82f6" /></button><button onClick={() => handleDeleteTeam(u.id)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', border: 'none', cursor: 'pointer' }}><Trash2 size={16} color="#ef4444" /></button></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'target' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0 }}>Target & Bobot Poin</h3><p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>KONFIGURASI INDIKATOR KINERJA</p></div>
                  {saveSuccess && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px 24px', borderRadius: '14px', fontSize: '13px', fontWeight: 800 }}>✅ Berhasil Disimpan!</div>}
                </div>
                <form onSubmit={handleSaveTargets} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9' }}>
                      <label style={labelStyle}>Target Poin Bulanan</label>
                      <input type="number" style={inputStyle} value={data.targets.indPoin} onChange={e => setData(d => ({...d, targets: {...d.targets, indPoin: parseInt(e.target.value) || 0}}))} />
                    </div>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9' }}>
                      <label style={labelStyle}>Poin Visit (Bobot)</label>
                      <input type="number" style={inputStyle} value={data.targets.bVisit} onChange={e => setData(d => ({...d, targets: {...d.targets, bVisit: parseInt(e.target.value) || 0}}))} />
                    </div>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9' }}>
                      <label style={labelStyle}>Poin Prospek Baru</label>
                      <input type="number" style={inputStyle} value={data.targets.bProspek} onChange={e => setData(d => ({...d, targets: {...d.targets, bProspek: parseInt(e.target.value) || 0}}))} />
                    </div>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9' }}>
                      <label style={labelStyle}>Bonus Closing (Cust)</label>
                      <input type="number" style={inputStyle} value={data.targets.bClosing} onChange={e => setData(d => ({...d, targets: {...d.targets, bClosing: parseInt(e.target.value) || 0}}))} />
                    </div>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9' }}>
                      <label style={labelStyle}>Poin Per Order (Sales)</label>
                      <input type="number" style={inputStyle} value={data.targets.bOrder} onChange={e => setData(d => ({...d, targets: {...d.targets, bOrder: parseInt(e.target.value) || 0}}))} />
                    </div>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9' }}>
                      <label style={labelStyle}>Poin Per Chat</label>
                      <input type="number" style={inputStyle} value={data.targets.bChat} onChange={e => setData(d => ({...d, targets: {...d.targets, bChat: parseInt(e.target.value) || 0}}))} />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '16px', borderRadius: '16px', fontWeight: 900 }}>{isSubmitting ? 'MENYIMPAN...' : 'UPDATE KONFIGURASI'}</button>
                </form>
              </div>
            )}

            {(activeTab === 'area' || activeTab === 'category' || activeTab === 'channel' || activeTab === 'status' || activeTab === 'action') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#fff', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0 }}>Manajemen {activeTab.toUpperCase()}</h3><p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>DATA MASTER SISTEM</p></div>
                  <button onClick={() => openMasterModal(activeTab as any)} className="btn-primary" style={{ padding: '14px 28px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, border: 'none' }}><Plus size={18} /> TAMBAH {activeTab.toUpperCase()}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {(activeTab === 'area' ? masterAreas : activeTab === 'category' ? masterCategories : activeTab === 'channel' ? masterChannels : activeTab === 'status' ? masterStatuses : masterActions).map((m: any) => (
                    <div key={m.id} style={{ background: '#fff', borderRadius: '24px', padding: '20px 24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={20} color="#FFCC00" /></div>
                        <div><div style={{ fontWeight: 900, color: '#1e293b' }}>{m.name}</div><div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {m.id}</div></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openMasterModal(activeTab as any, m)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f0f9ff', border: 'none', cursor: 'pointer' }}><Edit2 size={14} color="#0ea5e9" /></button>
                        <button onClick={() => handleDeleteMaster(activeTab, m.id)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef2f2', border: 'none', cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MASTER MODAL */}
      {masterModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>{masterModal.data ? 'Edit' : 'Tambah'} {masterModal.type?.toUpperCase()}</h3>
              <button onClick={() => setMasterModal({isOpen: false, type: null, data: null})} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSaveMaster}>
              <label style={labelStyle}>ID (Optional)</label>
              <input style={inputStyle} value={masterForm.id} onChange={e => setMasterForm({ ...masterForm, id: e.target.value.toUpperCase() })} placeholder="Auto-generate jika kosong" />
              <label style={labelStyle}>Nama {masterModal.type}</label>
              <input required style={inputStyle} value={masterForm.name} onChange={e => setMasterForm({ ...masterForm, name: e.target.value })} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setMasterModal({isOpen: false, type: null, data: null})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700 }}>Batal</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MODAL */}
      {teamModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900 }}>{teamModal.data ? 'Edit Tim' : 'Tambah Tim'}</h3>
                {teamModal.data && <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>SEDANG MENGUBAH DATA <span style={{ color: '#1e293b', fontWeight: 900 }}>{teamModal.data.id}</span></p>}
              </div>
              <button onClick={() => setTeamModal({isOpen: false, data: null})} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSaveTeam}>
              {formError && <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '13px', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontWeight: 700 }}>⚠️ {formError}</div>}
              <label style={labelStyle}>ID Karyawan</label>
              <input required style={{...inputStyle, background: teamModal.data ? '#fff9db' : '#fff'}} value={teamForm.id} onChange={e => setTeamForm({...teamForm, id: e.target.value.toUpperCase()})} placeholder="Contoh: S001" />
              {teamModal.data && <p style={{ marginTop: '6px', fontSize: '11px', color: '#856404', fontWeight: 700 }}>💡 Mengubah ID akan memindahkan seluruh riwayat kerja.</p>}
              <label style={labelStyle}>Nama</label>
              <input required style={inputStyle} value={teamForm.nama} onChange={e => setTeamForm({...teamForm, nama: e.target.value})} />
              <label style={labelStyle}>Role</label>
              <select required style={inputStyle} value={teamForm.role} onChange={e => setTeamForm({...teamForm, role: e.target.value})}>
                <option value="">-- Pilih Role --</option>
                {data.roles.map((r: any) => <option key={r.id} value={r.role}>{r.role}</option>)}
              </select>
              <label style={labelStyle}>Username</label>
              <input required style={inputStyle} value={teamForm.username} onChange={e => setTeamForm({...teamForm, username: e.target.value})} />
              <label style={labelStyle}>Password</label>
              <input required style={inputStyle} value={teamForm.pass} onChange={e => setTeamForm({...teamForm, pass: e.target.value})} />
              <label style={labelStyle}>Nomor WA</label>
              <input style={inputStyle} value={teamForm.no_wa} onChange={e => setTeamForm({...teamForm, no_wa: e.target.value})} placeholder="62xxx" />

              <label style={labelStyle}>URL Foto Profil</label>
              <input style={inputStyle} value={teamForm.foto_profil} onChange={e => setTeamForm({...teamForm, foto_profil: e.target.value})} placeholder="https://..." />
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setTeamModal({isOpen: false, data: null})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700 }}>Batal</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {roleModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>Role & Akses</h3>
              <button onClick={() => setRoleModal({isOpen: false, data: null})} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSaveRole}>
              <label style={labelStyle}>Nama Role</label>
              <input required style={inputStyle} value={roleForm.role} onChange={e => setRoleForm({...roleForm, role: e.target.value})} />
              <label style={labelStyle}>Hak Akses (CSV)</label>
              <input style={inputStyle} value={roleForm.akses} onChange={e => setRoleForm({...roleForm, akses: e.target.value})} placeholder="Akses 1, Akses 2, ..." />
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setRoleModal({isOpen: false, data: null})} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700 }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
