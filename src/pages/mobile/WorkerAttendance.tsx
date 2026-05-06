import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Play, 
  Square, 
  MapPin, 
  Clock, 
  DollarSign, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { AreaRate, AttendanceRecord } from '../../types';

interface WorkerAttendanceProps {
  userId: string;
}

export default function WorkerAttendance({ userId }: WorkerAttendanceProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [payrollSettings, setPayrollSettings] = useState<Record<string, number>>({});
  const [areaRates, setAreaRates] = useState<AreaRate[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [isOutOfCity, setIsOutOfCity] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Area Rates
      const { data: rates } = await supabase
        .from('area_rates')
        .select('*')
        .order('area_name');
      setAreaRates(rates || []);

      // 2. Fetch Settings
      const { data: settings } = await supabase.from('payroll_settings').select('setting_key, setting_value');
      if (settings) {
        const sMap: Record<string, number> = {};
        settings.forEach(s => sMap[s.setting_key] = s.setting_value);
        setPayrollSettings(sMap);
      }

      // 3. Fetch Today's Attendance
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: att } = await supabase
        .from('attendance_records')
        .select('*, area_rates(area_name)')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (att) {
        setAttendance({
          ...att,
          area_name: att.area_rates?.area_name
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    
    // Determine base rate from settings
    let baseRate = 0;
    const { data: userData } = await supabase.from('sales').select('role').eq('id', userId).single();
    const role = (userData?.role || 'Helper').toLowerCase();
    
    baseRate = payrollSettings[`rate_${role}`] || 150000;

    const outOfCityBonus = isOutOfCity ? (payrollSettings['out_of_city_bonus'] || 50000) : 0;
    const initialTotal = baseRate + outOfCityBonus;

    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          user_id: userId,
          date: format(new Date(), 'yyyy-MM-dd'),
          area_id: selectedAreaId || null,
          check_in: new Date().toISOString(),
          daily_rate_applied: baseRate,
          overtime_rate_applied: payrollSettings['overtime_flat_bonus'] || 25000,
          is_out_of_city: isOutOfCity,
          status: 'Hadir',
          total_pay: initialTotal
        })
        .select()
        .single();

      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Gagal Check-In: ' + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance) return;
    if (!window.confirm('Sudah selesai bekerja hari ini?')) return;

    setSubmitting(true);
    const checkOutTime = new Date();
    
    // Overtime rule: Flat bonus if check_out > threshold_hour
    const thresholdHour = payrollSettings['overtime_start_hour'] || 18;
    const isOvertime = checkOutTime.getHours() >= thresholdHour;
    const overtimePay = isOvertime ? (attendance.overtime_rate_applied || 25000) : 0;
    const outOfCityBonus = attendance.is_out_of_city ? 50000 : 0;
    const totalPay = attendance.daily_rate_applied + overtimePay + outOfCityBonus;

    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out: checkOutTime.toISOString(),
          overtime_hours: isOvertime ? 1 : 0, // Using 1 as flag for flat overtime
          total_pay: Math.round(totalPay)
        })
        .eq('id', attendance.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Gagal Check-Out');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
        <div className="loader">Memuat...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px 100px', background: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0F172A', margin: 0 }}>Kehadiran Kerja</h1>
      </div>

      {!attendance ? (
        /* CHECK-IN VIEW */
        <div className="animate-fade-in">
          <div style={{ 
            background: '#fff', borderRadius: '24px', padding: '24px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.03)', marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: '#E0F2FE', borderRadius: '12px' }}>
                <MapPin size={24} color="#0EA5E9" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Pilih Area Tugas</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {areaRates.map(rate => (
                <button
                  key={rate.id}
                  onClick={() => setSelectedAreaId(rate.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: '16px', border: selectedAreaId === rate.id ? '2px solid #3B82F6' : '1.5px solid #F1F5F9',
                    background: selectedAreaId === rate.id ? '#EFF6FF' : '#fff',
                    transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>{rate.area_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Tarif: Rp {rate.daily_rate.toLocaleString()}</div>
                  </div>
                  {selectedAreaId === rate.id && <CheckCircle2 size={20} color="#3B82F6" />}
                </button>
              ))}
            </div>
          </div>

          {/* Luar Kota Toggle */}
          <div 
            onClick={() => setIsOutOfCity(!isOutOfCity)}
            style={{ 
              background: '#fff', borderRadius: '20px', padding: '16px 20px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: isOutOfCity ? '2px solid #F59E0B' : '1.5px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: isOutOfCity ? '#FEF3C7' : '#F1F5F9', borderRadius: '10px' }}>
                   <Truck size={20} color={isOutOfCity ? '#D97706' : '#64748B'} />
                </div>
                <div>
                   <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Tugas Luar Kota?</div>
                   <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Bonus Tambahan +Rp 50.000</div>
                </div>
             </div>
             <div style={{ 
               width: '44px', height: '24px', background: isOutOfCity ? '#F59E0B' : '#E2E8F0', 
               borderRadius: '12px', position: 'relative', transition: 'all 0.2s' 
             }}>
                <div style={{ 
                  width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                  position: 'absolute', top: '3px', left: isOutOfCity ? '23px' : '3px',
                  transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} />
             </div>
          </div>

          <button
            disabled={submitting || !selectedAreaId}
            onClick={handleCheckIn}
            className="tap-active"
            style={{
              width: '100%', padding: '20px', borderRadius: '20px', border: 'none',
              background: selectedAreaId ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#CBD5E1',
              color: '#fff', fontSize: '18px', fontWeight: 950, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              boxShadow: selectedAreaId ? '0 12px 24px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            {submitting ? 'Memproses...' : (
              <>
                <Play size={24} fill="currentColor" />
                Mulai Kerja (Check-In)
              </>
            )}
          </button>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', background: '#F1F5F9', borderRadius: '16px' }}>
             <AlertCircle size={20} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
             <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, fontWeight: 600 }}>
                Silakan pilih area sebelum memulai. Jam kerja dan lembur Anda akan dihitung secara otomatis oleh sistem.
             </div>
          </div>
        </div>
      ) : (
        /* ACTIVE / CHECKED-OUT VIEW */
        <div className="animate-fade-in">
          {/* Summary Card */}
          <div style={{ 
            background: attendance.check_out ? 'linear-gradient(135deg, #059669, #10B981)' : 'linear-gradient(135deg, #3B82F6, #2563EB)', 
            borderRadius: '24px', padding: '24px', color: '#fff', marginBottom: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, opacity: 0.8, marginBottom: '4px' }}>Status Hari Ini</div>
                <div style={{ fontSize: '20px', fontWeight: 950 }}>{attendance.check_out ? 'Selesai Kerja' : 'Sedang Bekerja'}</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '13px', fontWeight: 800 }}>
                {attendance.area_name}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px' }}>
                <Clock size={18} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8 }}>Mulai</div>
                <div style={{ fontSize: '16px', fontWeight: 900 }}>{format(new Date(attendance.check_in!), 'HH:mm')}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px' }}>
                <Clock size={18} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8 }}>Selesai</div>
                <div style={{ fontSize: '16px', fontWeight: 900 }}>{attendance.check_out ? format(new Date(attendance.check_out), 'HH:mm') : '--:--'}</div>
              </div>
            </div>
          </div>

          {/* Earnings Estimation */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="#059669" />
              Estimasi Pendapatan
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Upah Harian ({attendance.area_name})</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Rp {attendance.daily_rate_applied.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Upah Lembur (Bonus Jam {payrollSettings['overtime_start_hour'] || 18}:00)</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Rp {(attendance.overtime_hours > 0 ? (attendance.overtime_rate_applied || 25000) : 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Bonus Luar Kota</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Rp {(attendance.is_out_of_city ? 50000 : 0).toLocaleString()}</span>
              </div>
              <div style={{ paddingTop: '16px', borderTop: '1.5px dashed #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>Total Dibayar</span>
                <span style={{ fontSize: '20px', fontWeight: 950, color: '#059669' }}>Rp {attendance.total_pay.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {!attendance.check_out && (
            <button
              disabled={submitting}
              onClick={handleCheckOut}
              className="tap-active"
              style={{
                width: '100%', padding: '20px', borderRadius: '20px', border: 'none',
                background: '#FEE2E2', color: '#EF4444', fontSize: '18px', fontWeight: 950,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
              }}
            >
              {submitting ? 'Memproses...' : (
                <>
                  <Square size={20} fill="currentColor" />
                  Selesai Kerja (Check-Out)
                </>
              )}
            </button>
          )}

          {attendance.check_out && (
             <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ display: 'inline-flex', padding: '16px', background: '#DCFCE7', borderRadius: '50%', marginBottom: '16px' }}>
                   <CheckCircle2 size={32} color="#059669" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Terima Kasih!</div>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Pekerjaan Anda hari ini telah tercatat secara transparan.</div>
             </div>
          )}
        </div>
      )}

      {/* Mini Calendar / History Trigger */}
      <div style={{ marginTop: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Riwayat Minggu Ini</div>
            <button style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '14px', fontWeight: 700 }}>Lihat Semua</button>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fff', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                <div style={{ width: '44px', height: '44px', background: '#F1F5F9', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>MEI</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B' }}>0{4-i}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>Area {i === 1 ? 'Kota' : 'Sepaku'}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Rp 120.000 • 8 Jam</div>
                </div>
                <ChevronRight size={18} color="#CBD5E1" />
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
