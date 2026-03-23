import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useSalesData } from '../../hooks/useSalesData';

export default function Leaderboard() {
  const { sales, activities, prospek } = useSalesData();

  const leaderboardData = useMemo(() => {
    return sales.map(s => {
      // Default fallback if target missing
      const targetPoin = (s.target_prospek_baru ?? 25) + (s.target_closing_baru ?? 6) + (s.target_maintenance ?? 25) + (s.target_visit ?? 50);

      const sActs = activities.filter(a => a.id_sales === s.id);
      const closingCount = sActs.filter(a => a.catatan_hasil.toLowerCase().includes('closing')).length;
      const maintenanceCount = sActs.filter(a => a.tipe_aksi === 'Visit' && a.target_type === 'customer').length;
      const totalVisit = sActs.filter(a => a.tipe_aksi === 'Visit').length;
      const totalProspek = prospek.filter(p => p.sales_owner === s.id).length;

      const actualPoints = totalProspek + closingCount + maintenanceCount + totalVisit;
      const percent = Math.min(100, Math.round((actualPoints / targetPoin) * 100)) || 0;

      return { ...s, actualPoints, targetPoin, percent };
    }).sort((a, b) => b.percent - a.percent);
  }, [sales, activities, prospek]);
  
  return (
    <div className="mgr-page">
      <div className="mgr-page-header" style={{ alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <h1 className="mgr-title">Leaderboard</h1>
          <p className="mgr-sub">Peringkat Sales dan Performa beserta Data KPI (Kalkulasi dari akumulasi poin)</p>
        </div>
      </div>
      
      <div className="activity-table-wrap" style={{ boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.7)', padding: '12px', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}>
        <table className="activity-table">
          <thead>
            <tr>
              <th>Peringkat</th>
              <th>Salesman</th>
              <th>Performa KPI</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((s, idx) => (
              <tr key={s.id} className="act-row">
                <td style={{ fontWeight: 900, color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#64748b' }}>
                  {idx === 0 ? <><Trophy size={16} style={{marginRight: '8px', color: '#eab308'}} /> Rank 1</> 
                   : idx === 1 ? <><Trophy size={16} style={{marginRight: '8px', color: '#94a3b8'}} /> Rank 2</> 
                   : idx === 2 ? <><Trophy size={16} style={{marginRight: '8px', color: '#b45309'}} /> Rank 3</> 
                   : `#${idx + 1}`}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden' }}>
                      <img src={`https://ui-avatars.com/api/?name=${s.nama}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '250px' }}>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: `${s.percent}%`, background: s.percent >= 100 ? '#10b981' : s.percent >= 50 ? '#facc15' : '#e11d48', borderRadius: '4px' }}></div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#334155', fontSize: '13px', width: '40px', textAlign: 'right' }}>{s.percent}%</span>
                  </div>
                </td>
                <td><span className="act-type-badge act-wa">Active Target</span></td>
              </tr>
            ))}
            {leaderboardData.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>Belum ada data salesman.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
