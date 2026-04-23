import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { 
  ArrowLeft, Search, Plus, X, MapPin, 
  ChevronDown, ChevronRight, 
  MessageSquare, Clock, History
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import ActivityReport from './ActivityReport';

export default function ActivityHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities = [] } = useSalesData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  if (!user) return null;

  // Filter activities for this sales only
  const myActivities = useMemo(() => 
    activities.filter(a => a.id_sales === user.id), 
    [activities, user.id]
  );

  // Grouping logic
  const groupedActivities = useMemo(() => {
    const groups: Record<string, typeof myActivities> = {};
    myActivities.forEach(act => {
      const date = act.timestamp.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(act);
    });
    return groups;
  }, [myActivities]);

  const sortedDates = useMemo(() => 
    Object.keys(groupedActivities).sort((a, b) => b.localeCompare(a)), 
    [groupedActivities]
  );

  // Expand today by default
  useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (sortedDates.includes(today) && expandedDates.length === 0) {
      setExpandedDates([today]);
    }
  }, [sortedDates]);

  const formatGroupName = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Hari ini';
    if (dateStr === yesterday) return 'Kemarin';
    
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: localeId });
  };

  const toggleExpand = (date: string) => {
    setExpandedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const getAksiColor = (type: string) => {
    switch (type) {
      case 'Visit': return { bg: '#ECFDF5', text: '#059669', icon: <MapPin size={14} /> };
      case 'WA': return { bg: '#EFF6FF', text: '#2563EB', icon: <MessageSquare size={14} /> };
      case 'Order': return { bg: '#FFF7ED', text: '#EA580C', icon: <History size={14} /> };
      default: return { bg: '#F8FAFC', text: '#64748B', icon: <Clock size={14} /> };
    }
  };

  return (
    <>
    <div className="page-content" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Header Branding Yellow Style */}
      <div style={{ background: 'var(--brand-yellow)', padding: 'calc(20px + env(safe-area-inset-top)) 20px 40px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', boxShadow: '0 10px 30px rgba(255, 193, 7, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="#000" />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 950, color: '#000', letterSpacing: '-0.5px' }}>Riwayat Aktivitas</h1>
        </div>

        {/* Summary Row */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
           <div style={{ flex: 1, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' }}>Total Aktivitas</div>
              <div style={{ fontSize: '18px', fontWeight: 950, color: '#000' }}>{myActivities.length} Laporan</div>
           </div>
           <div style={{ flex: 1, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' }}>Hari Ini</div>
              <div style={{ fontSize: '18px', fontWeight: 950, color: '#000' }}>{groupedActivities[new Date().toISOString().split('T')[0]]?.length || 0} Aksi</div>
           </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ padding: '0 20px', marginTop: '-20px' }}>
         <div style={{ background: '#fff', borderRadius: '16px', padding: '4px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ padding: '10px', color: '#94a3b8' }}><Search size={18} /></div>
            <input 
              type="text" 
              placeholder="Cari histori aktivitas..." 
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: 700, padding: '10px 0' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* History List */}
      <div style={{ padding: '24px 20px' }}>
        {sortedDates.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <MapPin size={32} opacity={0.3} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#475569' }}>Belum Ada Aktivitas</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedDates.map(date => {
              const actsInGroup = groupedActivities[date].filter(a => 
                a.target_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.catatan_hasil.toLowerCase().includes(searchTerm.toLowerCase())
              );
              
              if (actsInGroup.length === 0) return null;

              const isExpanded = expandedDates.includes(date);

              return (
                <div key={date} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div 
                    onClick={() => toggleExpand(date)}
                    style={{ 
                      padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', 
                      background: isExpanded ? '#f8fafc' : '#fff',
                      borderLeft: `5px solid ${isExpanded ? 'var(--brand-yellow)' : '#e2e8f0'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{formatGroupName(date)}</div>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{actsInGroup.length} Aktivitas</div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {actsInGroup.map(act => {
                        const style = getAksiColor(act.tipe_aksi);
                        return (
                          <div key={act.id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{act.target_nama}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                   <div style={{ padding: '4px 8px', borderRadius: '6px', background: style.bg, color: style.text, fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      {style.icon} {act.tipe_aksi}
                                   </div>
                                   <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{format(new Date(act.timestamp), 'HH:mm')}</div>
                                </div>
                              </div>
                              {act.geotagging?.photo && (
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                  <img src={act.geotagging.photo} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, lineHeight: 1.4, borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                              {act.catatan_hasil}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsFormOpen(true)}
        style={{ position: 'fixed', bottom: '110px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#3B82F6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)', zIndex: 100 }}
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Activity Form Drawer (Moved for stability) */}
      {isFormOpen && (
        <div onClick={() => setIsFormOpen(false)} style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', 
          zIndex: 999999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' 
        }}>
          <div onClick={e => e.stopPropagation()} style={{ 
            height: '92vh', width: '100vw', background: '#fff', 
            borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
            position: 'relative', margin: 0, padding: 0
          }}>
            {/* Close Button Overlay */}
            <button 
              onClick={() => setIsFormOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <X size={20} color="#64748b" />
            </button>
            <ActivityReport salesId={user?.id || ''} onSuccess={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
