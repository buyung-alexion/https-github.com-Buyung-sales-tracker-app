import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useCurrentSales, useSalesData } from '../../hooks/useSalesData';
import { calculateSalesPoints } from '../../utils/points';
import type { FilterType } from '../../utils/points';

export default function MobileLeaderboard() {
  const navigate = useNavigate();
  const { currentSalesId } = useCurrentSales();
  const { sales, activities, prospek, systemTargets } = useSalesData();
  const [filterDate, setFilterDate] = useState<FilterType>('month');

  const leaderboardData = useMemo(() => {
    return sales.map(s => {
      const { totalActual, breakdown } = calculateSalesPoints(
        s.id, 
        activities, 
        prospek, 
        systemTargets, 
        filterDate
      );
      
      return { 
        ...s, 
        actualPoints: totalActual, 
        percent: Math.min(100, Math.round((totalActual / (systemTargets?.ind_poin || 150)) * 100)),
        totalVisit: breakdown.visitProspek + breakdown.visitCustomer, 
        closingCount: breakdown.closing
      };
    }).sort((a, b) => b.actualPoints - a.actualPoints);
  }, [sales, activities, prospek, systemTargets, filterDate]);

  const top3 = leaderboardData.slice(0, 3);

  return (
    <div className="page-content" style={{ paddingBottom: '30px', background: 'var(--bg-deep)', minHeight: '100vh' }}>
      
      {/* Top Header - Premium Grab Style */}
      <div className="yellow-bg-top" style={{ 
        height: '180px', 
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 24px 20px',
        zIndex: 100
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '10px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 6 }}>
          <button 
            className="tap-active" 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'rgba(255,255,255,0.45)', 
              border: '1px solid rgba(255,255,255,0.3)', 
              borderRadius: '16px', 
              width: '46px', height: '46px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.03)'
            }}
          >
            <ChevronLeft size={24} color="#111827" strokeWidth={3} />
          </button>
          <h2 className="hero-premium-title" style={{ fontSize: '24px', margin: 0 }}>Leaderboard</h2>
        </div>
      </div>

      {/* Podium Background */}
      <div className="hero-gradient" style={{ padding: '40px 20px 80px', position: 'relative' }}>
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 0%, var(--bg-deep) 100%)' }} />
         
         {/* Filter Pilihan Waktu */}
         <div style={{ position: 'relative', zIndex: 5, display: 'flex', background: 'rgba(17,24,39,0.1)', borderRadius: '16px', padding: '4px', marginBottom: '40px', border: '1px solid rgba(17,24,39,0.05)' }}>
           {(['today', 'week', 'month'] as FilterType[]).map(opt => (
             <button 
               key={opt}
               onClick={() => setFilterDate(opt)}
               style={{ 
                 flex: 1, padding: '10px 0', borderRadius: '12px', border: 'none', 
                 fontSize: '13px', fontWeight: 800, textTransform: 'capitalize',
                 background: filterDate === opt ? '#111827' : 'transparent',
                 color: filterDate === opt ? '#fff' : '#111827',
                 transition: 'all 0.3s'
               }}
             >
               {opt === 'today' ? 'Hari Ini' : opt === 'week' ? 'Minggu' : 'Bulan'}
             </button>
           ))}
         </div>

         {/* PODIUM AREA */}
         <div style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', height: '180px' }}>
           
            {/* Rank 2 (Left) */}
           {top3[1] && (
             <div className="animate-fade-up" style={{ textAlign: 'center', flex: 1, animationDelay: '0.2s' }}>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <img src="/assets/image/Rank 2.png" alt="Rank 2" style={{ width: '76px', height: '76px', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }} />
                  <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: '#94a3b8', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>2</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>{top3[1].nama}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', background: 'rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>{top3[1].actualPoints} Poin</div>
             </div>
           )}

           {/* Rank 1 (Center) */}
           {top3[0] && (
             <div className="animate-fade-up" style={{ textAlign: 'center', flex: 1.3, transform: 'translateY(-24px)', animationDelay: '0s' }}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <img src="/assets/image/Rank 1.png" alt="Rank 1" style={{ width: '110px', height: '110px', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(234,179,8,0.5))' }} />
                  <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#eab308', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3.5px solid #fff', boxShadow: '0 8px 16px rgba(234,179,8,0.3)' }}>1</div>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 950, color: '#0f172a', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>{top3[0].nama}</div>
                <div style={{ fontSize: '13px', fontWeight: 950, color: '#a16207', background: '#fef9c3', padding: '4px 14px', borderRadius: '24px', display: 'inline-block', marginTop: '8px', border: '1.5px solid #fde047', boxShadow: '0 4px 12px rgba(234,179,8,0.15)' }}>{top3[0].actualPoints} Poin</div>
             </div>
           )}

           {/* Rank 3 (Right) */}
           {top3[2] && (
             <div className="animate-fade-up" style={{ textAlign: 'center', flex: 1, animationDelay: '0.4s' }}>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <img src="/assets/image/Rank 3.png" alt="Rank 3" style={{ width: '76px', height: '76px', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }} />
                  <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: '#b45309', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>3</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>{top3[2].nama}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', background: 'rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>{top3[2].actualPoints} Poin</div>
             </div>
           )}
         </div>
      </div>

      {/* REST OF THE LIST */}
      <div style={{ padding: '30px 20px', position: 'relative', zIndex: 10, marginTop: '-40px' }}>
         <div className="shadow-premium" style={{ background: '#fff', borderRadius: '30px', padding: '16px', border: '1px solid rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 10px 20px' }}>Other Rankings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {leaderboardData.slice(3).map((s, idx) => {
                 const isMe = s.id === currentSalesId;
                 return (
                   <div 
                     key={idx} 
                     className="tap-active"
                     style={{ 
                       display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', 
                       borderRadius: '20px', background: isMe ? '#eff6ff' : '#f8fafc', 
                       border: isMe ? '1.5px solid #3b82f6' : '1px solid #f1f5f9',
                       position: 'relative'
                     }}
                   >
                      {isMe && (
                        <div style={{ position: 'absolute', top: -10, left: 20, background: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
                          PERINGKAT ANDA
                        </div>
                      )}
                      <div style={{ fontSize: '16px', fontWeight: 950, color: isMe ? '#3b82f6' : '#94a3b8', width: '24px' }}>
                        {leaderboardData.findIndex(item => item.id === s.id) + 1}
                      </div>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: isMe ? '#3b82f6' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: isMe ? '#fff' : '#475569' }}>
                        {s.nama.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{s.nama}</div>
                         <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginTop: '2px' }}>{s.percent}% Capaian Target</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '16px', fontWeight: 950, color: '#111827' }}>{s.actualPoints}</div>
                         <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>Poin</div>
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </div>

    </div>
  );
}
