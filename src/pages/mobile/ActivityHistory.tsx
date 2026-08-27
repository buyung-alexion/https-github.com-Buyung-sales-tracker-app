// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';

import { useSalesData } from '../../hooks/useSalesData';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, X, MapPin, 
  MessageSquare, Clock, History, HelpCircle, Download, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import ActivityReport from './ActivityReport';
import { store } from '../../store/dataStore';
import { ImageIcon } from 'lucide-react';

const LazyPhotoThumbnail = ({ actId }: { actId: string }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  if (photo) return <img src={photo} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => {
    window.open(photo, '_blank'); 
  }} />;
  
  return (
    <div 
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        const p = await store.fetchActivityPhoto(actId);
        if (p) setPhoto(p);
        else setError(true);
        setLoading(false);
      }}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', cursor: 'pointer' }}
    >
      {loading ? <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%' }} /> : error ? <X size={14} color="#ef4444" /> : <ImageIcon size={16} color="#64748b" />}
    </div>
  );
};

export default function ActivityHistory() {
  
  const { user } = useAuth();
  const { activities = [] } = useSalesData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Riwayat');
  const [activeFilter, setActiveFilter] = useState('Semua');

  if (!user) return null;

  // Filter activities for this sales only
  const myActivities = useMemo(() => 
    activities.filter(a => a.id_sales === user.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
    [activities, user.id]
  );

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'Semua') return myActivities;
    return myActivities.filter(a => a.tipe_aksi === activeFilter);
  }, [myActivities, activeFilter]);

  const getAksiColor = (type: string) => {
    switch (type) {
      case 'Visit': return { bg: '#E6F6EC', text: '#00AA13', icon: <MapPin size={24} color="#00AA13" /> };
      case 'WA': return { bg: '#E6F6EC', text: '#00AA13', icon: <MessageSquare size={24} color="#00AA13" /> };
      case 'Order': return { bg: '#E6F6EC', text: '#00AA13', icon: <History size={24} color="#00AA13" /> };
      case 'Call': return { bg: '#E6F6EC', text: '#00AA13', icon: <Clock size={24} color="#00AA13" /> };
      default: return { bg: '#F5F6F8', text: '#1C1C1C', icon: <Clock size={24} color="#727272" /> };
    }
  };

  return (
    <>
    
    <div className="page-content" style={{ background: '#F5F6F8', minHeight: '100vh', paddingBottom: '120px', paddingTop: 0 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, margin: '0 -16px 0 -16px' }}>
        <div className="gojek-bg-top" style={{ position: 'relative', overflow: 'hidden', padding: 'calc(16px + env(safe-area-inset-top)) 20px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 6, width: '100%' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff', textAlign: 'center' }}>Aktivitas</h1>
          </div>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', padding: '16px 20px', gap: '10px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #E8E8E8' }} className="hide-scrollbar">
          {['Semua', 'Visit', 'WA', 'Call', 'Order'].map(filter => (
            <div 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '20px', 
                border: activeFilter === filter ? '1px solid #00AA13' : '1px solid #E8E8E8',
                background: activeFilter === filter ? '#E6F6EC' : '#fff',
                color: activeFilter === filter ? '#00AA13' : '#1C1C1C',
                fontSize: '13px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {filter}
            </div>
          ))}
        </div>
      </div>

      {/* History List */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredActivities.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#727272' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #E8E8E8' }}>
              <History size={32} opacity={0.3} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1C' }}>Belum Ada Aktivitas</div>
          </div>
        ) : (
          filteredActivities.map(act => {
            const style = getAksiColor(act.tipe_aksi);
            const dateStr = format(new Date(act.timestamp), 'dd MMM, HH:mm', { locale: localeId });
            
            return (
              <div key={act.id} style={{ background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#727272', fontWeight: 600 }}>{dateStr}</div>
                  {/* Empty space for price/amount if needed */}
                  <div style={{ fontSize: '13px', color: '#1C1C1C', fontWeight: 800 }}></div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Thumbnail */}
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {(act.tipe_aksi === 'Visit' || act.tipe_aksi === 'Order') && act.foto_bukti ? (
                      <LazyPhotoThumbnail actId={act.id} />
                    ) : (
                      style.icon
                    )}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1C1C1C', marginBottom: '4px', lineHeight: 1.2 }}>
                      {act.target_nama}
                    </div>
                    <div style={{ fontSize: '13px', color: '#727272', fontWeight: 500, marginBottom: '8px', lineHeight: 1.4 }}>
                      {act.catatan_hasil.length > 35 ? act.catatan_hasil.substring(0, 35) + '...' : act.catatan_hasil}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} color="#00AA13" fill="#00AA13" stroke="#fff" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#727272' }}>Selesai - {act.tipe_aksi}</span>
                      </div>
                      
                      {/* Action Button (like Mau lagi) */}
                      <button style={{ 
                        background: '#00AA13', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '20px', 
                        padding: '6px 12px', 
                        fontSize: '12px', 
                        fontWeight: 800,
                        cursor: 'pointer'
                      }} onClick={() => alert('Detail aktivitas: ' + act.catatan_hasil)}>
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button for Add Activity */}
      <button 
        onClick={() => setIsFormOpen(true)}
        style={{ 
          position: 'fixed', 
          bottom: 'calc(98px + env(safe-area-inset-bottom))', 
          right: '20px', 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          background: '#00AA13', 
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 4px 15px rgba(0, 170, 19, 0.4)',
          border: 'none',
          zIndex: 99,
          cursor: 'pointer'
        }}
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {/* Add Activity Modal */}
      {isFormOpen && (
        <ActivityReport 
          salesId={user.id} 
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
    </>
  );
}
