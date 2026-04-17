import { useMemo, useState, useRef, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Users, Loader2, MapPin, CheckCircle, Crosshair, AlertTriangle } from 'lucide-react';
import { store } from '../../store/dataStore';

interface Props { salesId: string; }

const AREA_CONFIG: { area: string; emoji: string; desc: string; color: string; center: [number, number] }[] = [
  { area: 'SMD', emoji: '🏙️', desc: 'Samarinda', color: '#6366f1', center: [-0.4948, 117.1436] },
  { area: 'BPN', emoji: '🏢', desc: 'Balikpapan', color: '#10b981', center: [-1.2654, 116.8312] },
  { area: 'PJM', emoji: '🏘️', desc: 'Penajam', color: '#f59e0b', center: [-1.2427, 116.7118] },
  { area: 'SPK', emoji: '🏗️', desc: 'Sepaku (IKN)', color: '#ef4444', center: [-0.920, 116.75] },
  { area: 'TNG', emoji: '🌿', desc: 'Tanah Grogot', color: '#8b5cf6', center: [-1.9056, 116.1914] },
  { area: 'BTG', emoji: '🏭', desc: 'Bontang', color: '#06b6d4', center: [0.1333, 117.5] },
  { area: 'BK', emoji: '⚓', desc: 'Berau', color: '#ec4899', center: [2.15, 117.48] },
];

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Marker Icons
const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color:${color};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px ${color}"></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10]
});
const iconRed = createIcon('#ef4444');
const iconYellow = createIcon('#facc15');
const iconGreen = createIcon('#10b981');
const iconBlue = createIcon('#3b82f6');

// MapUpdater is deprecated in favor of mapRef

