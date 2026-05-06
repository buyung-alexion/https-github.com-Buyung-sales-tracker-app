import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { store } from '../../store/dataStore';
import { 
  FileText, 
  DollarSign, 
  Users, 
  Clock,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Settings,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function PayrollManagement() {
  const [activeTab, setActiveTab] = useState<'rekap' | 'areas' | 'settings'>('rekap');
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [areaRates, setAreaRates] = useState<any[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<any[]>([]);
  const [dateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Modal States
  const [areaModal, setAreaModal] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });
  const [areaForm, setAreaForm] = useState({ area_name: '', daily_rate: 0, overtime_rate_per_hour: 0 });
  
  const [settingModal, setSettingModal] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });
  const [settingForm, setSettingForm] = useState({ setting_key: '', setting_value: 0, description: '' });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { title: 'Payroll Management', sub: 'Kelola absensi dan penggajian transparan' } 
    }));
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'rekap') {
        const { data } = await supabase
          .from('attendance_records')
          .select('*, area_rates(area_name), sales(nama)')
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: false });
        
        setAttendance((data || []).map(att => ({
          ...att,
          worker_name: att.sales?.nama,
          area_name: att.area_rates?.area_name
        })));
      } else if (activeTab === 'areas') {
        const data = await store.fetchAreaRates();
        setAreaRates(data);
      } else {
        const data = await store.fetchPayrollSettings();
        setPayrollSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (areaModal.data) {
      await store.updateAreaRate(areaModal.data.id, areaForm);
    } else {
      await store.addAreaRate(areaForm);
    }
    setAreaModal({ isOpen: false, data: null });
    fetchData();
  };

  const handleDeleteArea = async (id: string) => {
    if (window.confirm('Hapus tarif area ini?')) {
      await store.deleteAreaRate(id);
      fetchData();
    }
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingModal.data) {
      await store.updatePayrollSetting(settingForm.setting_key, settingForm.setting_value);
    } else {
      await store.addPayrollSetting(settingForm.setting_key, settingForm.setting_value, settingForm.description);
    }
    setSettingModal({ isOpen: false, data: null });
    fetchData();
  };

  const handleDeleteSetting = async (key: string) => {
    if (window.confirm('Hapus aturan gaji ini?')) {
      await store.deletePayrollSetting(key);
      fetchData();
    }
  };

  const totalPayroll = attendance.reduce((sum, item) => sum + (item.total_pay || 0), 0);
  const tabs = [
    { id: 'rekap', label: 'Rekap Absensi', icon: FileText },
    { id: 'areas', label: 'Area & Tarif', icon: MapPin },
    { id: 'settings', label: 'Aturan Gaji', icon: Settings }
  ];

  // Styles
  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
  const modalStyle: React.CSSProperties = { background: '#fff', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', marginBottom: '16px' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' };

  if (loading && attendance.length === 0 && activeTab === 'rekap') return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader2 className="animate-spin" size={48} color="#1E293B" /></div>;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#fff', padding: '6px', borderRadius: '16px', width: 'fit-content', border: '1px solid #F1F5F9' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '12px', border: 'none',
                background: activeTab === tab.id ? '#1E293B' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#64748B',
                fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'areas' && (
          <button onClick={() => { setAreaForm({ area_name: '', daily_rate: 0, overtime_rate_per_hour: 0 }); setAreaModal({ isOpen: true, data: null }); }} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> TAMBAH AREA
          </button>
        )}
        {activeTab === 'settings' && (
          <button onClick={() => { setSettingForm({ setting_key: '', setting_value: 0, description: '' }); setSettingModal({ isOpen: true, data: null }); }} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> TAMBAH ATURAN
          </button>
        )}
      </div>

      {activeTab === 'rekap' ? (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: '#DCFCE7', borderRadius: '12px' }}><DollarSign size={24} color="#059669" /></div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#059669', background: 'rgba(5, 150, 105, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>ESTIMASI TOTAL</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>Rp {totalPayroll.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '4px' }}>Periode: {format(new Date(dateRange.start), 'd MMM')} - {format(new Date(dateRange.end), 'd MMM yyyy')}</div>
            </div>
            
            <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: '#E0F2FE', borderRadius: '12px' }}><Users size={24} color="#0EA5E9" /></div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#0EA5E9', background: 'rgba(14, 165, 233, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>TOTAL KEHADIRAN</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>{attendance.length}</div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '4px' }}>Titik absen tercatat</div>
            </div>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: '#FEF2F2', borderRadius: '12px' }}><Clock size={24} color="#EF4444" /></div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>TOTAL LEMBUR</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 950, color: '#1E293B' }}>{attendance.reduce((s, i) => s + (i.overtime_hours || 0), 0).toFixed(1)} <span style={{ fontSize: '14px', opacity: 0.5 }}>Jam</span></div>
            </div>
          </div>
          
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #F1F5F9' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', color: '#64748B' }}>KARYAWAN</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', color: '#64748B' }}>TANGGAL</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', color: '#64748B' }}>LEMBUR</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', color: '#64748B' }}>TOTAL GAJI</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 900 }}>{row.worker_name}</td>
                    <td style={{ padding: '16px 24px' }}>{format(new Date(row.date), 'dd MMM yyyy')}</td>
                    <td style={{ padding: '16px 24px' }}>{row.overtime_hours} Jam</td>
                    <td style={{ padding: '16px 24px', fontWeight: 950, color: '#059669' }}>Rp {row.total_pay.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'areas' ? (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {areaRates.map(rate => (
            <div key={rate.id} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 950 }}>{rate.area_name}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setAreaForm(rate); setAreaModal({ isOpen: true, data: rate }); }} style={{ background: '#F1F5F9', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Edit2 size={14} color="#3b82f6" /></button>
                  <button onClick={() => handleDeleteArea(rate.id)} style={{ background: '#FEF2F2', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gaji Harian:</span> <strong>Rp {rate.daily_rate.toLocaleString()}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lembur / Jam:</span> <strong>Rp {rate.overtime_rate_per_hour.toLocaleString()}</strong></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {payrollSettings.map(setting => (
            <div key={setting.setting_key} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase' }}>{setting.setting_key.replace(/_/g, ' ')}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setSettingForm(setting); setSettingModal({ isOpen: true, data: setting }); }} style={{ background: '#F1F5F9', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Edit2 size={14} color="#3b82f6" /></button>
                  <button onClick={() => handleDeleteSetting(setting.setting_key)} style={{ background: '#FEF2F2', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 950, color: '#1E293B', marginBottom: '8px' }}>
                {setting.setting_key.includes('hour') ? `${setting.setting_value}:00` : `Rp ${setting.setting_value.toLocaleString()}`}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{setting.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Area Modal */}
      {areaModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>{areaModal.data ? 'Edit' : 'Tambah'} Area & Tarif</h3>
              <button onClick={() => setAreaModal({ isOpen: false, data: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSaveArea}>
              <label style={labelStyle}>Nama Area</label>
              <input required style={inputStyle} value={areaForm.area_name} onChange={e => setAreaForm({ ...areaForm, area_name: e.target.value })} placeholder="Contoh: Balikpapan" />
              <label style={labelStyle}>Gaji Harian (Rp)</label>
              <input required type="number" style={inputStyle} value={areaForm.daily_rate} onChange={e => setAreaForm({ ...areaForm, daily_rate: parseFloat(e.target.value) })} />
              <label style={labelStyle}>Lembur per Jam (Rp)</label>
              <input required type="number" style={inputStyle} value={areaForm.overtime_rate_per_hour} onChange={e => setAreaForm({ ...areaForm, overtime_rate_per_hour: parseFloat(e.target.value) })} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setAreaModal({ isOpen: false, data: null })} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700 }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Setting Modal */}
      {settingModal.isOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>{settingModal.data ? 'Edit' : 'Tambah'} Aturan Gaji</h3>
              <button onClick={() => setSettingModal({ isOpen: false, data: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSaveSetting}>
              <label style={labelStyle}>Kunci Pengaturan</label>
              <input required disabled={!!settingModal.data} style={inputStyle} value={settingForm.setting_key} onChange={e => setSettingForm({ ...settingForm, setting_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="Contoh: rate_driver" />
              <label style={labelStyle}>Nilai (Angka)</label>
              <input required type="number" style={inputStyle} value={settingForm.setting_value} onChange={e => setSettingForm({ ...settingForm, setting_value: parseFloat(e.target.value) })} />
              <label style={labelStyle}>Deskripsi</label>
              <input required style={inputStyle} value={settingForm.description} onChange={e => setSettingForm({ ...settingForm, description: e.target.value })} placeholder="Contoh: Gaji harian driver" />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setSettingModal({ isOpen: false, data: null })} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700 }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
