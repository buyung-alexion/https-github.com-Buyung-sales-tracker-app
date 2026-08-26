import { useState, useEffect, useMemo } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { calculateSalesPoints } from '../../utils/points';
import { Filter, Trophy, Activity as ActivityIcon, Users, UserPlus, Package } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from 'recharts';

export default function PerformanceAnalytics() {
  const { sales, activities, customers, prospek, systemTargets, orders, masterAreas } = useSalesData();

  // --- FILTER STATES ---
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [salesFilter, setSalesFilter] = useState<string>('All');

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { title: 'Dashboard', sub: 'Monitoring performa penjualan dan aktivitas tim' } 
    }));
    
    // Auto-collapse sidebar to give full width view
    window.dispatchEvent(new CustomEvent('collapseSidebar', { detail: true }));
    
    return () => {
      // Re-expand sidebar when leaving if preferred, but we can leave it up to user
    };
  }, []);

  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekMs = todayMs - (7 * 86400000);
  const monthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Filter Helper
  const isDateInRange = (dateString: string | undefined | null) => {
    if (!dateString) return false;
    if (dateFilter === 'all') return true;
    const t = new Date(dateString).getTime();
    if (dateFilter === 'today') return t >= todayMs;
    if (dateFilter === 'week') return t >= weekMs;
    if (dateFilter === 'month') return t >= monthMs;
    return true;
  };

  // Derived Sales List (Filtered by Area & Salesman)
  const activeSales = useMemo(() => {
    let s = sales || [];
    if (areaFilter !== 'All') {
      s = s.filter(sale => sale.area === areaFilter);
    }
    if (salesFilter !== 'All') {
      s = s.filter(sale => sale.id === salesFilter);
    }
    return s;
  }, [sales, areaFilter, salesFilter]);

  // ----------------------------------------------------
  // 1. DATA: GRAFIK AKTIVITAS SALES
  // ----------------------------------------------------
  const activityData = useMemo(() => {
    return activeSales.map(s => {
      const salesActs = (activities || []).filter(a => a.id_sales === s.id && isDateInRange(a.timestamp));
      
      const order = salesActs.filter(a => a.tipe_aksi === 'Order').length;
      const visit = salesActs.filter(a => a.tipe_aksi === 'Visit' || a.tipe_aksi === 'Maintenance').length;
      // Closing: Customer baru yang digenerate oleh sales ini di periode ini
      const closing = (customers || []).filter(c => c.sales_pic === s.id && isDateInRange(c.created_at || c.tanggal_join)).length;
      
      return {
        name: s.nama,
        Order: order,
        Visit: visit,
        Closing: closing,
      };
    });
  }, [activeSales, activities, customers, dateFilter]);

  // ----------------------------------------------------
  // 2. DATA: TARGET DAN REALISASI (KG)
  // ----------------------------------------------------
  const targetRealisasiData = useMemo(() => {
    return activeSales.map(s => {
      // Menghitung target berdasar akumulasi target_volume per customer yang dimiliki sales
      const salesCustomers = (customers || []).filter(c => c.sales_pic === s.id);
      const targetKg = salesCustomers.reduce((sum, c) => sum + (Number((c as any).target_volume) || 0), 0) || 1; // Fallback 1 untuk hindari div by 0

      // Hitung total realisasi dari orders (asumsi amount adalah KG)
      const salesOrders = (orders || []).filter(o => o.sales_id === s.id && isDateInRange(o.created_at));
      const totalKg = salesOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      
      let percent = Math.round((totalKg / targetKg) * 100);
      if (percent > 100) percent = 100;
      
      return {
        id: s.id,
        name: s.nama,
        avatar: s.nama.charAt(0).toUpperCase(),
        realisasi: totalKg,
        target: targetKg,
        percent: percent
      };
    }).sort((a, b) => b.realisasi - a.realisasi);
  }, [activeSales, orders, customers, systemTargets, dateFilter]);

  // ----------------------------------------------------
  // 3. DATA: SALES LEADERBOARD (POIN)
  // ----------------------------------------------------
  const leaderboardData = useMemo(() => {
    return activeSales.map(s => {
      // Calculate points
      const res = calculateSalesPoints(s.id, activities || [], prospek || [], systemTargets, dateFilter);
      return {
        name: s.nama,
        poin: res.totalActual,
      };
    }).sort((a, b) => b.poin - a.poin);
  }, [activeSales, activities, prospek, systemTargets, dateFilter]);


  // ----------------------------------------------------
  // 4. KPI STATS
  // ----------------------------------------------------
  const kpiStats = useMemo(() => {
    const actCount = (activities || []).filter(a => isDateInRange(a.timestamp)).length;
    const custCount = (customers || []).filter(c => isDateInRange(c.created_at || c.tanggal_join)).length;
    const prospekCount = (prospek || []).filter(p => isDateInRange(p.created_at)).length;
    const totalKg = (orders || []).filter(o => isDateInRange(o.created_at)).reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const orderCount = (orders || []).filter(o => isDateInRange(o.created_at)).length;
    return { actCount, custCount, prospekCount, totalKg, orderCount };
  }, [activities, customers, prospek, orders, dateFilter]);

  // CIRCULAR PROGRESS COMPONENT
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 80 ? '#10b981' : percentage >= 40 ? '#3b82f6' : '#ef4444';
    
    return (
      <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="20" cy="20" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
          <circle 
            cx="20" cy="20" r={radius} fill="none" stroke={color} strokeWidth="4" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="mgr-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '0px 0 40px' }}>
      
      {/* 1. HEADER & MASTER FILTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0 }}>Dashboard Analytics</h2>
           <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Rangkuman performa dan pencapaian target tim</div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#fff', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 800, fontSize: '12px', marginRight: '4px' }}>
            <Filter size={14} /> FILTER
          </div>
          
          <select 
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', color: '#475569', fontWeight: 700, cursor: 'pointer', background: '#f8fafc' }}
            value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)}
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
          </select>
          
          <select 
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', color: '#475569', fontWeight: 700, cursor: 'pointer', background: '#f8fafc' }}
            value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
          >
            <option value="All">Semua Wilayah</option>
            {(masterAreas || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select 
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', color: '#475569', fontWeight: 700, cursor: 'pointer', background: '#f8fafc' }}
            value={salesFilter} onChange={(e) => setSalesFilter(e.target.value)}
          >
            <option value="All">Semua Sales</option>
            {(sales || []).map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', gap: '20px', color: '#fff' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ActivityIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Aktivitas</div>
            <div style={{ fontSize: '28px', fontWeight: 950, color: '#fff', lineHeight: 1.2 }}>{kpiStats.actCount}</div>
          </div>
        </div>
        
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '20px', color: '#fff' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customer</div>
            <div style={{ fontSize: '28px', fontWeight: 950, color: '#fff', lineHeight: 1.2 }}>{kpiStats.custCount}</div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: '20px', color: '#fff' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Prospek</div>
            <div style={{ fontSize: '28px', fontWeight: 950, color: '#fff', lineHeight: 1.2 }}>{kpiStats.prospekCount}</div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: '20px', color: '#fff' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Penjualan (KG)</div>
            <div style={{ fontSize: '28px', fontWeight: 950, color: '#fff', lineHeight: 1.2 }}>{kpiStats.totalKg.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      {/* GLOBAL PROGRESS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Progress Penjualan */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            const globalTargetKg = (customers || []).filter(c => activeSales.some(s => s.id === c.sales_pic)).reduce((sum, c) => sum + (Number((c as any).target_volume) || 0), 0) || 1;
            const globalRealisasiKg = kpiStats.totalKg;
            let pctKg = Math.round((globalRealisasiKg / globalTargetKg) * 100);
            if (pctKg > 100) pctKg = 100;
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>Target Penjualan</div>
                  <div style={{ fontSize: '20px', fontWeight: 950, color: '#1e293b' }}>{globalRealisasiKg.toLocaleString('id-ID')} <span style={{ fontSize: '12px', color: '#64748b' }}>/ {globalTargetKg.toLocaleString('id-ID')} Kg</span></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 800 }}>
                  <span style={{ color: '#059669' }}>Tercapai: {globalRealisasiKg.toLocaleString('id-ID')} Kg</span>
                  <span style={{ color: '#f59e0b' }}>Sisa: {Math.max(0, globalTargetKg - globalRealisasiKg).toLocaleString('id-ID')} Kg</span>
                </div>
                <div style={{ height: '20px', background: '#fef3c7', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${pctKg}%`, background: '#10b981', height: '100%', transition: 'width 1s ease-in-out' }} />
                  {pctKg < 100 && <div style={{ width: `${100 - pctKg}%`, background: '#f59e0b', height: '100%', transition: 'width 1s ease-in-out' }} />}
                </div>
              </>
            );
          })()}
        </div>

        {/* Progress Poin */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            const targetPoinPerSales = systemTargets?.ind_poin || 150;
            const globalTargetPoin = targetPoinPerSales * (activeSales.length || 1);
            const globalRealisasiPoin = activeSales.reduce((sum, s) => sum + calculateSalesPoints(s.id, activities || [], prospek || [], systemTargets, dateFilter).totalActual, 0);
            let pctPoin = Math.round((globalRealisasiPoin / globalTargetPoin) * 100);
            if (pctPoin > 100) pctPoin = 100;
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>Target Poin Produktivitas</div>
                  <div style={{ fontSize: '20px', fontWeight: 950, color: '#1e293b' }}>{globalRealisasiPoin.toLocaleString('id-ID')} <span style={{ fontSize: '12px', color: '#64748b' }}>/ {globalTargetPoin.toLocaleString('id-ID')} Poin</span></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 800 }}>
                  <span style={{ color: '#2563eb' }}>Tercapai: {globalRealisasiPoin.toLocaleString('id-ID')} Poin</span>
                  <span style={{ color: '#ef4444' }}>Kurang: {Math.max(0, globalTargetPoin - globalRealisasiPoin).toLocaleString('id-ID')} Poin</span>
                </div>
                <div style={{ height: '20px', background: '#fee2e2', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${pctPoin}%`, background: '#3b82f6', height: '100%', transition: 'width 1s ease-in-out' }} />
                  {pctPoin < 100 && <div style={{ width: `${100 - pctPoin}%`, background: '#ef4444', height: '100%', transition: 'width 1s ease-in-out' }} />}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* 2. GRAFIK AKTIVITAS SALES (BAR CHART) */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', minWidth: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>PT INDUSTRI KELUARGA TIMUR</div>
          <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#b91c1c', margin: 0 }}>Grafik Aktivitas Sales</h3>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '8px' }}>Periode: {dateFilter === 'all' ? 'Semua Waktu' : dateFilter === 'month' ? 'Bulan Ini' : dateFilter === 'week' ? 'Minggu Ini' : 'Hari Ini'}</div>
        </div>

        <div style={{ height: '400px', width: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '8px' }}>
          <div style={{ minWidth: `${Math.max(600, activityData.length * 100)}px`, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              
              <Bar dataKey="Order" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="Order" position="top" style={{ fontSize: '11px', fontWeight: 900, fill: '#1e293b' }} />
              </Bar>
              <Bar dataKey="Visit" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="Visit" position="top" style={{ fontSize: '11px', fontWeight: 900, fill: '#1e293b' }} />
              </Bar>
              <Line type="monotone" dataKey="Closing" stroke="#F59E0B" strokeWidth={3} dot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }}>
                <LabelList dataKey="Closing" position="top" style={{ fontSize: '11px', fontWeight: 900, fill: '#F59E0B' }} />
              </Line>
            </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

        {/* 4. SALES LEADERBOARD */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', minWidth: 0 }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 950, margin: 0, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="#b45309" /> Sales Rank
            </h3>
          </div>

          <div style={{ width: '100%', overflowY: 'auto', maxHeight: '400px', paddingRight: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '12px 0' }}>
              {leaderboardData.map((d, idx) => {
                const color = idx === 0 ? '#10B981' : idx === 1 ? '#FBBF24' : idx === 2 ? '#3B82F6' : '#cbd5e1';
                const maxPoin = leaderboardData[0]?.poin || 1;
                const percent = Math.round((d.poin / maxPoin) * 100);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 900, boxShadow: `0 4px 10px ${color}40` }}>
                          {idx + 1}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>{d.name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{d.poin.toLocaleString('id-ID')} Poin</div>
                        <div style={{ padding: '4px 10px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 800 }}>{percent}%</div>
                      </div>
                    </div>
                    <div style={{ height: '8px', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 3. TARGET DAN REALISASI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', minWidth: 0 }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#1e293b', margin: 0 }}>
              Target & Realisasi
            </h3>
          </div>

          <div style={{ height: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ position: 'sticky', top: 0, background: '#fff', padding: '16px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 900, color: '#1e293b', zIndex: 10 }}>Penjual</th>
                  <th style={{ position: 'sticky', top: 0, background: '#fff', padding: '16px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 900, color: '#1e293b', zIndex: 10 }}>Total Penjualan</th>
                  <th style={{ position: 'sticky', top: 0, background: '#fff', padding: '16px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 900, color: '#1e293b', zIndex: 10 }}>Target (Kg)</th>
                  <th style={{ position: 'sticky', top: 0, background: '#fff', padding: '16px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 900, color: '#1e293b', zIndex: 10 }}>Pencapaian</th>
                </tr>
              </thead>
              <tbody>
                {targetRealisasiData.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 900, fontSize: '14px' }}>
                          {d.avatar}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>{d.realisasi.toLocaleString('id-ID')} Kg</span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>{d.target.toLocaleString('id-ID')} Kg</span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{d.percent}%</span>
                        <CircularProgress percentage={d.percent} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. GRAFIK PERFORMANCE */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 950, color: '#1e293b', margin: 0 }}>
              Performance Overview
            </h3>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {(() => {
              const totalPerf = kpiStats.prospekCount + kpiStats.custCount + kpiStats.orderCount || 1;
              const pProspek = Math.round((kpiStats.prospekCount / totalPerf) * 100);
              const pCust = Math.round((kpiStats.custCount / totalPerf) * 100);
              const pOrder = Math.round((kpiStats.orderCount / totalPerf) * 100);
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Prospek', value: kpiStats.prospekCount, fill: '#8b5cf6' },
                            { name: 'Customer', value: kpiStats.custCount, fill: '#10b981' },
                            { name: 'Orderan', value: kpiStats.orderCount, fill: '#3b82f6' }
                          ]}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none"
                          dataKey="value"
                        >
                          <Cell key="cell-0" fill="#8b5cf6" />
                          <Cell key="cell-1" fill="#10b981" />
                          <Cell key="cell-2" fill="#3b82f6" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#10b981', fontWeight: 950, fontSize: '20px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        2x
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 2px 4px rgba(139,92,246,0.4)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Prospek</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{kpiStats.prospekCount}</span>
                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>{pProspek}%</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 2px 4px rgba(16,185,129,0.4)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Customer</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{kpiStats.custCount}</span>
                        <span style={{ background: '#d1fae5', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>{pCust}%</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 2px 4px rgba(59,130,246,0.4)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Orderan</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{kpiStats.orderCount}</span>
                        <span style={{ background: '#dbeafe', color: '#2563eb', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>{pOrder}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginTop: '32px' }}>
              Dibanding Periode Sebelumnya
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