export default function ActivityReport({ salesId }: Props) {
  const { activities, customers, prospek, masterAreas, sales = [], refresh } = useSalesData();
  const currentSales = sales.find(s => s.id === salesId);
  const salesName = currentSales?.nama;
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'General' | 'Customer' | 'Prospek'>('General');
  const [targetId, setTargetId] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>({ lat: -1.265, lng: 116.83 }); // Default Balikpapan
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipeAksi, setTipeAksi] = useState<string>('Visit');
  const mapRef = useRef<L.Map | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Derived Target Info
  const myCustomers = customers.filter(c => c.sales_pic === salesId);
  const myProspek = prospek.filter(p => p.sales_owner === salesId);
  
  const targetData = useMemo(() => {
    if (!targetId || targetType === 'General') return null;
    let name = ''; let isUrgent = false; let isNew = false;
    
    // Find past location from activity geotagging if exists
    const pastAct = activities.find(a => a.target_id === targetId && a.geotagging?.lat);
    let targetLoc = pastAct?.geotagging?.lat && pastAct?.geotagging?.lng ? { lat: pastAct.geotagging.lat, lng: pastAct.geotagging.lng } : null;

    if (targetType === 'Customer') {
      const c = myCustomers.find(x => x.id === targetId);
      if (c) {
        name = c.nama_toko;
        if (c.last_order_date) {
          const days = Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / (1000 * 3600 * 24));
          isUrgent = days > 14;
        }
      }
    } else {
      const p = myProspek.find(x => x.id === targetId);
      if (p) { name = p.nama_toko; isNew = p.status === 'Cold' || !pastAct; }
    }
    
    // Fallback: If no past location, arbitrarily place it 50m away from sales just for demo
    if (!targetLoc && location) {
         targetLoc = { lat: location.lat + 0.0003, lng: location.lng + 0.0003 };
    }

    return { id: targetId, name, isUrgent, isNew, loc: targetLoc };
  }, [targetId, targetType, activities, myCustomers, myProspek, location]);

  const mapCenter: [number, number] = targetData?.loc ? [targetData.loc.lat, targetData.loc.lng] : location ? [location.lat, location.lng] : [-1.265, 116.83];

  const distanceMeters = useMemo(() => {
    if (!location || !targetData?.loc) return null;
    return getDistanceFromLatLonInM(location.lat, location.lng, targetData.loc.lat, targetData.loc.lng);
  }, [location, targetData]);

  const lockCheckIn = targetType !== 'General' && distanceMeters !== null && distanceMeters > 100;

  useEffect(() => {
    // Auto detect area
    if (location && !selectedArea) {
      let closest = AREA_CONFIG[0]; let minDist = Infinity;
      AREA_CONFIG.forEach(ac => {
        const d = getDistanceFromLatLonInM(location.lat, location.lng, ac.center[0], ac.center[1]);
        if (d < minDist) { minDist = d; closest = ac; }
      });
      setSelectedArea(closest.area);
    }
  }, [location, selectedArea]);

  useEffect(() => {
    // Auto-fetch GPS strictly on first load
    handleGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (mapRef.current) {
          mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 1.5 });
        }
        setIsLocating(false);
      },
      (err) => { alert('Location failed: ' + err.message); setIsLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (targetData?.loc && mapRef.current) {
      mapRef.current.flyTo([targetData.loc.lat, targetData.loc.lng], 16, { animate: true, duration: 1 });
    }
  }, [targetData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > 800 ? 800 / img.width : 1;
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoBase64(canvas.toDataURL('image/jpeg', 0.6));
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCheckIn = async () => {
    if (isSubmitting) return; // Prevention
    if (!selectedArea) return alert('Select area!');
    if (targetType !== 'General' && !targetId) return alert('Select store!');
    if (!photoBase64 || !location) return alert('GPS & Photo required!');
    if (lockCheckIn) return alert('You are too far from target!');

    setIsSubmitting(true);
    setSaveError(null);
    try {
      let tName = targetData ? targetData.name : `Aktivitas area ${selectedArea}`;
      const { error } = await store.logActivity({
        id_sales: salesId,
        target_id: targetType === 'General' ? salesId : targetId,
        target_type: targetType === 'General' ? 'area' : (targetType === 'Customer' ? 'customer' : 'prospek'),
        target_nama: tName, 
        tipe_aksi: tipeAksi as any,
        sales_name: salesName,
        catatan_hasil: catatan || `${tipeAksi} di ${tName}`,
        geotagging: { area: selectedArea, lat: location.lat, lng: location.lng, photo: photoBase64 }
      });

      if (error) {
        setSaveError('Gagal menyimpan laporan. Periksa koneksi Anda.');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      await refresh();
      setTimeout(() => {
          setSuccess(false); setCatatan(''); setPhotoBase64(null); setTargetId(''); setTargetType('General');
          setTipeAksi('Visit');
          setIsSubmitting(false);
      }, 2000);
    } catch (err) {
      setSaveError('Kesalahan sistem saat menyimpan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: 0, overflow: 'hidden' }}>
      {/* MAP BACKGROUND LAYER */}
      <div style={{ height: '45vh', width: '100%', position: 'relative', background: '#e2e8f0', zIndex: 0, flexShrink: 0 }}>
        <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          
          {location && (
            <Marker position={[location.lat, location.lng]} icon={iconBlue}>
              <Popup>📌 Your Location</Popup>
            </Marker>
          )}

          {targetData?.loc && (
            <Marker position={[targetData.loc.lat, targetData.loc.lng]} icon={targetData.isUrgent ? iconRed : targetData.isNew ? iconYellow : iconGreen}>
              <Popup>{targetData.name}</Popup>
            </Marker>
          )}
        </MapContainer>
        
        {targetData && targetData.loc && distanceMeters !== null && (
          <div className="distance-overlay" style={{ background: lockCheckIn ? '#FEF2F2' : '#ECFDF5', 
             position: 'absolute', top: '24px', left:'50%', transform:'translateX(-50%)', zIndex: 1000, 
             padding: '8px 20px', borderRadius: '30px', color: lockCheckIn ? '#EF4444' : '#059669', border: lockCheckIn ? '1px solid #FCA5A5' : '1px solid #6EE7B7', fontWeight: 900, fontSize: '13px', display:'flex', gap:'6px', alignItems:'center', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
            <MapPin size={16} /> {distanceMeters}m from {targetData.name}
          </div>
        )}

        <button 
          style={{ position: 'absolute', bottom: '50px', right: '20px', zIndex: 1000, background: '#ffffff', width: '52px', height: '52px', borderRadius: '50%', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', opacity: isLocating ? 0.7 : 1 }}
          onClick={handleGetLocation}
          disabled={isLocating}
        >
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isLocating ? <Loader2 size={22} color="#94a3b8" className="animate-spin" /> : <Crosshair size={22} color={location ? "#F59E0B" : "#64748b"} />}
          </span>
        </button>
      </div>

      {/* PREMIUM HEADER - Grab Style */}
      <div className="hero-compact" style={{ 
        padding: 'calc(16px + env(safe-area-inset-top)) 20px 48px', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'var(--brand-yellow)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        zIndex: 50,
        marginTop: '-30px' // Pull up over the map slightly
      }}>
        <div style={{ width: '40px', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', margin: '0 auto 12px' }}></div>
        <h2 className="hero-premium-title" style={{ fontSize: '22px', margin: 0 }}>Laporan Aktivitas</h2>
      </div>

      {/* FOREGROUND PANEL */}
      <div style={{ 
        background: '#ffffff', 
        position: 'relative', zIndex: 10, padding: '24px 20px 100px', 
        display: 'flex', flexDirection: 'column', gap: '16px', 
        maxHeight: '55vh', overflowY: 'auto'
      }}>

        {success && (
          <div className="animate-fade-up" style={{ background: '#ECFDF5', border: '1px solid #34D399', borderRadius: '16px', padding: '14px', color: '#059669', fontWeight: '800', display: 'flex', gap: '8px', alignItems:'center', fontSize: '14px' }}>
            <CheckCircle size={18} /> Laporan Aktivitas Berhasil Disimpan!
          </div>
        )}

        {saveError && (
          <div className="animate-shake" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '16px', padding: '14px', color: '#EF4444', fontWeight: '800', display: 'flex', gap: '8px', alignItems:'center', fontSize: '14px' }}>
            <AlertTriangle size={18} /> {saveError}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>Pilih Area Referensi</label>
          <select 
            className="form-input" 
            style={{ width: '100%', background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '14px', fontSize: '14px', fontWeight: 700, color: '#1e293b', outline: 'none' }} 
            value={selectedArea || ''} 
            onChange={e => setSelectedArea(e.target.value)}
          >
             <option value="">-- Deteksi Area Otomatis --</option>
             {masterAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', margin: 0 }}>Tujuan Kunjungan (Toko)</label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select className="form-input" style={{ width: '100%', background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '14px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }} value={targetType} onChange={e => { setTargetType(e.target.value as any); setTargetId(''); }}>
              <option value="General">Kunjungan Umum</option>
              <option value="Customer">Customer</option>
              <option value="Prospek">Prospek</option>
            </select>

            {targetType === 'Customer' && (
              <select className="form-input" style={{ width: '100%', border: '2px solid #10B981', borderRadius: '16px', padding: '14px', fontSize: '14px', fontWeight: 800, color: '#059669', background: '#F0FDF4' }} value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">-- Pilih Pelanggan --</option>
                {myCustomers.map(c => <option key={c.id} value={c.id}>{c.nama_toko}</option>)}
              </select>
            )}

            {targetType === 'Prospek' && (
              <select className="form-input" style={{ width: '100%', border: '2px solid #3b82f6', borderRadius: '16px', padding: '14px', fontSize: '14px', fontWeight: 800, color: '#1d4ed8', background: '#EFF6FF' }} value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">-- Pilih Prospek --</option>
                {myProspek.map(p => <option key={p.id} value={p.id}>{p.nama_toko}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Activity type selection removed as per simplified workflow */}


        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Lampiran Foto Bukti</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              className="tap-active"
              onClick={() => cameraInputRef.current?.click()}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', borderRadius: '20px', border: '2px dashed #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '12px', fontWeight: 800 }}
            >
              <Camera size={20} />
              <span>Ambil Foto</span>
            </button>
            <button 
              className="tap-active"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px', borderRadius: '20px', border: '2px dashed #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '12px', fontWeight: 800 }}
            >
              <Users size={20} />
              <span>Pilih Galeri</span>
            </button>
          </div>
          <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {photoBase64 && <div className="animate-scale" style={{ padding: '4px', background: '#fff', border: '2px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden' }}><img src={photoBase64} alt="Bukti" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '16px' }} /></div>}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>Catatan Hasil</label>
          <textarea className="form-input" style={{ width: '100%', background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1e293b', minHeight: '100px', outline: 'none' }} placeholder="Tulis hasil kunjungan..." value={catatan} onChange={e => setCatatan(e.target.value)} />
        </div>

        <button 
          onClick={handleCheckIn} 
          disabled={lockCheckIn || isSubmitting} 
          className="tap-active"
          style={{ 
            width: '100%', padding: '18px', 
            background: lockCheckIn ? '#F1F5F9' : (isSubmitting ? '#E2E8F0' : 'var(--brand-yellow)'), 
            color: lockCheckIn ? '#94A3B8' : '#111827', 
            borderRadius: '20px', fontWeight: 900, fontSize: '16px', border: 'none', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: lockCheckIn ? 'none' : '0 10px 20px rgba(255, 204, 0, 0.2)'
          }}
        >
          {isSubmitting ? <Loader2 size={22} className="animate-spin" /> : 'Kirim Laporan Aktivitas'}
        </button>
      </div>
    </div>
  );
}
