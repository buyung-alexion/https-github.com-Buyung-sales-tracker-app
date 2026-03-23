import { useSalesData } from '../../hooks/useSalesData';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronRight, ChevronDown, UserCheck, PhoneCall, MapPin, Target, MessageCircle, Plus, Clock, ArrowRight } from 'lucide-react';

interface Props { salesId: string; }

export default function Homepage({ salesId }: Props) {
  const { sales, activities, prospek, customers, planBesok } = useSalesData();
  const navigate = useNavigate();
  const salesInfo = sales.find(s => s.id === salesId);

  // Target Points Component Sum (using defaults if missing)
  const targetProspek = salesInfo?.target_prospek_baru ?? 25;
  const targetClosing = salesInfo?.target_closing_baru ?? 6;
  const targetMaintenance = salesInfo?.target_maintenance ?? 25;
  const targetVisit = salesInfo?.target_visit ?? 50;
  
  const targetPoin = targetProspek + targetClosing + targetMaintenance + targetVisit;

  // Actual Performance Points Calculation
  const closingCount = activities.filter(a => a.id_sales === salesId && a.catatan_hasil.toLowerCase().includes('closing')).length;
  const maintenanceCount = activities.filter(a => a.id_sales === salesId && a.tipe_aksi === 'Visit' && a.target_type === 'customer').length;
  const totalVisit = activities.filter(a => a.id_sales === salesId && a.tipe_aksi === 'Visit').length;
  const totalProspek = prospek.filter(p => p.sales_owner === salesId).length;
  const totalCustomer = customers.filter(c => c.sales_pic === salesId).length;
  const totalActualPoints = totalProspek + closingCount + maintenanceCount + totalVisit;

  // Recent Activities
  const recentActs = activities
    .filter(a => a.id_sales === salesId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  // Plan Besok
  const myPlans = planBesok
    .filter(p => p.sales_id === salesId && p.status !== 'Selesai')
    .sort((a, b) => new Date(a.tanggal_rencana).getTime() - new Date(b.tanggal_rencana).getTime())
    .slice(0, 3);

  return (
    <div className="page-content" style={{ paddingBottom: '90px', background: '#f8fafc' }}>
      
      {/* Yellow Header Section */}
      <div style={{ background: 'var(--brand-yellow)', minHeight: '340px', padding: '24px 20px', position: 'relative' }}>
        
        {/* Top Profile Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/mobile/profile')}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #fff', position: 'relative' }}>
              <img src={`https://ui-avatars.com/api/?name=${salesInfo?.nama ?? 'Sales'}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {salesInfo?.nama ?? 'Sales'} <ChevronRight size={16} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', color: '#111827' }}>
            <Search size={22} strokeWidth={2.5} />
            <Bell size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* Big Balance Equivalent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#111827', letterSpacing: '-1.5px', margin: 0 }}>{targetPoin.toLocaleString('id-ID')}</h1>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>Poin</span>
          <button style={{ background: '#E6192B', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: 800, marginLeft: 'auto', boxShadow: '0 4px 10px rgba(230, 25, 43, 0.3)' }}>
            Target
          </button>
        </div>
        <div style={{ fontSize: '13px', color: '#111827', opacity: 0.8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          Total Pencapaian <ChevronDown size={14} />
        </div>

        {/* 4-Tab Subcard (Black Elegan) */}
        <div style={{ background: '#111827', borderRadius: '24px', padding: '16px 10px', display: 'flex', justifyContent: 'space-between', marginTop: '30px', boxShadow: '0 10px 25px rgba(17,24,39,0.2)' }}>
          <div style={{ textAlign: 'center', flex: 1, color: '#fff' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px', color: 'var(--brand-yellow)' }}>{totalActualPoints}</div>
            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8 }}>Poin</span>
          </div>
          <div style={{ textAlign: 'center', flex: 1, color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px' }}>{totalProspek}</div>
            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8 }}>Prospek</span>
          </div>
          <div style={{ textAlign: 'center', flex: 1, color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px' }}>{totalCustomer}</div>
            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8 }}>Customer</span>
          </div>
          <div style={{ textAlign: 'center', flex: 1, color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '4px' }}>{totalVisit}</div>
            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8 }}>Visit</span>
          </div>
        </div>
      </div>

      {/* White Body - Overlaps the header like a Bottom Sheet */}
      <div style={{ background: '#fff', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', marginTop: '-30px', paddingTop: '30px', position: 'relative', zIndex: 10, paddingBottom: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        
        {/* Quick Actions grid (Menu Utama) */}
        <div style={{ padding: '0 20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', marginBottom: '20px', letterSpacing: '-0.5px' }}>Menu Utama</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px 10px', textAlign: 'center' }} onClick={() => navigate('/mobile/prospek')}>
              <div style={{ background: '#D1FAE5', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <MessageCircle size={20} color="#059669" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', lineHeight: '1.2', display: 'block' }}>WhatsApp</span>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px 10px', textAlign: 'center' }}>
              <div style={{ background: '#E0F2FE', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <PhoneCall size={20} color="#0284C7" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', lineHeight: '1.2', display: 'block' }}>Call</span>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px 10px', textAlign: 'center' }} onClick={() => navigate('/mobile/checkin')}>
              <div style={{ background: '#F3E8FF', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <MapPin size={20} color="#7E22CE" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', lineHeight: '1.2', display: 'block' }}>Check-in<br/>Visit</span>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px 10px', textAlign: 'center' }} onClick={() => navigate('/mobile/customer#new')}>
              <div style={{ background: '#FFEDD5', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <UserCheck size={20} color="#EA580C" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', lineHeight: '1.2', display: 'block' }}>New<br/>Customer</span>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px 10px', textAlign: 'center' }} onClick={() => navigate('/mobile/prospek#new')}>
              <div style={{ background: '#FEF08A', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Plus size={20} color="#A16207" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', lineHeight: '1.2', display: 'block' }}>New<br/>Prospek</span>
            </div>
            {/* 6th Slot */}
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px 10px', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/mobile/rencana')}>
              <div style={{ background: '#F1F5F9', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Target size={20} color="#475569" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', lineHeight: '1.2', display: 'block' }}>Rencana<br/>Aktivitas</span>
            </div>
          </div>
        </div>

        {/* Plan Besok (Daftar Tugas) */}
        <div style={{ padding: '0 20px', marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Rencana Aktivitas</h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-yellow)', cursor: 'pointer' }} onClick={() => navigate('/mobile/rencana')}>Lihat Semua</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myPlans.map(p => (
              <div key={p.id} style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #f1f5f9' }} onClick={() => navigate('/mobile/rencana')}>
                <div style={{ background: 'var(--brand-yellow)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.tipe_aksi === 'WA' ? <MessageCircle size={18} color="#111827" /> : p.tipe_aksi === 'Call' ? <PhoneCall size={18} color="#111827" /> : <MapPin size={18} color="#111827" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{p.target_nama}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 600, display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#E6192B' }}></span>
                    {p.tipe_aksi} - {new Date(p.tanggal_rencana).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ArrowRight size={14} color="#64748b" />
                </div>
              </div>
            ))}
            {myPlans.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>Tidak ada rencana aktivitas.</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ padding: '0 20px', marginTop: '30px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Recent Activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActs.map(act => (
              <div key={act.id} style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} color="#D97706" />
                  </div>
                  <div style={{ width: '2px', height: '100%', background: '#f1f5f9', marginTop: '4px' }}></div>
                </div>
                <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Melakukan {act.tipe_aksi}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>{act.catatan_hasil}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
                    {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true, locale: id })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
