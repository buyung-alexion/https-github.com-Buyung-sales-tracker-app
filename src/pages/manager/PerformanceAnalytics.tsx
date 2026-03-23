import React, { useState } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { TrendingUp, Target, Users, Filter } from 'lucide-react';

export default function PerformanceAnalytics() {
  const { sales, activities, prospek, customers } = useSalesData();
  const [dateFilter, setDateFilter] = useState<string>('month');
  const [salesFilter, setSalesFilter] = useState<string>('All');

  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekMs = todayMs - (7 * 86400000);
  const monthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const getStartDate = () => {
    if (dateFilter === 'today') return todayMs;
    if (dateFilter === 'week') return weekMs;
    if (dateFilter === 'month') return monthMs;
    return 0;
  };
  const startDate = getStartDate();

  const filteredSales = sales.filter(s => salesFilter === 'All' || s.id === salesFilter);

  const statsPerSales = filteredSales.map(s => {
    const myActs = activities.filter(a => a.id_sales === s.id);
    const myActsFiltered = myActs.filter(a => new Date(a.timestamp).getTime() >= startDate);
    const myProspek = prospek.filter(p => p.sales_owner === s.id);
    const myCustomers = customers.filter(c => c.sales_pic === s.id);
    const closings = myActsFiltered.filter(a => a.catatan_hasil.includes('CLOSING'));
    const closingRate = myProspek.length + myCustomers.length > 0
      ? Math.round((closings.length / (myProspek.length + myCustomers.length + closings.length)) * 100)
      : 0;
    const engagementRate = myCustomers.length > 0
      ? +(myActsFiltered.filter(a => a.target_type === 'customer').length / myCustomers.length).toFixed(1)
      : 0;
    const waCount = myActsFiltered.filter(a => a.tipe_aksi === 'WA').length;
    const visitCount = myActsFiltered.filter(a => a.tipe_aksi === 'Visit').length;
    const callCount = myActsFiltered.filter(a => a.tipe_aksi === 'Call').length;
    return {
      nama: s.nama, armada: s.armada,
      prospekCount: myProspek.length,
      customerCount: myCustomers.length,
      closingCount: closings.length,
      closingRate, engagementRate,
      waCount, visitCount, callCount,
      totalActs: myActsFiltered.length,
      target_closing: s.target_closing_baru,
      target_prospek: s.target_prospek_baru,
    };
  });

  const radarData = [
    { subject: 'Prospek', ...Object.fromEntries(statsPerSales.map(s => [s.nama, Math.min(100, Math.round(s.prospekCount / s.target_prospek * 100))])) },
    { subject: 'Closing', ...Object.fromEntries(statsPerSales.map(s => [s.nama, Math.min(100, Math.round(s.closingCount / s.target_closing * 100))])) },
    { subject: 'WA', ...Object.fromEntries(statsPerSales.map(s => [s.nama, Math.min(100, s.waCount * 5)])) },
    { subject: 'Visit', ...Object.fromEntries(statsPerSales.map(s => [s.nama, Math.min(100, s.visitCount * 3)])) },
    { subject: 'Call', ...Object.fromEntries(statsPerSales.map(s => [s.nama, Math.min(100, s.callCount * 5)])) },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

  return (
    <div className="mgr-page">
      <div className="mgr-page-header">
        <div>
          <h1 className="mgr-title">Performance Analytics</h1>
          <p className="mgr-sub">Analisis mendalam performa setiap sales</p>
        </div>
      </div>

      <div className="mgr-filters">
        <div className="filter-row">
          <Filter size={13} />
          <span>Waktu:</span>
          <select className="form-input" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
            <option value="all">Semua Waktu</option>
          </select>
          <span className="divider">|</span>
          <span>Sales:</span>
          {[{ id: 'All', nama: 'Semua' }, ...sales].map(s => (
            <button key={s.id} className={`filter-chip ${salesFilter === s.id ? 'active' : ''}`} onClick={() => setSalesFilter(s.id)}>{s.nama}</button>
          ))}
        </div>
      </div>

      {statsPerSales.length === 0 ? (
        <div className="empty-row" style={{ marginTop: '40px' }}>Tidak ada data sales yang cocok dengan filter.</div>
      ) : (
        <>
          {/* KPI Cards */}
      <div className="kpi-grid">
        {statsPerSales.map((s, i) => (
          <div key={s.nama} className="kpi-card" style={{ '--kpi-color': COLORS[i] } as React.CSSProperties}>
            <div className="kpi-header">
              <div className="kpi-name">{s.nama}</div>
            </div>
            <div className="kpi-metrics">
              <div className="kpi-metric">
                <span className="kpi-val">{s.closingRate}%</span>
                <span className="kpi-lbl">Closing Rate</span>
              </div>
              <div className="kpi-metric">
                <span className="kpi-val">{s.engagementRate}×</span>
                <span className="kpi-lbl">Engagement</span>
              </div>
              <div className="kpi-metric">
                <span className="kpi-val">{s.totalActs}</span>
                <span className="kpi-lbl">Aktivitas</span>
              </div>
            </div>
            <div className="kpi-breakdown">
              <span>💬 {s.waCount}</span>
              <span>📍 {s.visitCount}</span>
              <span>📞 {s.callCount}</span>
              <span>🤝 {s.closingCount} closing</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart - Activity Comparison */}
      <div className="chart-card">
        <h3><TrendingUp size={16} /> Perbandingan Aktivitas Bulan Ini</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={statsPerSales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="nama" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#fff' }} />
            <Legend />
            <Bar dataKey="waCount" name="WhatsApp" fill="#6366f1" radius={[4,4,0,0]} />
            <Bar dataKey="visitCount" name="Visit" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="callCount" name="Call" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart - Performance Profile */}
      <div className="chart-card">
        <h3><Target size={16} /> Profil Performa (% dari Target)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.15)" />
            <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.6)" />
            {statsPerSales.map((s, i) => (
              <Radar key={s.nama} name={s.nama} dataKey={s.nama} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
            ))}
            <Legend />
            <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#fff' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="chart-card">
        <h3><Users size={16} /> Tabel Performa Detail</h3>
        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Sales</th><th>Prospek</th><th>Customer</th>
                <th>Closing</th><th>Closing Rate</th><th>Engagement/Customer</th>
              </tr>
            </thead>
            <tbody>
              {statsPerSales.sort((a, b) => b.closingRate - a.closingRate).map((s, i) => (
                <tr key={s.nama}>
                  <td><strong>{i + 1}. {s.nama}</strong></td>
                  <td>{s.prospekCount} / {s.target_prospek}</td>
                  <td>{s.customerCount}</td>
                  <td>{s.closingCount}</td>
                  <td>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar" style={{ width: `${s.closingRate}%`, background: s.closingRate >= 50 ? '#10b981' : s.closingRate >= 25 ? '#f59e0b' : '#ef4444' }} />
                      <span>{s.closingRate}%</span>
                    </div>
                  </td>
                  <td>{s.engagementRate}×/bulan</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
