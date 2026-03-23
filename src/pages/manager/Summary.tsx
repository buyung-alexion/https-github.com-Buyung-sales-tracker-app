import { useMemo } from 'react';
import { useSalesData } from '../../hooks/useSalesData';

export default function Summary() {
  const { sales, activities, customers, prospek } = useSalesData();

  const summaryData = useMemo(() => {
    return sales.map(s => {
      const targetPoin = (s.target_prospek_baru ?? 25) + (s.target_closing_baru ?? 6) + (s.target_maintenance ?? 25) + (s.target_visit ?? 50);

      const sActs = activities.filter(a => a.id_sales === s.id);
      const closingCount = sActs.filter(a => a.catatan_hasil.toLowerCase().includes('closing')).length;
      const maintenanceCount = sActs.filter(a => a.tipe_aksi === 'Visit' && a.target_type === 'customer').length;
      
      const totalVisit = sActs.filter(a => a.tipe_aksi === 'Visit').length;
      const totalChat = sActs.filter(a => a.tipe_aksi === 'WA').length;
      const totalCall = sActs.filter(a => a.tipe_aksi === 'Call').length;
      
      const newProspek = prospek.filter(p => p.sales_owner === s.id).length;
      const newCustomer = customers.filter(c => c.sales_pic === s.id).length; 

      const actualPoints = newProspek + closingCount + maintenanceCount + totalVisit;
      const percent = Math.min(100, Math.round((actualPoints / targetPoin) * 100)) || 0;

      return { 
        ...s, 
        newCustomer, 
        newProspek, 
        totalVisit, 
        totalChat, 
        totalCall, 
        percent 
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [sales, activities, customers, prospek]);
  
  return (
    <div className="mgr-page">
      <div className="mgr-page-header" style={{ alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <h1 className="mgr-title">Summary Keaktifan</h1>
          <p className="mgr-sub">Laporan lengkap akumulasi aktivitas per Salesman</p>
        </div>
      </div>
      
      <div className="activity-table-wrap" style={{ boxShadow: '0 15px 45px -10px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.7)', padding: '12px', overflowX: 'auto', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}>
        <table className="activity-table" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th>Peringkat</th>
              <th>Salesman</th>
              <th style={{textAlign: 'center'}}>New Customer</th>
              <th style={{textAlign: 'center'}}>New Prospek</th>
              <th style={{textAlign: 'center'}}>Total Visit</th>
              <th style={{textAlign: 'center'}}>Total Chat</th>
              <th style={{textAlign: 'center'}}>Total Call</th>
              <th>Progress Rank</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((s, idx) => (
              <tr key={s.id} className="act-row">
                <td style={{ fontWeight: 900, color: idx === 0 ? '#eab308' : '#64748b' }}>#{idx + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden' }}>
                      <img src={`https://ui-avatars.com/api/?name=${s.nama}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama}</span>
                  </div>
                </td>
                <td style={{textAlign: 'center', fontWeight: 600, color: '#0f172a'}}>{s.newCustomer}</td>
                <td style={{textAlign: 'center', fontWeight: 600, color: '#0f172a'}}>{s.newProspek}</td>
                <td style={{textAlign: 'center', fontWeight: 600, color: '#0f172a'}}>{s.totalVisit}</td>
                <td style={{textAlign: 'center', fontWeight: 600, color: '#0f172a'}}>{s.totalChat}</td>
                <td style={{textAlign: 'center', fontWeight: 600, color: '#0f172a'}}>{s.totalCall}</td>
                <td style={{ fontWeight: 800, color: s.percent >= 100 ? '#10b981' : s.percent >= 50 ? '#facc15' : '#e11d48' }}>
                  {s.percent}%
                </td>
              </tr>
            ))}
            {summaryData.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>Belum ada summary data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
