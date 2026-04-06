import { useMemo, useState, useEffect } from 'react';
import { Award, TrendingUp, Filter } from 'lucide-react';
import { useSalesData } from '../../hooks/useSalesData';

export default function Leaderboard() {
  const { sales, activities, prospek, systemTargets } = useSalesData();

  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterSales, setFilterSales] = useState<string>('All');

  useEffect(() => {
    // Standardize title management
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { 
        title: 'Leaderboard', 
        sub: 'Peringkat kinerja sales berdasarkan total poin aktivitas' 
      } 
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  const leaderboardData = useMemo(() => {
    const now = new Date();
    const todayMs = new Date(now.setHours(0,0,0,0)).getTime();
    const weekMs = todayMs - (7 * 86400000);
    const monthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filteredSales = filterSales === 'All' ? sales : sales.filter(s => s.id === filterSales);

    return filteredSales.map(s => {
      const targetPoin = systemTargets?.ind_poin ?? 150;

      let sActs = activities.filter(a => a.id_sales === s.id);
      let sProspek = prospek.filter(p => p.sales_owner === s.id);

      let thresholdStart = 0;
      let thresholdEnd = new Date().getTime();
      let prevStart = 0;
      let prevEnd = 0;

      if (filterDate === 'today') {
        thresholdStart = todayMs;
        prevStart = todayMs - 86400000;
        prevEnd = todayMs - 1;
      } else if (filterDate === 'week') {
        thresholdStart = weekMs;
        prevStart = weekMs - (7 * 86400000);
        prevEnd = weekMs - 1;
      } else if (filterDate === 'month') {
        thresholdStart = monthMs;
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        prevEnd = monthMs - 1;
      } else if (filterDate === 'last_month') {
        thresholdStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        thresholdEnd = monthMs - 1;
        prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime();
        prevEnd = thresholdStart - 1;
      }

      let currentActs = sActs;
      let currentProspek = sProspek;
      if (filterDate !== 'all') {
        currentActs = sActs.filter(a => { const t = new Date(a.timestamp).getTime(); return t >= thresholdStart && t <= thresholdEnd; });
        currentProspek = sProspek.filter(p => { const t = new Date(p.created_at).getTime(); return t >= thresholdStart && t <= thresholdEnd; });
      }

      let prevActs = [] as typeof activities;
      let prevProspekArr = [] as typeof prospek;
      if (filterDate !== 'all') {
        prevActs = sActs.filter(a => { const t = new Date(a.timestamp).getTime(); return t >= prevStart && t <= prevEnd; });
        prevProspekArr = sProspek.filter(p => { const t = new Date(p.created_at).getTime(); return t >= prevStart && t <= prevEnd; });
      }

      const closingCount = currentActs.filter(a => a.catatan_hasil.toLowerCase().includes('closing')).length;
      const totalVisit = currentActs.filter(a => a.tipe_aksi === 'Visit').length;
      const totalProspek = currentProspek.length;
      const totalSO = currentActs.filter(a => a.tipe_aksi === 'Order').length;
      // Followup mencakup WA + Call (maint sudah digabung)
      const totalFollowup = currentActs.filter(a => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length;

      const prevClosing = prevActs.filter(a => a.catatan_hasil.toLowerCase().includes('closing')).length;
      const prevVisit = prevActs.filter(a => a.tipe_aksi === 'Visit').length;
      const prevProspekCount = prevProspekArr.length;
      const prevSO = prevActs.filter(a => a.tipe_aksi === 'Order').length;
      const prevFollowup = prevActs.filter(a => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length;

      const actualPoints =
        (totalVisit * (systemTargets?.b_visit ?? 1)) +
        (closingCount * (systemTargets?.b_closing ?? 20)) +
        (totalProspek * (systemTargets?.b_prospek ?? 5)) +
        (totalSO * (systemTargets?.b_order ?? 1)) +
        (totalFollowup * (systemTargets?.b_chat ?? 1));

      const prevPoints =
        (prevVisit * (systemTargets?.b_visit ?? 1)) +
        (prevClosing * (systemTargets?.b_closing ?? 20)) +
        (prevProspekCount * (systemTargets?.b_prospek ?? 5)) +
        (prevSO * (systemTargets?.b_order ?? 1)) +
        (prevFollowup * (systemTargets?.b_chat ?? 1));

      // Progress bisa melebihi 100% (overperformance)
      const percent = targetPoin > 0 ? Math.round((actualPoints / targetPoin) * 100) : 0;
      const prevPercent = targetPoin > 0 ? Math.round((prevPoints / targetPoin) * 100) : 0;

      return {
        ...s, targetPoin,
        actualPoints, prevPoints,
        percent, prevPercent,
        closingCount, prevClosing,
        totalVisit, prevVisit,
        totalProspek, prevProspekCount,
        totalSO, prevSO,
        totalFollowup, prevFollowup
      };
    }).sort((a, b) => b.actualPoints - a.actualPoints);
  }, [sales, activities, prospek, systemTargets, filterDate, filterSales]);

  const Delta = ({ cur, prev }: { cur: number, prev: number }) => {
    if (filterDate === 'all') return null;
    if (cur > prev) return <span style={{color: '#10b981', fontSize: '11px', marginLeft: '4px', fontWeight: 800}}>▲{cur - prev}</span>;
    if (cur < prev) return <span style={{color: '#ef4444', fontSize: '11px', marginLeft: '4px', fontWeight: 800}}>▼{prev - cur}</span>;
    return <span style={{color: '#94a3b8', fontSize: '11px', marginLeft: '4px', fontWeight: 800}}>—</span>;
  };

  // Stat pill definition: uniform style for podium cards (no icons)
  const statDefs = [
    { key: 'totalVisit',    label: 'Visit' },
    { key: 'closingCount',  label: 'Closing' },
    { key: 'totalProspek',  label: 'Prospek' },
    { key: 'totalSO',       label: 'SO' },
    { key: 'totalFollowup', label: 'Followup' },
  ];

  const PodCard = ({ data, rank }: { data: any, rank: number }) => {
    // Unified dark luxury theme — differentiated only by accent color
    const accent = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : '#cd7f32';
    const accentShadow = rank === 1
      ? '0 20px 50px -10px rgba(245,158,11,0.35)'
      : rank === 2
      ? '0 20px 50px -10px rgba(148,163,184,0.2)'
      : '0 20px 50px -10px rgba(205,127,50,0.25)';

    const medalColor = rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : '#b45309';

    return (
      <div
        style={{ width: '100%', height: '100%', background: '#1e293b', borderRadius: '20px', border: `2px solid ${accent}`, boxShadow: accentShadow, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'transform 0.3s', cursor: 'default' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {/* Colored accent strip at top */}
        <div style={{ height: '4px', background: accent, width: '100%', flexShrink: 0 }} />

        <div style={{ padding: '20px 24px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Rank Emblem */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '20px', position: 'relative' }}>
            {rank <= 3 && (
              <div style={{ position: 'absolute', top: rank === 1 ? '-86px' : '-61px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                <img
                  src={`/assets/image/Rank ${rank}.png`}
                  alt={`Rank ${rank}`}
                  style={{ width: rank === 1 ? '170px' : '120px', height: rank === 1 ? '170px' : '120px', objectFit: 'contain', filter: 'brightness(1.05)' }}
                />
                <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '32px', height: '32px', background: medalColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 900, border: '3px solid #1e293b', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                  {rank}
                </div>
              </div>
            )}

            <div style={{ height: rank === 1 ? '90px' : '65px', width: '100%' }}></div>

            {/* Name */}
            <div style={{ width: '100%', textAlign: 'center', padding: '0 8px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.nama}</h3>
            </div>
          </div>

          {/* Stats: dark panel */}
          <div style={{ background: '#0f172a', borderRadius: '14px', padding: '14px 10px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', width: '100%', gap: '4px' }}>
              {statDefs.map(({ key, label }, i) => (
                <div key={key} style={{ textAlign: 'center', padding: '8px 4px', borderRight: i < statDefs.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{data[key]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom pills */}
          <div style={{ display: 'flex', width: '100%', gap: '10px', marginTop: 'auto' }}>
            <div style={{ flex: 1, background: `${accent}22`, border: `1px solid ${accent}55`, borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: accent, fontWeight: 900, fontSize: '14px' }}>
              <Award size={16} strokeWidth={2.5} /> {data.actualPoints} Poin
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', fontWeight: 900, fontSize: '14px' }}>
              <TrendingUp size={16} strokeWidth={2.5} /> {data.percent}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mgr-page" style={{ padding: '0 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>


      {/* FILTERS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '8px 16px', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Filter size={14} color="#94a3b8" />
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Waktu:</span>
          <select
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ border: 'none', padding: '0', outline: 'none', fontSize: '13px', fontWeight: 800, color: '#0f172a', background: 'transparent', cursor: 'pointer' }}
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '8px 16px', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Sales:</span>
          <select
            value={filterSales}
            onChange={e => setFilterSales(e.target.value)}
            style={{ border: 'none', padding: '0', outline: 'none', fontSize: '13px', fontWeight: 800, color: '#0f172a', background: 'transparent', cursor: 'pointer', maxWidth: '140px' }}
          >
            <option value="All">Semua Sales</option>
            {sales.map(s => (
              <option key={s.id} value={s.id}>{s.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      <div className="db-podium-grid">
        {leaderboardData[0] && <PodCard data={leaderboardData[0]} rank={1} />}
        {leaderboardData[1] && <PodCard data={leaderboardData[1]} rank={2} />}
        {leaderboardData[2] && <PodCard data={leaderboardData[2]} rank={3} />}
      </div>

      {/* GLOBAL RANKING TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
        {/* Table Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            🏆 Global Ranking
          </h2>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{leaderboardData.length} Sales Terdaftar</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 24px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rank</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Sales</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visit</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Closing</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prospek</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SO</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followup</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Poin</th>
              <th style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((s, idx) => {
              const rankColors = ['#eab308', '#94a3b8', '#d97706'];
              const rankBg = idx < 3 ? rankColors[idx] : '#e2e8f0';
              const rankTextColor = idx < 3 ? '#fff' : '#64748b';
              const isTop = idx === 0;
              const progressColor = s.percent >= 100 ? '#10b981' : s.percent >= 70 ? '#3b82f6' : '#f59e0b';

              return (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer', background: isTop ? '#fffdf5' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = isTop ? '#fffdf5' : 'transparent'}
                >
                  {/* Rank */}
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: rankBg, color: rankTextColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, boxShadow: idx < 3 ? '0 2px 6px rgba(0,0,0,0.15)' : 'none' }}>
                      {idx + 1}
                    </div>
                  </td>

                  {/* Name Only */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{s.nama}</div>
                  </td>

                  {/* Stats - all uniform style */}
                  <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                    {s.totalVisit}<Delta cur={s.totalVisit} prev={s.prevVisit} />
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                    {s.closingCount}<Delta cur={s.closingCount} prev={s.prevClosing} />
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                    {s.totalProspek}<Delta cur={s.totalProspek} prev={s.prevProspekCount} />
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                    {s.totalSO}<Delta cur={s.totalSO} prev={s.prevSO} />
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                    {s.totalFollowup}<Delta cur={s.totalFollowup} prev={s.prevFollowup} />
                  </td>

                  {/* Total Points */}
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>
                      {s.actualPoints}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px', fontWeight: 600 }}>pts</span>
                    <Delta cur={s.actualPoints} prev={s.prevPoints} />
                  </td>

                  {/* Progress Bar */}
                  <td style={{ padding: '12px 16px', minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(s.percent, 100)}%`, height: '100%', background: progressColor, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: progressColor, minWidth: '38px', textAlign: 'right' }}>{s.percent}%</span>
                    </div>
                    <Delta cur={s.percent} prev={s.prevPercent} />
                  </td>
                </tr>
              );
            })}
            {leaderboardData.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontWeight: 600 }}>Belum ada data salesman terdaftar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
