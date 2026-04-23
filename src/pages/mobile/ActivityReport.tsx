import { useMemo, useState, useRef, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Users, Loader2, MapPin, CheckCircle, Crosshair, AlertTriangle, X } from 'lucide-react';
import { store } from '../../store/dataStore';

interface Props { salesId: string; onSuccess?: () => void; }

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

export default function ActivityReport({ salesId, onSuccess }: Props) {
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
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (mapRef.current) {
          mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 1.5 });
        }
      },
      (err) => { alert('Location failed: ' + err.message); },
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
          if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setSaveError('Kesalahan sistem saat menyimpan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: 0, overflow: 'hidden', background: '#f8fafc', height: '100%' }}>
      {/* 1. Header & Quick Map Preview */}
      <div style={{ height: '28vh', width: '100%', position: 'relative', zIndex: 0 }}>
        <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          {location && (
            <Marker position={[location.lat, location.lng]} icon={iconBlue} />
          )}
          {targetData?.loc && (
            <Marker position={[targetData.loc.lat, targetData.loc.lng]} icon={targetData.isUrgent ? iconRed : targetData.isNew ? iconYellow : iconGreen} />
          )}
        </MapContainer>
        
        {/* Map Overlays */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           {targetData && targetData.loc && distanceMeters !== null && (
             <div style={{ 
               background: lockCheckIn ? '#EF4444' : '#10B981', 
               padding: '6px 12px', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 900,
               boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '6px'
             }}>
               <MapPin size={14} /> {distanceMeters}m
             </div>
           )}
           <button 
             onClick={handleGetLocation}
             style={{ background: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
           >
             <Crosshair size={20} color="#F59E0B" />
           </button>
        </div>

        <div style={{ 
          position: 'absolute', bottom: '0', left: 0, right: 0, height: '30px', 
          background: 'linear-gradient(to top, #f8fafc, transparent)', zIndex: 10 
        }} />
      </div>

      {/* Drag Handle for Sheet Feel */}
      <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: '36px', height: '5px', background: '#E2E8F0', borderRadius: '10px' }} />
      </div>

      <div style={{ 
        height: '62vh', overflowY: 'auto', padding: '10px 20px 120px', 
        display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '0', position: 'relative', zIndex: 20,
        background: '#f8fafc'
      }}>
        
        {/* Status/Success Messages */}
        {success && (
          <div className="animate-fade-up" style={{ background: '#ECFDF5', border: '1px solid #34D399', borderRadius: '16px', padding: '14px', color: '#059669', fontWeight: '800', display: 'flex', gap: '8px', alignItems:'center', fontSize: '14px' }}>
            <CheckCircle size={18} /> Berhasil Disimpan!
          </div>
        )}
        {saveError && (
          <div className="animate-shake" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '16px', padding: '14px', color: '#EF4444', fontWeight: '800', display: 'flex', gap: '8px', alignItems:'center', fontSize: '14px' }}>
            <AlertTriangle size={18} /> {saveError}
          </div>
        )}

        {/* Section 1: Location & Target */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
           <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detail Kunjungan</div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px' }}>AREA</label>
                <select 
                  style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, outline: 'none' }} 
                  value={selectedArea || ''} 
                  onChange={e => setSelectedArea(e.target.value)}
                >
                  <option value="">-- Deteksi Otomatis --</option>
                  {masterAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>TIPE TARGET</label>
                <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '14px' }}>
                   {['General', 'Customer', 'Prospek'].map(t => (
                     <button 
                       key={t}
                       onClick={() => { setTargetType(t as any); setTargetId(''); }}
                       style={{ 
                         flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', 
                         fontSize: '12px', fontWeight: 800, transition: 'all 0.2s',
                         background: targetType === t ? '#fff' : 'transparent',
                         color: targetType === t ? '#1e293b' : '#64748b',
                         boxShadow: targetType === t ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                       }}
                     >
                       {t === 'General' ? 'Umum' : t}
                     </button>
                   ))}
                </div>
              </div>

              {targetType !== 'General' && (
                <div className="animate-fade-up">
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px' }}>NAMA TOKO</label>
                  <select 
                    style={{ 
                      width: '100%', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', 
                      fontSize: '14px', fontWeight: 800, color: '#1e293b', background: '#fff', outline: 'none' 
                    }} 
                    value={targetId} 
                    onChange={e => setTargetId(e.target.value)}
                  >
                    <option value="">-- Pilih Toko --</option>
                    {(targetType === 'Customer' ? myCustomers : myProspek).map(item => (
                      <option key={item.id} value={item.id}>{item.nama_toko}</option>
                    ))}
                  </select>
                </div>
              )}
           </div>
        </div>

        {/* Section 2: Photo & Evidence */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
           <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bukti Foto</div>
           
           <div style={{ display: 'flex', gap: '12px', marginBottom: photoBase64 ? '12px' : 0 }}>
              <button 
                onClick={() => cameraInputRef.current?.click()}
                style={{ flex: 1, height: '56px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontWeight: 800 }}
              >
                <Camera size={20} /> Kamera
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, height: '56px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontWeight: 800 }}
              >
                <Users size={20} /> Galeri
              </button>
           </div>
           
           {photoBase64 && (
             <div className="animate-scale" style={{ position: 'relative' }}>
                <img src={photoBase64} alt="Bukti" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '16px' }} />
                <button 
                  onClick={() => setPhotoBase64(null)}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} color="#EF4444" />
                </button>
             </div>
           )}

           <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
           <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* Section 3: Notes */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
           <div style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catatan Hasil</div>
           <textarea 
             style={{ width: '100%', border: 'none', background: '#F8FAFC', borderRadius: '16px', padding: '16px', fontSize: '15px', fontWeight: 600, minHeight: '120px', outline: 'none', resize: 'none' }} 
             placeholder="Apa hasil dari kunjungan ini?" 
             value={catatan} 
             onChange={e => setCatatan(e.target.value)} 
           />
        </div>

        {/* Submit Button (Removed from scroll area, now in fixed footer below) */}
      </div>

      {/* 3. Fixed Footer for Action Button */}
      <div style={{ 
        padding: '16px 20px calc(24px + env(safe-area-inset-bottom))', 
        background: '#fff', borderTop: '1px solid #f1f5f9', position: 'relative', zIndex: 30 
      }}>
        <button 
          onClick={handleCheckIn} 
          disabled={lockCheckIn || isSubmitting} 
          style={{ 
            width: '100%', height: '56px', 
            background: lockCheckIn ? '#E2E8F0' : (isSubmitting ? '#CBD5E1' : 'var(--brand-yellow)'), 
            color: '#111827', borderRadius: '16px', fontWeight: 950, fontSize: '16px', border: 'none', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: lockCheckIn ? 'none' : '0 8px 20px rgba(255, 193, 7, 0.3)'
          }}
        >
          {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : 'Kirim Laporan'}
        </button>
      </div>
    </div>
  );
}
