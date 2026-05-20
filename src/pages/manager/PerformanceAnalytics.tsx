import { useSalesData } from '../../hooks/useSalesData';
import { getAreaName } from '../../constants';
import { calculateSalesPoints } from '../../utils/points';
import { useState, useEffect, useMemo } from 'react';

import { 
  Calendar, MapPin, Target, Users, CheckCircle, Zap, 
  TrendingUp, TrendingDown, Flame, 
  CheckSquare, Award, AlertTriangle, MessageCircle, ClipboardList, Rocket, X
} from 'lucide-react';



export default function PerformanceAnalytics() {
  const { sales, activities: realActivities, customers: realCustomers, prospek: realProspek, systemTargets, masterAreas, masterStatuses = [] } = useSalesData();

  // --- MASTER FILTER STATES ---
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedSales, setSelectedSales] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string, sales: string, store: string, timestamp: string, note: string } | null>(null);

  // Set Shell Title on Mount
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('setMgrTitle', { 
      detail: { title: 'Performance Analytics', sub: 'Monitoring performa penjualan dan aktivitas tim' } 
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('setMgrTitle', { detail: { title: '', sub: '' } }));
    };
  }, []);

  // Use a stable reference for "now" to avoid re-calculating everything on every render
  const [now] = useState(new Date());

  const getStatusName = (idOrName: string) => {
    if (!idOrName) return 'Cold';
    const found = masterStatuses.find(s => s.id === idOrName || s.name === idOrName);
    return found ? found.name : idOrName;
  };
  
  // --- DATA SOURCES ---
  // Now we use masterStats as the primary source of truth for filtered data
  const masterStats = useMemo(() => {
    return calculateSalesPoints(
      selectedSales,
      realActivities,
      realProspek,
      systemTargets,
      selectedPeriod,
      {
        area: selectedArea,
        category: selectedCategory
      }
    );
  }, [selectedSales, realActivities, realProspek, systemTargets, selectedPeriod, selectedArea, selectedCategory]);

  // Derived filtered arrays to keep the rest of the logic clean and synchronized
  const activities = masterStats.filteredActs;
  const prospek = masterStats.filteredProspek;
  const customers = useMemo(() => {
    return realCustomers.filter(c => {
      // Respect Sales and Area filters for customers
      if (selectedSales !== 'all' && c.sales_pic !== selectedSales) return false;
      if (selectedArea !== 'all' && c.area !== selectedArea) return false;
      
      // If period filter is applied, we usually only filter NEW customers joined in that period
      if (selectedPeriod === 'all') return true;
      
      const ts = new Date(c.tanggal_join || c.created_at || 0).getTime();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = new Date(now.getTime() - 7 * 86400000).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      if (selectedPeriod === 'today') return ts >= startOfToday;
      if (selectedPeriod === 'week') return ts >= startOfWeek;
      if (selectedPeriod === 'month') return ts >= startOfMonth;
      
      return true;
    });
  }, [realCustomers, selectedSales, selectedArea, selectedPeriod, now]);

  const areas = useMemo(() => {
    return masterAreas;
  }, [masterAreas]);

  // Points-Based Targets


  // Data-binding updated (use filtered sources)
  // already handled via useMemo above



  // Master Aggregation
  const statsPerSales = useMemo(() => {
    return sales.map(s => {
      const { totalActual, breakdown } = calculateSalesPoints(
        s.id,
        realActivities,
        realProspek,
        systemTargets,
        selectedPeriod,
        {
          area: selectedArea,
          category: selectedCategory
        }
      );

      const {
        followup: waCount, 
        order: soCount,
        visitProspek: vProspek,
        visitCustomer: vCustomer,
        closing: sClosingCount,
        newProspek: activeProspekCount
      } = breakdown;

      const visitCount = vProspek + vCustomer;
      const totalActs = waCount + soCount + visitCount;
      const closingRate = totalActs > 0 ? Math.round((sClosingCount / totalActs) * 100) : 0;
      
      return {
        id: s.id, nama: s.nama,
        visitCount, waCount, callCount: 0, soCount, totalActs,
        closingCount: sClosingCount, closingRate, activeFollowups: waCount,
        maintainCount: vCustomer, 
        totalPoin: totalActual, 
        prospekBaru: activeProspekCount,
        foto_profil: s.foto_profil,
        progress: Math.min(100, Math.round((totalActual / (systemTargets?.ind_poin || 150)) * 100))
      };
    }).sort((a,b) => b.totalPoin - a.totalPoin);
  }, [sales, realActivities, realProspek, systemTargets, selectedPeriod, selectedArea, selectedCategory, realCustomers]);

  // Master Aggregation for Customer Progress
  const customerProgressStats = useMemo(() => {
    return customers
      .map(c => {
        const target = (c as any).target_volume || 0;
        const actual = (c as any).total_order_volume || 0;
        const progress = target > 0 ? (actual / target) * 100 : 0;
        return {
          ...c,
          target,
          actual,
          progress,
          salesName: sales.find((s: any) => s.id == c.sales_pic)?.nama || 'No PIC'
        };
      })
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10);
  }, [customers, sales]);

  // Master Aggregation for KPI Cards
  const totalProspekCount = masterStats.breakdown.newProspek;
  const totalCustomer = customers.length;
  const totalUniqueClosing = masterStats.breakdown.closing;
  
  const totalActivityCount = activities.length;



  // Trend / Indicator Logic (7-Day Period)
  const calculateTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const getCountInPeriod = (data: any[], dateField: string, start: Date, end: Date) => {
    return data.filter(item => {
      const d = new Date(item[dateField]);
      return d >= start && d < end;
    }).length;
  };

  const nowTime = now.getTime();
  const sevenDaysAgo = new Date(nowTime - 7 * 86400000);
  const fourteenDaysAgo = new Date(nowTime - 14 * 86400000);

  const trends = useMemo(() => {
    const fProspek = realProspek.filter(p => (selectedSales === 'all' || p.sales_owner === selectedSales) && (selectedArea === 'all' || p.area === selectedArea));
    const fCustomers = realCustomers.filter(c => (selectedSales === 'all' || c.sales_pic === selectedSales) && (selectedArea === 'all' || c.area === selectedArea));
    const fActivities = realActivities.filter(a => {
      if (selectedSales !== 'all' && a.id_sales !== selectedSales) return false;
      if (selectedArea !== 'all' && (a as any).geotagging?.area !== selectedArea) return false;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'Visit' && a.tipe_aksi !== 'Visit') return false;
        if (selectedCategory === 'Order' && a.tipe_aksi !== 'Order') return false;
        if (selectedCategory === 'Closing' && !a.catatan_hasil.toLowerCase().includes('closing')) return false;
      }
      return true;
    });

    return {
      prospek: calculateTrend(getCountInPeriod(fProspek, 'created_at', sevenDaysAgo, now), getCountInPeriod(fProspek, 'created_at', fourteenDaysAgo, sevenDaysAgo)),
      customer: calculateTrend(getCountInPeriod(fCustomers, 'created_at', sevenDaysAgo, now), getCountInPeriod(fCustomers, 'created_at', fourteenDaysAgo, sevenDaysAgo)),
      closing: calculateTrend(
        fActivities.filter(a => a.catatan_hasil.toLowerCase().includes('closing') && new Date(a.timestamp) >= sevenDaysAgo).length,
        fActivities.filter(a => a.catatan_hasil.toLowerCase().includes('closing') && new Date(a.timestamp) >= fourteenDaysAgo && new Date(a.timestamp) < sevenDaysAgo).length
      ),
      so: calculateTrend(
        fActivities.filter(a => a.tipe_aksi === 'Order' && new Date(a.timestamp) >= sevenDaysAgo).length,
        fActivities.filter(a => a.tipe_aksi === 'Order' && new Date(a.timestamp) >= fourteenDaysAgo && new Date(a.timestamp) < sevenDaysAgo).length
      ),
      activity: calculateTrend(
        fActivities.filter(a => new Date(a.timestamp) >= sevenDaysAgo).length,
        fActivities.filter(a => new Date(a.timestamp) >= fourteenDaysAgo && new Date(a.timestamp) < sevenDaysAgo).length
      )
    };
  }, [realActivities, realProspek, realCustomers, selectedSales, selectedArea, selectedCategory, sevenDaysAgo, fourteenDaysAgo, now]);

  // Pie Data for Status Distribution Gauge
  // Pie Data for Status Distribution Gauge
  const fTotal = (prospek.length + totalUniqueClosing) || 1; // Base pool for proportions
  const fStatusColdNum = prospek.filter(p => getStatusName(p.status).toLowerCase() === 'cold').length;
  const fStatusHotNum = prospek.filter(p => getStatusName(p.status).toLowerCase() === 'hot').length;
  const fClosedNum = totalUniqueClosing;

  const statusDistData = useMemo(() => [
    { name: 'Closing', value: fClosedNum, color: '#10b981' },
    { name: 'Hot', value: fStatusHotNum, color: '#EE4D2D' },
    { name: 'Cold', value: fStatusColdNum, color: '#3b82f6' },
    { name: 'Empty', value: Math.max(0, fTotal - (fClosedNum + fStatusHotNum + fStatusColdNum)), color: '#f1f5f9' }
  ], [fClosedNum, fStatusHotNum, fStatusColdNum, fTotal]);






  const pointTrendsData = useMemo(() => {
    const days = [];
    let cumulativePoints = 0;
    
    // Filter base activities for trend
    const baseActs = realActivities.filter(a => {
      if (selectedSales !== 'all' && a.id_sales !== selectedSales) return false;
      if (selectedArea !== 'all' && (a as any).geotagging?.area !== selectedArea) return false;
      return true;
    }).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Filter base prospek for trend points
    const baseProspek = realProspek.filter(p => {
       if (selectedSales !== 'all' && p.sales_owner !== selectedSales) return false;
       if (selectedArea !== 'all' && p.area !== selectedArea) return false;
       return true;
    });

    const weights = {
      chat: systemTargets?.b_chat ?? 1,
      order: systemTargets?.b_order ?? 5,
      visit: systemTargets?.b_visit ?? 5,
      maint: systemTargets?.b_maint ?? 5,
      closing: systemTargets?.b_closing ?? 20,
      prospek: systemTargets?.b_prospek ?? 5,
    };

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - i);
      const startDay = d.getTime();
      const endDay = d.getTime() + 86400000;

      const dayActs = baseActs.filter(a => {
        const ts = new Date(a.timestamp).getTime();
        return ts >= startDay && ts < endDay;
      });

      const dayPros = baseProspek.filter(p => {
        const ts = new Date(p.created_at).getTime();
        return ts >= startDay && ts < endDay;
      }).length;

      let dayPoints = dayPros * weights.prospek;
      dayActs.forEach(a => {
        if (a.tipe_aksi === 'Visit') {
          dayPoints += (a.target_type === 'customer' ? weights.maint : weights.visit);
        }
        else if (a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call') dayPoints += weights.chat;
        else if (a.tipe_aksi === 'Order') dayPoints += weights.order;
        
        if (a.catatan_hasil.toLowerCase().includes('closing')) dayPoints += weights.closing;
      });

      cumulativePoints += dayPoints;
      days.push({
        date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        points: cumulativePoints,
        dayPoints: dayPoints
      });
    }
    return days;
  }, [realActivities, realProspek, now, systemTargets, selectedSales, selectedArea]);

  const retentionAnalysis = useMemo(() => {
    const last30Days = 30 * 24 * 60 * 60 * 1000;
    const lastActMap: Record<string, number> = {};
    realActivities.filter(a => a.target_type === 'customer').forEach(a => {
      const ts = new Date(a.timestamp).getTime();
      if (!lastActMap[a.target_id] || ts > lastActMap[a.target_id]) {
        lastActMap[a.target_id] = ts;
      }
    });
    const activeCount = customers.filter(c => {
      const lastTs = lastActMap[c.id];
      return lastTs && (now.getTime() - lastTs < last30Days);
    }).length;
    const dormantCount = customers.length - activeCount;
    const healthData = [
      { name: 'Active', value: activeCount, color: '#10b981' },
      { name: 'Dormant', value: dormantCount, color: '#f43f5e' }
    ];
    const activeDaysCount = pointTrendsData.filter(d => d.dayPoints > 0).length;
    const consistencyScore = Math.round((activeDaysCount / 30) * 100);
    return { healthData, activeCount, dormantCount, consistencyScore };
  }, [realActivities, customers, now, pointTrendsData]);







  return (
    <div className="mgr-page" style={{ background: '#f4f7fa', minHeight: '100vh', padding: '0 0 40px 0' }}>
      
      {/* MASTER FILTER BAR */}
      <div className="mgr-master-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="mgr-filter-item">
            <span style={{ fontSize: '18px' }}>📅</span>
            <select 
              className="mgr-filter-select"
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
            >
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>

          <div className="mgr-filter-divider" />

          <div className="mgr-filter-item">
            <span style={{ fontSize: '18px' }}>👤</span>
            <select 
              className="mgr-filter-select"
              value={selectedSales} 
              onChange={(e) => setSelectedSales(e.target.value)}
            >
              <option value="all">Semua Sales</option>
              {sales.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>

          <div className="mgr-filter-divider" />

          <div className="mgr-filter-item">
            <span style={{ fontSize: '18px' }}>📍</span>
            <select 
              className="mgr-filter-select"
              value={selectedArea} 
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="all">Semua Wilayah</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="mgr-filter-divider" />

          <div className="mgr-filter-item">
            <span style={{ fontSize: '18px' }}>🛠️</span>
            <select 
              className="mgr-filter-select"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Semua Aktivitas</option>
              <option value="Visit">Visit Only</option>
              <option value="Closing">Closing Only</option>
              <option value="Order">Order Only</option>
            </select>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Data: <span style={{ color: '#fff', fontWeight: 900 }}>{activities.length} Logs</span>
          </div>
          <button 
            onClick={() => {
              setSelectedPeriod('month');
              setSelectedSales('all');
              setSelectedArea('all');
              setSelectedCategory('all');
            }}
            style={{ 
              padding: '8px 16px', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '12px', 
              fontWeight: 700, 
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>
      {/* ROW 1: QUICK STATS HEADER (Updated Metrics) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '40px',
        padding: '0 2px'
      }}>
        {[
          { label: 'Total Prospek', value: totalProspekCount, from: '#a855f7', to: '#7c3aed', icon: <Target size={26} />, shadow: 'rgba(168, 85, 247, 0.3)', trend: trends.prospek },
          { label: 'Total Customer', value: totalCustomer, from: '#6366f1', to: '#4f46e5', icon: <Users size={26} />, shadow: 'rgba(99, 102, 241, 0.3)', trend: trends.customer },
          { label: 'Total Closing', value: totalUniqueClosing, from: '#10b981', to: '#059669', icon: <CheckCircle size={26} />, shadow: 'rgba(16, 185, 129, 0.3)', trend: trends.closing },
          { label: 'Total Activity', value: totalActivityCount, from: '#3b82f6', to: '#2563eb', icon: <Zap size={26} />, shadow: 'rgba(59, 130, 246, 0.3)', trend: trends.activity }
        ].map((item: any, i) => (
          <div key={i} style={{ 
            background: `linear-gradient(135deg, ${item.from}, ${item.to})`, 
            borderRadius: '24px', 
            padding: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px',
            boxShadow: `0 10px 25px ${item.shadow}`,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default',
            minHeight: '120px'
          }}>
            {/* Glossy Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }} />
            
            {/* Circular highlight */}
            <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />

            <div style={{ 
              width: '58px', 
              height: '58px', 
              background: 'rgba(255,255,255,0.25)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '26px', 
              color: '#fff',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 950, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px' }}>
                  {item.label === 'Total Poin Team' 
                    ? item.value.toLocaleString()
                    : item.value.toLocaleString()}
                </div>
                {/* Indicator / Trend & Achievement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ 
                    padding: '2px 6px', 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '6px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {item.trend >= 0 ? '+' : ''}{item.trend}% {item.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    </div>
                  </div>
                  {item.achieve !== undefined && (
                    <div style={{ 
                      padding: '2px 6px', 
                      background: 'rgba(255,255,255,0.15)', 
                      borderRadius: '6px', 
                      fontSize: '10px', 
                      fontWeight: 900, 
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '8px', opacity: 0.8 }}>TRGT</span>
                      {item.achieve}%
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ROW 2: ANALYTICS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardList size={18} /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>Data Overview</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Bulan Lalu VS Bulan Ini</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const now = new Date();
              const cutThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const cutLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const thisMonthProspek = (prospek as any[]).filter((p: any) => new Date(p.created_at) >= cutThisMonth).length || 0;
              const lastMonthProspek = (prospek as any[]).filter((p: any) => new Date(p.created_at) >= cutLastMonth && new Date(p.created_at) < cutThisMonth).length || 0;
              const thisMonthActs = (activities as any[]).filter((a: any) => new Date(a.timestamp) >= cutThisMonth);
              const lastMonthActs = (activities as any[]).filter((a: any) => new Date(a.timestamp) >= cutLastMonth && new Date(a.timestamp) < cutThisMonth);
              const thisMonthVisit = thisMonthActs.filter((a: any) => a.tipe_aksi === 'Visit').length || 0;
              const lastMonthVisit = lastMonthActs.filter((a: any) => a.tipe_aksi === 'Visit').length || 0;
              const thisMonthFollowup = thisMonthActs.filter((a: any) => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length || 0;
              const lastMonthFollowup = lastMonthActs.filter((a: any) => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length || 0;
              const thisMonthClosing = thisMonthActs.filter((a: any) => (a.catatan_hasil || '').toLowerCase().includes('closing')).length || 0;
              const lastMonthClosing = lastMonthActs.filter((a: any) => (a.catatan_hasil || '').toLowerCase().includes('closing')).length || 0;
              const thisMonthSO = thisMonthActs.filter((a: any) => a.tipe_aksi === 'Order').length || 0;
              const lastMonthSO = lastMonthActs.filter((a: any) => a.tipe_aksi === 'Order').length || 0;
              const metrics = [
                { label: 'Prospek', thisMonth: thisMonthProspek, lastMonth: lastMonthProspek, color: '#6366f1' },
                { label: 'Followup', thisMonth: thisMonthFollowup, lastMonth: lastMonthFollowup, color: '#a855f7' },
                { label: 'Visit', thisMonth: thisMonthVisit, lastMonth: lastMonthVisit, color: '#3b82f6' },
                { label: 'Closing', thisMonth: thisMonthClosing, lastMonth: lastMonthClosing, color: '#10b981' },
                { label: 'Sales Order', thisMonth: thisMonthSO, lastMonth: lastMonthSO, color: '#f59e0b' }
              ];
              return metrics.map((m, i) => {
                const isUp = m.thisMonth >= m.lastMonth;
                const diff = m.lastMonth > 0 ? Math.round(((m.thisMonth - m.lastMonth) / m.lastMonth) * 100) : (m.thisMonth > 0 ? 100 : 0);
                return (
                  <div key={i} style={{ padding: '14px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>{m.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isUp ? '#10b981' : '#ef4444', fontSize: '10px', fontWeight: 900 }}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(diff)}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 950, color: '#1e293b' }}>{m.thisMonth}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>vs {m.lastMonth} bulan lalu</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>Customer Overview</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Landscape & Engagement</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
               <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Top Target Progress</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {customerProgressStats.slice(0, 3).map((c, idx) => (
                   <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{c.nama_toko}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${Math.min(100, c.progress)}%`, height: '100%', background: '#10b981' }} /></div>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#10b981' }}>{Math.round(c.progress)}%</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
            <div style={{ padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', color: '#fff' }}>
               <div style={{ fontSize: '11px', fontWeight: 800, opacity: 0.9, marginBottom: '4px' }}>RETENTION RATE</div>
               <div style={{ fontSize: '24px', fontWeight: 950 }}>{customers.length > 0 ? Math.round((retentionAnalysis.activeCount/customers.length)*100) : 0}%</div>
               <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, marginTop: '4px' }}>{retentionAnalysis.activeCount} Toko aktif melakukan order</div>
            </div>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>TOTAL DATABASE</div>
                 <div style={{ fontSize: '18px', fontWeight: 950, color: '#1e293b' }}>{customers.length} Toko</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>NEW (30D)</div>
                 <div style={{ fontSize: '18px', fontWeight: 950, color: '#3b82f6' }}>+{(customers as any[]).filter((c: any) => new Date(c.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</div>
               </div>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff7ed', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Flame size={18} /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>Prospek Overview</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Pipeline & Funnel</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
               <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>Pipeline Distribution</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {statusDistData.map((item, idx) => (
                   <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>{item.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>{item.value}</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${(item.value / Math.max(prospek.length, 1)) * 100}%`, height: '100%', background: item.color }} />
                      </div>
                   </div>
                 ))}
               </div>
            </div>
            <div style={{ padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '16px', color: '#fff' }}>
               <div style={{ fontSize: '11px', fontWeight: 800, opacity: 0.9, marginBottom: '4px' }}>CONVERSION RATE</div>
               <div style={{ fontSize: '24px', fontWeight: 950 }}>{Math.round((realCustomers.length / Math.max(prospek.length + realCustomers.length, 1)) * 100)}%</div>
               <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, marginTop: '4px' }}>Total konversi menjadi Customer tetap</div>
            </div>
            <div style={{ padding: '14px', background: '#fff1f2', borderRadius: '16px', border: '1px solid #ffe4e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: '#e11d48' }}>AGING PROSPEK</div>
                 <div style={{ fontSize: '18px', fontWeight: 950, color: '#9f1239' }}>{(() => {
                   const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
                   return (prospek as any[]).filter((p: any) => new Date(p.created_at).getTime() < cutoff).length;
                 })()} Prospek</div>
               </div>
               <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f43f5e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={16} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: PEOPLE PERFORMANCE (Leaderboard) */}
      <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '6px', height: '24px', background: 'linear-gradient(to bottom, #EE4D2D, #f97316)', borderRadius: '6px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 950, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>People Performance</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
             <div style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '6px 16px', borderRadius: '20px', border: '1px solid #dbeafe' }}>{sales.length} Active Sales</div>
          </div>
        </div>

        {/* Table Head */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '240px 100px repeat(5, 1fr) 100px', 
          gap: '12px', 
          padding: '0 20px 16px 20px', 
          borderBottom: '2px solid #f1f5f9' 
        }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salesman Profile</div>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#111827', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em', background: '#fef3c7', padding: '4px 0', borderRadius: '6px' }}>Total Poin</div>
          {['Prospek','Followup','Closing','Visit','Sales Order'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em' }}>{h}</div>
          ))}
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right', letterSpacing: '0.05em' }}>Progress</div>
        </div>

        {/* Table Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
          {statsPerSales.map((s, idx) => {
            const isTop3 = idx < 3;
            const rankLabel = idx === 0 ? "🏆 PERINGKAT 1" : idx === 1 ? "🥈 PERINGKAT 2" : idx === 2 ? "🥉 PERINGKAT 3" : null;
            const rankColor = idx === 0 ? "#EE4D2D" : idx === 1 ? "#64748b" : idx === 2 ? "#b45309" : "#94a3b8";
            const rowBg = idx === 0 ? 'rgba(238, 77, 45, 0.04)' : idx === 1 ? 'rgba(100, 116, 139, 0.02)' : idx === 2 ? 'rgba(180, 83, 9, 0.02)' : 'transparent';

            return (
              <div key={s.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '240px 100px repeat(5, 1fr) 100px', 
                gap: '12px', 
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: '16px',
                transition: 'all 0.2s',
                background: rowBg,
                border: isTop3 ? `1px solid ${rankColor}20` : '1px solid transparent',
                position: 'relative'
              }} className="hover-lift">
                
                {/* Profile Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={s.foto_profil || `https://api.dicebear.com/7.x/notionists/svg?seed=${s.nama}`}
                      alt={s.nama}
                      style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover', border: `2.5px solid ${isTop3 ? rankColor : '#f1f5f9'}` }}
                    />
                    <div style={{ 
                      position: 'absolute', bottom: '-6px', right: '-6px', width: '22px', height: '22px', 
                      borderRadius: '50%', background: '#fff', border: `2px solid ${isTop3 ? rankColor : '#cbd5e1'}`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 950, color: isTop3 ? rankColor : '#64748b',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)', zIndex: 2
                    }}>
                      {idx + 1}
                    </div>
                  </div>
                  <div>
                    {rankLabel && (
                      <div style={{ 
                        fontSize: '9px', fontWeight: 950, color: rankColor, 
                        background: `${rankColor}15`, padding: '2px 8px', borderRadius: '6px',
                        display: 'inline-block', marginBottom: '4px', letterSpacing: '0.02em' 
                      }}>
                        {rankLabel}
                      </div>
                    )}
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.01em' }}>{s.nama}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Sales Consultant</div>
                  </div>
                </div>

                {/* Total Poin Column (Yellow Highlight) */}
                <div style={{ 
                  textAlign: 'center', 
                  background: '#fef3c7', 
                  padding: '12px 0', 
                  borderRadius: '14px',
                  border: '1.5px solid #fde68a',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 950, color: '#92400e', lineHeight: 1 }}>{s.totalPoin}</div>
                  <div style={{ fontSize: '8px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginTop: '2px' }}>Poin</div>
                </div>

                {/* Breakdown Columns */}
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#6366f1' }}>{s.prospekBaru}</div>
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#f43f5e' }}>{s.waCount + s.callCount}</div>
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#10b981' }}>{s.closingCount}</div>
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#3b82f6' }}>{s.visitCount}</div>
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#f59e0b' }}>{s.soCount}</div>

                {/* Progress Column */}
                <div style={{ textAlign: 'right', paddingRight: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 950, color: '#1e293b', marginBottom: '6px' }}>{Math.round(s.progress)}%</div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                    <div style={{ 
                      width: `${Math.min(100, s.progress)}%`, 
                      height: '100%', 
                      background: s.progress >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)', 
                      borderRadius: '10px' 
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 4: REMOVED ANALYTICS GRID AS PER REQUEST */}


      {/* ACTIVITY FIELD REPORT: Grouped bar chart per salesman + Dominance Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '40px' }}>
        {/* Left: Bar Chart & Bottom Metrics */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Sales Activity Field Report</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>Distribusi aktivitas lapangan per salesman — Bulan Ini</div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[
                { label: 'Prospek',      color: '#6366f1' },
                { label: 'Closing',      color: '#10b981' },
                { label: 'Sales Order',  color: '#f59e0b' },
                { label: 'Visit',        color: '#3b82f6' },
                { label: 'Followup',     color: '#f43f5e' },
              ].map((item: any) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart Area */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', minWidth: `${Math.max(statsPerSales.length * 140, 700)}px`, paddingBottom: '16px' }}>
              {statsPerSales.slice(0, 8).map((s) => {
                const metrics = [
                  { key: 'prospekBaru',                         val: s.prospekBaru,                  color: '#6366f1', label: 'Prospek' },
                  { key: 'closingCount',                        val: s.closingCount,                 color: '#10b981', label: 'Closing' },
                  { key: 'soCount',                             val: s.soCount,                      color: '#f59e0b', label: 'SO' },
                  { key: 'visitCount',                          val: s.visitCount,                   color: '#3b82f6', label: 'Visit' },
                  { key: 'followup', val: s.waCount + s.callCount,                                   color: '#f43f5e', label: 'Followup' },
                ];

                // Determine max value across all salesmen for proportional bar height
                const allMax = Math.max(
                  ...statsPerSales.slice(0, 8).flatMap((x: any) =>
                    [x.prospekBaru, x.closingCount, x.soCount, x.visitCount, x.waCount + x.callCount]
                  ),
                  1
                );
                const BAR_MAX_H = 120;

                return (
                  <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                    {/* Bars Group */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${BAR_MAX_H + 24}px`, marginBottom: '16px', paddingTop: '24px', boxSizing: 'border-box', position: 'relative', width: '100%', justifyContent: 'center' }}>
                      {(metrics as any[]).map((m: any) => {
                        const barH = Math.max(Math.round((m.val / allMax) * BAR_MAX_H), m.val > 0 ? 4 : 0);
                        return (
                          <div key={m.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '22px' }}>
                            {/* Outer container for value + bar */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${BAR_MAX_H}px`, justifyContent: 'flex-end', position: 'relative' }}>
                              {m.val > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: `${barH + 4}px`,
                                  fontSize: '10px',
                                  fontWeight: 900,
                                  color: m.color,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {m.val}
                                </div>
                              )}
                              {/* Background Track + Bar */}
                              <div style={{
                                width: '22px',
                                height: `${BAR_MAX_H}px`,
                                background: '#f8fafc',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'flex-end',
                                padding: '3px',
                                boxSizing: 'border-box'
                              }}>
                                <div style={{
                                  width: '100%',
                                  height: `${barH}px`,
                                  background: m.color,
                                  borderRadius: '20px',
                                  transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: m.val > 0 ? `0 2px 8px ${m.color}60` : 'none',
                                }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Divider */}
                    <div style={{ width: '100%', height: '1px', background: '#f1f5f9', marginBottom: '8px' }} />

                    {/* Name Only */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b', textAlign: 'center', maxWidth: '90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.nama.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Keaktifan Sales Metrics — clean horizontal strip */}
          {(() => {
            const n = statsPerSales.length || 1;
            const DAYS = 30;

            const avgActsPerDay   = statsPerSales.reduce((a: any, s: any) => a + s.totalActs,                0) / n / DAYS;
            const avgFollowupDay  = statsPerSales.reduce((a: any, s: any) => a + s.waCount + s.callCount,    0) / n / DAYS;
            const avgClosingRate  = statsPerSales.reduce((a: any, s: any) => a + s.closingRate,              0) / n;
            const avgSOPerDay     = statsPerSales.reduce((a: any, s: any) => a + s.soCount,                  0) / n / DAYS;

            const mostActive  = statsPerSales[0];
            const leastActive = [...(statsPerSales as any[])].sort((a: any, b: any) => a.totalActs - b.totalActs)[0];

            const metrics = [
              { icon: <Zap size={16} />, color: '#6366f1', value: avgActsPerDay.toFixed(1),  unit: 'akt/hari',   label: 'Avg. Aktivitas / Hari',  sub: 'Rata-rata activity harian' },
              { icon: <MessageCircle size={16} />, color: '#f43f5e', value: avgFollowupDay.toFixed(1), unit: 'chat/hari',  label: 'Avg. Followup / Hari',   sub: 'WA + Call per hari' },
              { icon: <Target size={16} />, color: '#10b981', value: avgClosingRate.toFixed(0) + '%', unit: '',     label: 'Avg. Closing Rate',      sub: 'Dari total aktivitas' },
              { icon: <ClipboardList size={16} />, color: '#f59e0b', value: avgSOPerDay.toFixed(1),    unit: 'SO/hari',    label: 'Avg. Sales Order / Hari', sub: 'Rata-rata order harian' },
              {
                icon: <Award size={16} />, color: '#3b82f6',
                value: mostActive?.nama?.split(' ')[0] || '-', unit: '',
                label: 'Salesman Teraktif',
                sub: leastActive?.id !== mostActive?.id ? `Perlu boost: ${leastActive?.nama?.split(' ')[0] || '-'}` : 'Semua merata 👋',
              },
            ];

            return (
              <div style={{
                display: 'flex',
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
                gap: '0',
              }}>
                {metrics.map((m, i) => (
                  <div key={m.label} style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '0 24px',
                    borderRight: i < metrics.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    {/* Icon pill */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: m.color + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0,
                    }}>
                      {m.icon}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      {/* Big value */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 950, color: m.color, lineHeight: 1, letterSpacing: '-0.5px' }}>
                          {m.value}
                        </span>
                        {m.unit && (
                          <span style={{ fontSize: '10px', fontWeight: 800, color: m.color, opacity: 0.65 }}>
                            {m.unit}
                          </span>
                        )}
                      </div>
                      {/* Label */}
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.label}
                      </div>
                      {/* Sub */}
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Right: Dominant Activities (Budget Style) */}
        {(() => {
            const totals = {
              Prospek: statsPerSales.reduce((a: any, s: any) => a + s.prospekBaru, 0),
              Closing: statsPerSales.reduce((a: any, s: any) => a + s.closingCount, 0),
              SO: statsPerSales.reduce((a: any, s: any) => a + s.soCount, 0),
              Visit: statsPerSales.reduce((a: any, s: any) => a + s.visitCount, 0),
              Followup: statsPerSales.reduce((a: any, s: any) => a + s.waCount + s.callCount, 0),
            };
            const totalAll = Object.values(totals).reduce((a: any, b: any) => (a as number) + (b as number), 0);

            // Prev month activities for real trend comparison
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const prevMonthActs = (activities as any[]).filter((a: any) => {
              const t = new Date(a.timestamp).getTime();
              return t >= prevMonthStart && t < prevMonthEnd;
            });
            const prevTotals = {
              Followup: prevMonthActs.filter((a: any) => a.tipe_aksi === 'WA' || a.tipe_aksi === 'Call').length,
              Visit:    prevMonthActs.filter((a: any) => a.tipe_aksi === 'Visit').length,
              Prospek:  (prospek as any[]).filter((p: any) => { const t = new Date(p.created_at).getTime(); return t >= prevMonthStart && t < prevMonthEnd; }).length,
              Closing:  prevMonthActs.filter((a: any) => (a.catatan_hasil || '').toLowerCase().includes('closing')).length,
              SO:       prevMonthActs.filter((a: any) => a.tipe_aksi === 'Order').length,
            };

            // Sort to find the most dominant
            const domActs = [
              { label: 'Followup', value: totals.Followup, prevValue: prevTotals.Followup, color: '#f43f5e', icon: <MessageCircle size={16} /> },
              { label: 'Visit',    value: totals.Visit,    prevValue: prevTotals.Visit,    color: '#3b82f6', icon: <MapPin size={16} /> },
              { label: 'Prospek',  value: totals.Prospek,  prevValue: prevTotals.Prospek,  color: '#6366f1', icon: <Target size={16} /> },
              { label: 'Closing',  value: totals.Closing,  prevValue: prevTotals.Closing,  color: '#10b981', icon: <CheckSquare size={16} /> },
              { label: 'SO',       value: totals.SO,       prevValue: prevTotals.SO,       color: '#f59e0b', icon: <ClipboardList size={16} /> },
            ].sort((a: any, b: any) => (b.value as number) - (a.value as number));

             return (
              <div style={{ 
                background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)', 
                borderRadius: '32px', 
                padding: '24px', 
                color: '#111827', 
                display: 'flex', 
                flexDirection: 'column', 
                boxShadow: '0 20px 50px rgba(234, 179, 8, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                 {/* Premium Decorative Mesh Pattern */}
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                 <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                 <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '28px', fontWeight: 950, marginBottom: '4px', color: '#111827', letterSpacing: '-1px' }}>Total Aktivitas</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Distribusi Dominan</div>
                      </div>
                      <div style={{ 
                        background: 'rgba(255,255,255,0.95)', 
                        padding: '12px 20px', 
                        borderRadius: '20px', 
                        boxShadow: '0 10px 20px rgba(0,0,0,0.05)', 
                        textAlign: 'right',
                        border: '1px solid #fff'
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: 950, color: '#111827', lineHeight: 1 }}>{totalAll}</div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>Interaksi</div>
                      </div>
                    </div>
                 </div>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, position: 'relative', zIndex: 1 }}>
                    {domActs.map((act) => {
                      const trendVal = calculateTrend(act.value, act.prevValue);
                      const isUp = trendVal >= 0;
                      const percentage = (act.value / Math.max(domActs[0].value, 1)) * 100;

                      return (
                        <div key={act.label} style={{ 
                          background: 'rgba(255, 255, 255, 0.6)', 
                          backdropFilter: 'blur(12px)',
                          borderRadius: '24px', 
                          padding: '16px',
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '12px',
                          border: '1px solid rgba(255,255,255,0.7)',
                          boxShadow: '0 8px 15px rgba(0,0,0,0.04)',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}>
                          {/* Row Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                              width: '44px', 
                              height: '44px', 
                              borderRadius: '14px', 
                              background: '#fff', 
                              color: act.color, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '20px', 
                              boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                              flexShrink: 0
                            }}>
                              {act.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '2px' }}>{act.label}</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                <span style={{ fontSize: '20px', fontWeight: 950, color: '#111827' }}>{act.value}</span>
                                <div style={{ 
                                  display: 'flex', alignItems: 'center', gap: '2px',
                                  padding: '2px 6px', borderRadius: '8px',
                                  background: isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: isUp ? '#059669' : '#dc2626',
                                  fontSize: '10px', fontWeight: 900,
                                }}>
                                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}~{Math.abs(trendVal)}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Refined Progress Bar */}
                          <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                             <div style={{ 
                               position: 'absolute', left: 0, top: 0, bottom: 0, 
                               width: `${percentage}%`, 
                               background: `linear-gradient(to right, ${act.color}88, ${act.color})`, 
                               borderRadius: '10px',
                               boxShadow: `0 0 15px ${act.color}33`
                             }} />
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            );
        })()}
      </div>

      {/* ROW 6: MAP & INSIGHTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '40px' }}>
        {/* Card: Smart Resolve Panel */}
        {(() => {
                  // Insight 1: Sales closing turun vs bulan lalu
                  const lastMs = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
                  const thisMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                  const worstSales = (sales as any[]).map((s: any) => {
                    const last = (activities as any[]).filter((a: any) => a.id_sales === s.id && a.catatan_hasil.toLowerCase().includes('closing') && new Date(a.timestamp).getTime() >= lastMs && new Date(a.timestamp).getTime() < thisMs).length;
                    const curr = (activities as any[]).filter((a: any) => a.id_sales === s.id && a.catatan_hasil.toLowerCase().includes('closing') && new Date(a.timestamp).getTime() >= thisMs).length;
                    const pct = last > 0 ? Math.round(((curr - last) / last) * 100) : 0;
                    return { nama: s.nama.split(' ')[0], pct, last, curr };
                  }).filter((s: any) => s.pct < 0 && s.last > 0).sort((a: any, b: any) => a.pct - b.pct)[0];
                  // Insight 2: Area kunjungan tinggi tapi konversi rendah
                  const areaMap: Record<string, { visit: number; closing: number }> = {};
                  (activities as any[]).forEach((a: any) => {
                    const area = (a as any).geotagging?.area || '';
                    if (!area) return;
                    if (!areaMap[area]) areaMap[area] = { visit: 0, closing: 0 };
                    if (a.tipe_aksi === 'Visit') areaMap[area].visit++;
                    if (a.catatan_hasil.toLowerCase().includes('closing')) areaMap[area].closing++;
                  });
                  const lowConv = Object.entries(areaMap)
                    .filter(([, s]) => s.visit >= 3)
                    .map(([name, s]) => ({ name, ...s, rate: Math.round((s.closing / s.visit) * 100) }))
                    .sort((a: any, b: any) => a.rate - b.rate)[0];
                  // Insight 3: Prospek aging 14+ hari tanpa follow-up
                  const cutoff14 = now.getTime() - 14 * 24 * 60 * 60 * 1000;
                  const recentTargets = new Set((activities as any[]).filter((a: any) => new Date(a.timestamp).getTime() >= cutoff14 && a.target_type === 'prospek').map((a: any) => a.target_id));
                  const agingCount = (prospek as any[]).filter((p: any) => new Date(p.created_at).getTime() < cutoff14 && !recentTargets.has(p.id)).length;
                  const items: { urgent: boolean; dot: string; text: React.ReactNode }[] = [];
                  if (worstSales) items.push({ urgent: true, dot: '#ef4444', text: <><b>{worstSales.nama}</b> closing turun <span style={{ color: '#ef4444', fontWeight: 900 }}>{worstSales.pct}%</span> vs bulan lalu ({worstSales.last} &rarr; {worstSales.curr})</> });
                  if (lowConv) items.push({ urgent: false, dot: '#f59e0b', text: <>Area <b>{lowConv.name}</b> visit tinggi ({lowConv.visit}x) tapi konversi hanya {lowConv.rate}%</> });
                  if (agingCount > 0) items.push({ urgent: false, dot: '#eab308', text: <><b>{agingCount} Prospek</b> aging 14+ hari tanpa follow-up</> });
                  if (items.length === 0) return (
                    <div style={{ marginTop: '16px', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>&#x2705;</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>Semua indikator sehat! Tidak ada alert saat ini.</span>
                    </div>
                  );
                  return (
                    <div className="db-card" style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                         <div style={{ width: '6px', height: '18px', background: '#facc15', borderRadius: '4px' }} />
                         <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>Smart Resolve Insights</div>
                      </div>
                      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#eab308 1.5px, transparent 1.5px)', backgroundSize: '12px 12px', pointerEvents: 'none' }} />
                      {items.map((ins, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 1, padding: '12px', background: ins.urgent ? 'rgba(239, 68, 68, 0.05)' : 'rgba(241, 245, 249, 0.5)', borderRadius: '14px', border: ins.urgent ? '1px solid rgba(239, 68, 68, 0.1)' : '1px solid rgba(241, 245, 249, 0.8)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '6px', background: '#fff', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ins.dot }} />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: ins.urgent ? 800 : 700, color: ins.urgent ? '#1e293b' : '#334155', lineHeight: 1.4 }}>{ins.text}</div>
                          </div>
                          {ins.urgent && (
                            <button style={{ background: '#1e293b', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(30,41,59,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              Resolve
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

        {/* Right Card: Area Distribution */}
        {(() => {
          // 1. Parse Land Coordinates from mapStr
          const mapStr = ["       00000                 00000000               ","     0000000000            000000000000    00       ","    000000000000         00000000000000000000       ","    0000000000000       00000000000000000000000     ","     00000000000       00000000000000000000000      ","      000000000         000000000000000000000       ","      00000000           00000000000  0000000       ","       000000             00000000       000  00    ","        0000               000000             000   ","        0000                00000            00000  ","         00                  000              000   ","          0                   0                     "];
          const landDots: {x: number, y: number}[] = [];
          mapStr.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
              if (row[x] === '0') landDots.push({ x, y });
            }
          });

          // 2. Define Base Anchors (Key Cities)
          const BASE_CITIES: any[] = [];

          // 3. Extract Unique Areas from Customers
          const areaCounts: Record<string, number> = {};
          (customers as any[]).forEach((c: any) => {
            const a = (c.area || 'Unknown').trim();
            areaCounts[a] = (areaCounts[a] || 0) + 1;
          });

          // 4. Build mapDataPois (Discover New Areas)
          const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#e11d48', '#0ea5e9', '#6366f1', '#f43f5e', '#14b8a6', '#8b5cf6'];
          const finalPois: any[] = [...BASE_CITIES.map((c: any) => ({ ...c, value: 0 }))];
          
          Object.entries(areaCounts).forEach(([areaName, count]) => {
            const areaLower = areaName.toLowerCase();
            const anchor = finalPois.find((p: any) => p.keywords?.some((kw: string) => areaLower.includes(kw)));
            
            if (anchor) {
              anchor.value += count;
            } else {
              // It's a new area! Dynamically allocate.
              // Find a land dot that is far from existing POIs
              const existingCoords = finalPois.map((p: any) => ({ x: p.x, y: p.y }));
              const availableDots = landDots.filter((dot: any) => 
                !existingCoords.some(ex => Math.abs(ex.x - dot.x) < 4 && Math.abs(ex.y - dot.y) < 3)
              );
              
              const targetDot = availableDots.length > 0 
                ? availableDots[Math.abs(areaName.split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % availableDots.length]
                : landDots[Math.abs(areaName.split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % landDots.length];

              finalPois.push({
                city: getAreaName(areaName),
                x: targetDot.x,
                y: targetDot.y,
                value: count,
                color: COLORS[finalPois.length % COLORS.length],
                icon: <Rocket size={14} />, // Building icon for new cities as requested
                isDynamic: true
              });
            }
          });

          // Finalize POIs (Visual minimum for dots)
          const mapDataPois = finalPois.map(p => ({
            ...p,
            displayValue: Math.max(p.value, 1)
          })).sort((a,b) => b.value - a.value);

          const totalMapCust = customers.length || 0;
          return (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2, marginBottom: '24px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>Pesebaran Wilayah Customer</div>
                </div>


                <div style={{ flex: 1, minHeight: '300px', margin: '0 -32px -16px -32px', position: 'relative', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  
                  {/* Floating City Cards (Limit to top 8 to avoid clutter) */}
                  {mapDataPois.slice(0, 8).map((p) => {
                    const left = `${((p.x * 10 + 20) / 540) * 100}%`;
                    const top = `${((p.y * 11 + 20) / 160) * 100}%`;
                    if (p.value === 0) return null; // Only show active areas
                    
                    return (
                      <div key={p.city} style={{ 
                        position: 'absolute', 
                        left, top, 
                        transform: 'translate(-50%, -130%)',
                        background: '#fff', 
                        padding: '10px 16px', 
                        borderRadius: '16px', 
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        border: '1px solid rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '10px', 
                          background: `${p.color}15`, color: p.color, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '16px' 
                        }}>{p.icon}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1.2 }}>{p.city}</div>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b' }}>{p.value} Cust</div>
                        </div>
                      </div>
                    );
                  })}

                  <svg width="100%" height="100%" viewBox="0 0 540 160" style={{ transform: 'scale(1.1)', position: 'relative', zIndex: 1 }}>
                    {(() => {
                        const getDotFill = (cx: number, cy: number) => { for (const p of mapDataPois) { const dist = Math.sqrt(Math.pow(cx-p.x,2)+Math.pow(cy-p.y,2)); if(dist<1.0)return p.color; if(dist<2.5)return`${p.color}aa`; if(dist<4.0)return`${p.color}40`; } return '#e2e8f0'; };
                       const dots: any[] = [];
                      mapStr.forEach((row, y) => {
                        for (let x = 0; x < row.length; x++) {
                          if (row[x] === '0') {
                            const cx = x * 10 + (y % 2 !== 0 ? 5 : 0);
                            const cy = y * 11;
                            dots.push(
                              <circle
                                key={`${x}-${y}`}
                                cx={cx + 20}
                                cy={cy + 20}
                                r="4.5"
                                fill={getDotFill(x, y)}
                                style={{ transition: 'all 0.5s ease', cursor: 'pointer' }}
                                onMouseEnter={(e: React.MouseEvent<SVGCircleElement>) => {
                                  const target = e.currentTarget as SVGCircleElement;
                                  target.style.transform = 'scale(1.5)';
                                  target.style.transformOrigin = `${cx + 20}px ${cy + 20}px`;
                                }}
                                onMouseLeave={(e: React.MouseEvent<SVGCircleElement>) => {
                                  const target = e.currentTarget as SVGCircleElement;
                                  target.style.transform = 'scale(1)';
                                }}
                              />
                            );
                          }
                        }
                      });
                       return <>{dots}</>; // Removed the old city labels as we use floating cards now
                    })()}
                  </svg>
                </div>

                {/* Stats Row: Now Below Map - Refined Size & Position */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', marginBottom: '8px', zIndex: 2 }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.02em' }}>Wilayah Aktif</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>{mapDataPois.filter(p => p.value > 0).length} Wilayah</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.02em' }}>Total Customer</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>{totalMapCust} Cust</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px', zIndex: 2 }}>
                  <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Distribusi Kota</div>
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>•••</span>
                    </div>
                    {mapDataPois.slice(0, 4).map(area => {
                      const pct = totalMapCust > 0 ? Math.round((area.value / totalMapCust) * 100) : 0;
                      return (
                        <div key={area.city} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: area.color }} />
                            {area.city}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>
                            {area.value} <span style={{ color: '#94a3b8', fontWeight: 600, marginLeft: '4px', width: '32px', display: 'inline-block', textAlign: 'right' }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                 <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><div style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Top 5 Growth</div><span style={{ fontSize: '12px', color: '#cbd5e1' }}>•••</span></div>
                   <div style={{ position: 'relative', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                     {(() => { 
                       const top = [...mapDataPois].sort((a,b) => b.value - a.value).slice(0, 5); 
                       return (
                         <>
                           <svg width="110" height="110" viewBox="0 0 110 110" style={{transform:'rotate(-90deg)'}}>
                             <circle cx="55" cy="55" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
                             {top.map((t, idx) => {
                               const dash = 282.7;
                               const offset = dash * (1 - (0.85 - idx * 0.15));
                               return <circle key={idx} cx="55" cy="55" r="45" fill="none" stroke={t.color} strokeWidth="8" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" />;
                             })}
                           </svg>
                           <div style={{position:'absolute',display:'flex',flexDirection:'column',alignItems:'center'}}>
                             <span style={{fontSize:'14px',marginBottom:'2px'}}>{top[0]?.icon || <Rocket size={14} />}</span>
                             <span style={{fontSize:'9px',fontWeight:800,color:'#94a3b8'}}>{top[0]?.city||'Area'}</span>
                             <span style={{fontSize:'14px',fontWeight:900,color:'#10b981'}}>+{(top[0]?.value/2).toFixed(0)} Baru</span>
                           </div>
                         </>
                       ); 
                     })()}
                   </div>
                 </div>
                 <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                   {(() => { 
                     // Group activity orders by area
                     const areaSoCounts: Record<string, number> = {};
                     (activities as any[]).filter((a: any) => a.tipe_aksi === 'Order').forEach((a: any) => {
                        // Priority: 1. Activity Geotag, 2. Target Area (Customer/Prospek)
                        let area = (a as any).geotagging?.area;
                        
                        if (!area) {
                          // Fallback to customer/prospek data
                          const target = realCustomers.find((c: any) => c.id === a.target_id) || 
                                         realProspek.find((p: any) => p.id === a.target_id);
                          area = target?.area;
                        }
                        
                        const finalArea = area || 'Lainnya';
                        areaSoCounts[finalArea] = (areaSoCounts[finalArea] || 0) + 1;
                     });
                     
                     const soAreasUnsorted = Object.entries(areaSoCounts).map(([city, val]) => {
                       const staticData = mapDataPois.find(p => p.city === city) || { icon: <Rocket size={14} />, color: '#10b981' };
                       return { city, so_val: val, icon: staticData.icon, color: staticData.color };
                     });
                     
                     const soAreas = soAreasUnsorted.sort((a,b) => b.so_val - a.so_val).slice(0, 5);
                     const topA = soAreas[0];
                     const maxSO = topA?.so_val || 1;

                     return (
                       <>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                          <div style={{fontSize:'12px',fontWeight:800,color:'#475569'}}>Top Area Order (SO)</div>
                          <span style={{fontSize:'12px',color:'#cbd5e1'}}>•••</span>
                        </div>
                        <div style={{fontSize:'20px',fontWeight:900,color:'#1e293b',marginBottom:'2px'}}>{totalActivityCount.toLocaleString()} Activitas</div>
                        <div style={{fontSize:'9px',fontWeight:800,color:'#10b981',display:'flex',alignItems:'center',gap:'4px'}}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 19L19 5M19 5v10M19 5H9"/></svg>
                          Dominan di {topA?.city || 'N/A'}<span style={{color:'#94a3b8',marginLeft:'2px'}}>({topA?.so_val || 0} SO)</span>
                        </div>
                        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flex:1,marginTop:'32px',position:'relative',minHeight:'70px'}}>
                          {soAreas.map((pin, i) => {
                            const h = Math.max(15, (pin.so_val / maxSO) * 65);
                            const active = i === 0;
                            return (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative', width: '20%' }}>
                                <div style={{ position: 'absolute', bottom: `calc(40px + ${h}%)`, fontSize: '8px', fontWeight: 800, color: active ? '#1e293b' : '#94a3b8', background: active ? '#e2e8f0' : 'transparent', padding: active ? '2px 6px' : '0', borderRadius: '4px', zIndex: 10 }}>{pin.so_val}</div>
                                <div style={{ position: 'absolute', bottom: '34px', height: `${h}%`, width: '2px', background: active ? pin.color : '#e2e8f0', borderRadius: '2px' }} />
                                <div style={{ position: 'absolute', bottom: `calc(34px + ${h}%)`, width: '4px', height: '4px', background: active ? pin.color : '#94a3b8', borderRadius: '50%', transform: 'translateY(50%)', boxShadow: active ? `0 0 8px ${pin.color}aa` : 'none' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', gap: '4px' }}>
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: active ? pin.color : '#fff', color: active ? '#fff' : '#64748b', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: active ? 'none' : '1px solid #e2e8f0', opacity: active ? 1 : 0.6 }}>{pin.icon}</div>
                                  <div style={{ fontSize: '7px', fontWeight: 800, color: active ? '#475569' : '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', whiteSpace: 'nowrap' }}>{pin.city.substring(0, 3)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                     ); 
                    })()}
                </div>
              </div>
            </div>
          );
        })()}
      </div>




      {/* PHOTO VIEWER MODAL - PREMIUM */}
      {selectedImage && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fade-in 0.3s ease', padding: '40px'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div 
            style={{ 
              background: '#fff', 
              width: '100%', maxWidth: '1000px', 
              borderRadius: '32px', 
              overflow: 'hidden', 
              display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 350px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              animation: 'scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              maxHeight: '90vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(15,23,42,0.1)', border: 'none', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            {/* Image Side */}
            <div style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>
               <img 
                 src={selectedImage.url} 
                 alt="Bukti Lapangan" 
                 style={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain' }} 
               />
            </div>

            {/* Content Side */}
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Detail Aktivitas</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>{selectedImage.store}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#facc15', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedImage.sales.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{selectedImage.sales}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Field Salesman</div>
                    </div>
                  </div>
               </div>

               <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }} />

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '13px', fontWeight: 750 }}>
                    <Calendar size={16} /> 
                    {new Date(selectedImage.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '13px', fontWeight: 750 }}>
                    <Zap size={16} color="#facc15" /> 
                    {new Date(selectedImage.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>

               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Catatan Hasil</div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '14px', lineHeight: 1.6, color: '#475569', fontWeight: 600 }}>
                    {selectedImage.note || 'Tidak ada catatan aktivitas.'}
                  </div>
               </div>

               <button 
                 onClick={() => setSelectedImage(null)}
                 style={{ background: '#1e293b', border: 'none', borderRadius: '16px', padding: '16px', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(30,41,59,0.1)' }}
               >
                 TUTUP
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
