import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useSalesData } from '../../hooks/useSalesData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';
import { AlertCircle, Users, Star } from 'lucide-react';
import { calculateSalesPoints } from '../../utils/points';
import type { FilterType } from '../../utils/points';

interface Props { salesId: string; }

export default function DashboardTarget({ salesId }: Props) {
  const { activities, prospek, customers, systemTargets } = useSalesData();
  
  const [filterType, setFilterType] = useState<FilterType>('month');

  const { totalActual, rating, breakdown, filteredActs } = useMemo(() => 
    calculateSalesPoints(salesId, activities, prospek, systemTargets, filterType),
    [salesId, activities, prospek, systemTargets, filterType]
  );

  // Live date tracking for midnight transitions
  const [todayStr, setTodayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const interval = setInterval(() => {
      const current = format(new Date(), 'yyyy-MM-dd');
      if (current !== todayStr) setTodayStr(current);
    }, 10000);
    return () => clearInterval(interval);
  }, [todayStr]);

  const {
    followup: followupCount,
    order: soCount,
    visitProspek: visitCount,
    visitCustomer: maintCount,
    closing: closingCount,
    newProspek: prospekCount
  } = breakdown;

  const activityTrendData = useMemo(() => {
    const data: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const comparisonStr = format(d, 'yyyy-MM-dd');
      const dayStr = format(d, 'iii d', { locale: localeId });
      
      const actsForDay = filteredActs.filter((a: any) => {
        return format(new Date(a.timestamp), 'yyyy-MM-dd') === comparisonStr;
      });
      data.push({ name: dayStr, Aktivitas: actsForDay.length });
    }
    return data;
  }, [filteredActs, todayStr]);

  const totalTarget = systemTargets?.ind_poin ?? 150;
  const overallPct = Math.min(100, totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0);

  // ─── Donut Ring ────────────────────────────────────────────────
  const r = 70; const cx = 90; const cy = 90;
  const circumference = 2 * Math.PI * r;
  const dash = (overallPct / 100) * circumference;

  // ─── Progress Performance (5 indicators, inline in JSX) ────────
  // ─── Informasi Data ───────────────────────────────────────────
  // Prospek Outstanding > 14 hari (belum ada aktivitas selama 14+ hari)
  const now14 = new Date();
  const day14Ms = 14 * 24 * 60 * 60 * 1000;
  const myProspek = prospek.filter(p => p.sales_owner === salesId);

  const prospekOutstanding = myProspek.filter(p => {
    // Find last activity for this prospek
    const lastAct = activities
      .filter(a => a.target_id === p.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    const lastContact = lastAct ? new Date(lastAct.timestamp) : new Date(p.created_at);
    return (now14.getTime() - lastContact.getTime()) > day14Ms;
  });

  // Customer Aktif vs Tidak Aktif (aktif = order dalam 30 hari terakhir)
  const myCustomers = customers.filter(c => c.sales_pic === salesId);
  const day30Ms = 30 * 24 * 60 * 60 * 1000;
  const customerAktif = myCustomers.filter(c => {
    const lastOrder = activities
      .filter(a => a.target_id === c.id && a.tipe_aksi === 'Order')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    if (!lastOrder) return false;
    return (now14.getTime() - new Date(lastOrder.timestamp).getTime()) <= day30Ms;
  });
  const customerTidakAktif = myCustomers.filter(c => {
    const lastOrder = activities
      .filter(a => a.target_id === c.id && a.tipe_aksi === 'Order')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    if (!lastOrder) return true; // Belum pernah order
    return (now14.getTime() - new Date(lastOrder.timestamp).getTime()) > day30Ms;
  });

  const topActiveCustomers = useMemo(() => {
    return myCustomers
      .map(c => {
        const orderCount = filteredActs.filter(
          (a: any) => a.target_id === c.id && a.tipe_aksi === 'Order'
        ).length;
        return { ...c, orderCount };
      })
      .filter(c => c.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
  }, [myCustomers, filteredActs]);

  const maxOrderCount = topActiveCustomers[0]?.orderCount ?? 1;

  return (
    <div className="page-content" style={{ paddingBottom: '100px', position: 'relative' }}>
      
      {/* Top Header - Premium Grab Style */}
      <div className="yellow-bg-top" style={{ 
        padding: '0 24px 20px', 
        height: '280px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 50,
        marginBottom: '-60px'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(45px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '10px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 6 }}>
        <div className="page-title-row" style={{ marginBottom: '16px', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 className="hero-premium-title" style={{ fontSize: '24px', margin: 0 }}>Analytics</h2>
              <div style={{ background: '#111827', color: '#FFCC00', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={10} fill="#FFCC00" strokeWidth={3} /> {rating.toFixed(1)} STARS
              </div>
            </div>
            <div className="hero-premium-subtitle">Performance & Goals</div>
          </div>
        </div>

        {/* Date Filter Chips - More Compact Integrated Style */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px', overflowX: 'auto', paddingBottom: '10px' }}>
          {(['today', 'week', 'month', 'all'] as const).map(opt => (
            <button 
              key={opt}
              onClick={() => setFilterType(opt)}
              style={{ 
                padding: '8px 16px', borderRadius: '14px', fontSize: '12px', fontWeight: 800, border: 'none', 
                background: filterType === opt ? '#111827' : 'rgba(255,255,255,0.4)', 
                color: filterType === opt ? '#FFCC00' : '#111827', 
                boxShadow: filterType === opt ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                whiteSpace: 'nowrap', transition: 'all 0.2s' 
              }}>
              {opt === 'today' ? 'Hari Ini' : opt === 'week' ? 'Minggu Ini' : opt === 'month' ? 'Bulan Ini' : 'Semua'}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 60, marginTop: '20px' }}>
        {/* Donut Ring - Optimized for maximum number clearance */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%', 
          padding: '0 8px',
          marginTop: '10px',
          gap: '4px'
        }}>
          {/* Aktual Column */}
          <div style={{ textAlign: 'center', color: '#111827', flex: '1', minWidth: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.6, marginBottom: '2px' }}>Aktual</div>
            <div style={{ fontSize: '17px', fontWeight: 950, letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{totalActual.toLocaleString('id-ID')}</div>
          </div>

          {/* Center Donut - Shrunk for side space */}
          <div style={{ 
            position: 'relative', width: '165px', height: '165px', background: '#fff', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            flexShrink: 0
          }}>
            <svg width="145" height="145" viewBox="0 0 180 180" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="solidYellow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f8fafc" strokeWidth="15" />
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#solidYellow)" strokeWidth="15"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round" transform="rotate(-90 90 90)"
                style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981', letterSpacing: '1px', marginBottom: '-2px' }}>CAPAIAN</span>
              <span style={{ fontSize: '36px', fontWeight: 950, color: '#0f172a', letterSpacing: '-2px', margin: '1px 0' }}>{overallPct}%</span>
              <span style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Performance</span>
            </div>
          </div>

          {/* Target Column */}
          <div style={{ textAlign: 'center', color: '#111827', flex: '1', minWidth: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.6, marginBottom: '2px' }}>Poin Minimal</div>
            <div style={{ fontSize: '17px', fontWeight: 950, letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{totalTarget.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      {/* ─── INFORMASI DATA ─────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, margin: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingLeft: '4px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Informasi Data</h3>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '8px' }}>Butuh Perhatian</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Prospek Outstanding > 14 Hari */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: prospekOutstanding.length > 0 ? '1.5px solid #FECACA' : '1.5px solid #DCFCE7' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: prospekOutstanding.length > 0 ? '16px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: prospekOutstanding.length > 0 ? '#FEF2F2' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={22} color={prospekOutstanding.length > 0 ? '#EF4444' : '#22C55E'} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Prospek Tidak Aktif</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Belum disentuh lebih dari 14 hari</div>
                </div>
              </div>
              <div style={{ 
                fontSize: '22px', fontWeight: 900, 
                color: prospekOutstanding.length > 0 ? '#EF4444' : '#22C55E',
                background: prospekOutstanding.length > 0 ? '#FEF2F2' : '#F0FDF4',
                width: '48px', height: '48px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {prospekOutstanding.length}
              </div>
            </div>
            {prospekOutstanding.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prospekOutstanding.slice(0, 3).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFF7F7', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{p.nama_toko}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{p.area} · {p.status}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#EF4444', background: '#FEE2E2', padding: '3px 8px', borderRadius: '8px' }}>
                      &gt;14 hari
                    </span>
                  </div>
                ))}
                {prospekOutstanding.length > 3 && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', padding: '4px' }}>
                    +{prospekOutstanding.length - 3} prospek lainnya
                  </div>
                )}
              </div>
            )}
            {prospekOutstanding.length === 0 && (
              <div style={{ fontSize: '12px', color: '#22C55E', fontWeight: 700, marginTop: '4px', paddingLeft: '56px' }}>
                Semua prospek terpantau dengan baik ✓
              </div>
            )}
          </div>

          {/* Customer Aktif vs Tidak Aktif */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1.5px solid #E0F2FE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="#3B82F6" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Status Customer</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total {myCustomers.length} customer terdaftar</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Aktif */}
              <div style={{ background: '#F0FDF4', borderRadius: '16px', padding: '16px', border: '1.5px solid #DCFCE7', textAlign: 'center' }}>
                <div style={{ fontSize: '30px', fontWeight: 900, color: '#22C55E', lineHeight: 1 }}>{customerAktif.length}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#15803D', marginTop: '6px' }}>✓ Aktif</div>
                <div style={{ fontSize: '11px', color: '#86EFAC', fontWeight: 600, marginTop: '2px' }}>Order &lt;30 hari</div>
              </div>
              {/* Tidak Aktif */}
              <div style={{ background: '#FFF7F7', borderRadius: '16px', padding: '16px', border: '1.5px solid #FECACA', textAlign: 'center' }}>
                <div style={{ fontSize: '30px', fontWeight: 900, color: '#EF4444', lineHeight: 1 }}>{customerTidakAktif.length}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>✗ Tidak Aktif</div>
                <div style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 600, marginTop: '2px' }}>Belum/habis order</div>
              </div>
            </div>

            {/* Progress bar aktif */}
            {myCustomers.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  <span>Tingkat Aktivitas Customer</span>
                  <span>{Math.round((customerAktif.length / myCustomers.length) * 100)}%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((customerAktif.length / myCustomers.length) * 100)}%`, background: 'linear-gradient(90deg, #22C55E, #16A34A)', borderRadius: '4px', transition: 'width 1s ease' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── TOP ACTIVE CUSTOMER ────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, margin: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Top Customer Aktif</h3>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, margin: '2px 0 0 0' }}>Berdasarkan frekuensi order terbanyak</p>
          </div>
          {topActiveCustomers.length > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#8B5CF6', background: '#F5F3FF', padding: '3px 10px', borderRadius: '10px' }}>
              Top {topActiveCustomers.length}
            </span>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          {topActiveCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>Belum ada data order</div>
              <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>Tekan tombol Order saat kunjungan customer</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topActiveCustomers.map((c, idx) => {
                const rankColors = ['#F59E0B', '#94a3b8', '#CD7F32', '#6366f1', '#10B981'];
                const rankBg    = ['#FFFBEB', '#F8FAFC', '#FFF7ED', '#EEF2FF', '#ECFDF5'];
                const barWidth  = Math.round((c.orderCount / maxOrderCount) * 100);
                const barColor  = ['#F59E0B','#8B5CF6','#3B82F6','#10B981','#EC4899'][idx];
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Rank badge */}
                    <div style={{
                      width: '34px', height: '34px', flexShrink: 0,
                      borderRadius: '12px', background: rankBg[idx],
                      border: `1.5px solid ${rankColors[idx]}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 900, color: rankColors[idx]
                    }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                          {c.nama_toko}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: barColor, flexShrink: 0 }}>
                          {c.orderCount}× order
                        </span>
                      </div>
                      {/* frequency bar */}
                      <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barWidth}%`, background: barColor, borderRadius: '4px', transition: 'width 1s ease' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '3px' }}>{c.area}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── PROGRESS PERFORMANCE (Bar Chart) ─────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, margin: '24px 16px 0' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '12px', paddingLeft: '4px' }}>Progress Performance</h3>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '16px 12px 10px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={[
                { name: 'Followup', poin: followupCount * (systemTargets?.b_chat ?? 1), color: '#EC4899' },
                { name: 'SO', poin: soCount * (systemTargets?.b_order ?? 5), color: '#8B5CF6' },
                { name: 'Visit', poin: (visitCount + maintCount) * (systemTargets?.b_visit ?? 5), color: '#F59E0B' },
                { name: 'Closing', poin: closingCount * (systemTargets?.b_closing ?? 20), color: '#10B981' },
                { name: 'Prospek', poin: prospekCount * (systemTargets?.b_prospek ?? 5), color: '#3B82F6' },
              ]}
              margin={{ top: 20, right: 8, left: -24, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 700 }}
              />
              <Bar dataKey="poin" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {[
                  '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6'
                ].map((color, idx) => (
                  <Cell key={idx} fill={color} />
                ))}
                <LabelList
                  dataKey="poin"
                  position="top"
                  style={{ fontSize: '11px', fontWeight: 800, fill: '#334155' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

        </div>
      </div>

      {/* ─── ACTIVITY GRAPHIC ────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, margin: '20px 16px 0' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '12px', paddingLeft: '4px' }}>Tren Aktivitas (7 Hari)</h3>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '16px 12px 10px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="Aktivitas" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
