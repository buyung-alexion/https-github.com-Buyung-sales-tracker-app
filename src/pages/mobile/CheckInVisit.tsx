import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Camera, AlertTriangle, Crosshair, Loader2 } from 'lucide-react';
import { store } from '../../store/dataStore';
import { useSalesData } from '../../hooks/useSalesData';
import type { Area } from '../../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props { salesId: string; }

const AREA_CONFIG: { area: Area; emoji: string; desc: string; color: string; center: [number, number] }[] = [
  { area: 'Sepaku', emoji: '🏘️', desc: 'Kawasan Sepaku & sekitarnya', color: '#6366f1', center: [-0.920, 116.75] },
  { area: 'Gerogot', emoji: '🌿', desc: 'Kawasan Gerogot', color: '#10b981', center: [-1.890, 116.18] },
  { area: 'Kota', emoji: '🏙️', desc: 'Kota Balikpapan', color: '#f59e0b', center: [-1.265, 116.83] },
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

export default function CheckInVisit({ salesId }: Props) {
  const navigate = useNavigate();
  const { activities, customers, prospek } = useSalesData();
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [catatan, setCatatan] = useState('');
  const [success, setSuccess] = useState(false);
  const [targetType, setTargetType] = useState<'General' | 'Customer' | 'Prospek'>('General');
  const [targetId, setTargetId] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>({ lat: -1.265, lng: 116.83 }); // Default Balikpapan
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

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
      (err) => { alert('Gagal geolokasi: ' + err.message); setIsLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (targetData?.loc && mapRef.current) {
      mapRef.current.flyTo([targetData.loc.lat, targetData.loc.lng], 16, { animate: true, duration: 1 });
    }
  }, [targetData]);

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!selectedArea) return;
    if (targetType !== 'General' && !targetId) return alert('Pilih toko!');
    if (!photoBase64 || !location) return alert('Butuh GPS & Foto!');
    if (lockCheckIn) return alert('Anda terlalu jauh dari target!');

    let tName = targetData ? targetData.name : `Check-in area ${selectedArea}`;
    await store.logActivity({
      id_sales: salesId,
      target_id: targetType === 'General' ? salesId : targetId,
      target_type: targetType === 'General' ? 'area' : (targetType === 'Customer' ? 'customer' : 'prospek'),
      target_nama: tName, tipe_aksi: 'Visit',
      catatan_hasil: catatan || `Visit ke ${tName}`,
      geotagging: { area: selectedArea, lat: location.lat, lng: location.lng, photo: photoBase64 }
    });

    setSuccess(true);
    setTimeout(() => {
        setSuccess(false); setCatatan(''); setPhotoBase64(null); setTargetId(''); setTargetType('General');
    }, 2000);
  };

  return (
    <div className="page-content" style={{ padding: 0 }}>
      {/* MAP BACKGROUND LAYER */}
      <div style={{ height: '52vh', width: '100%', position: 'relative', background: '#e2e8f0', zIndex: 0, flexShrink: 0 }}>
        <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          
          {location && (
            <Marker position={[location.lat, location.lng]} icon={iconBlue}>
              <Popup>📌 Lokasi Anda</Popup>
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
             padding: '8px 20px', borderRadius: '30px', color: lockCheckIn ? '#EF4444' : '#059669', border: lockCheckIn ? '2px solid #FCA5A5' : '2px solid #6EE7B7', fontWeight: 900, fontSize: '13px', display:'flex', gap:'6px', alignItems:'center', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
            <MapPin size={16} /> {distanceMeters}m dari {targetData.name}
          </div>
        )}

        <button 
          style={{ position: 'absolute', bottom: '60px', right: '20px', zIndex: 1000, background: '#ffffff', width: '52px', height: '52px', borderRadius: '50%', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', opacity: isLocating ? 0.7 : 1 }}
          onClick={handleGetLocation}
          disabled={isLocating}
        >
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isLocating ? <Loader2 size={22} color="#94a3b8" className="animate-spin" /> : <Crosshair size={22} color={location ? "#F59E0B" : "#64748b"} />}
          </span>
        </button>
      </div>

      {/* FOREGROUND SLIDING PANEL */}
      <div style={{ background: '#ffffff', borderRadius: '32px 32px 0 0', marginTop: '-36px', position: 'relative', zIndex: 10, padding: '24px 24px 100px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 -10px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '40px', height: '6px', background: '#e2e8f0', borderRadius: '4px', margin: '0 auto -6px' }}></div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>Check-In Laporan</h2>

        {success && (
          <div className="success-banner" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', padding: '12px', color: '#34d399', fontWeight: '600', display: 'flex', gap: '8px', alignItems:'center' }}>
            <CheckCircle size={18} /> Tersimpan!
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>Pilih Area Referensi</label>
          <select 
            className="form-input" 
            style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }} 
            value={selectedArea || ''} 
            onChange={e => {
              if (e.target.value === 'ADD_NEW') {
                const newArea = prompt('Masukkan nama area baru:');
                if (newArea && newArea.trim() !== '') {
                  // Tambahkan ke AREA_CONFIG lokal atau biarkan input state menerima string bebas
                  setSelectedArea(newArea.trim());
                }
              } else {
                setSelectedArea(e.target.value);
              }
            }}
          >
             <option value="">-- Manual Area (Auto-Detect Biasa) --</option>
             {AREA_CONFIG.map(a => <option key={a.area} value={a.area}>{a.area} - {a.desc}</option>)}
             {selectedArea && !AREA_CONFIG.find(a => a.area === selectedArea) && (
                <option value={selectedArea}>{selectedArea}</option>
             )}
             <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#059669' }}>+ Tambah Area Baru</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', margin: 0 }}>Tujuan Kunjungan (Toko)</label>
            {targetType === 'Customer' && (
                <button onClick={() => navigate('/mobile/customer#new')} style={{ fontSize: '11px', color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #10b981', cursor: 'pointer' }}>+ Tambah Customer</button>
            )}
            {targetType === 'Prospek' && (
                <button onClick={() => navigate('/mobile/prospek#new')} style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 800, background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #3b82f6', cursor: 'pointer' }}>+ Tambah Prospek</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select className="form-input" style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }} value={targetType} onChange={e => { setTargetType(e.target.value as any); setTargetId(''); }}>
              <option value="General">Hanya Area (Kunjungan Umum)</option>
              <option value="Customer">Customer Existing</option>
              <option value="Prospek">Prospek Baru</option>
            </select>

            {targetType === 'Customer' && (
              <select className="form-input" style={{ width: '100%', border: '2px solid #10b981', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 800, color: '#059669', background: '#ecfdf5' }} value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">-- Pilih Customer --</option>
                {myCustomers.map(c => <option key={c.id} value={c.id}>{c.nama_toko}</option>)}
              </select>
            )}

            {targetType === 'Prospek' && (
              <select className="form-input" style={{ width: '100%', border: '2px solid #3b82f6', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 800, color: '#1d4ed8', background: '#eff6ff' }} value={targetId} onChange={e => setTargetId(e.target.value)}>
                <option value="">-- Pilih Prospek --</option>
                {myProspek.map(p => <option key={p.id} value={p.id}>{p.nama_toko}</option>)}
              </select>
            )}
          </div>
        </div>

        <label style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', margin: 0, padding: '16px', background: photoBase64 ? '#ecfdf5' : '#f8fafc', color: photoBase64 ? '#059669' : '#111827', border: '2px dashed #cbd5e1', borderRadius: '16px', fontWeight: 800, fontSize: '14px', transition: 'all 0.2s' }}>
          <Camera size={20} /> {photoBase64 ? 'Foto Berhasil Dilampirkan ✅' : 'Ambil Foto Bukti (Kamera)'}
          <input type="file" accept="image/*" style={{ display: 'none' }} capture="environment" onChange={handleCapturePhoto} />
        </label>

        {photoBase64 && <div style={{ padding: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}><img src={photoBase64} alt="Bukti" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px' }} /></div>}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>Catatan Kunjungan</label>
          <textarea className="form-input" style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1e293b', minHeight: '80px' }} placeholder="Tuliskan hasil..." value={catatan} onChange={e => setCatatan(e.target.value)} />
        </div>

        <button onClick={handleCheckIn} disabled={lockCheckIn} style={{ width: '100%', padding: '18px', background: lockCheckIn ? '#f1f5f9' : 'var(--brand-yellow)', color: lockCheckIn ? '#94a3b8' : '#111827', borderRadius: '20px', fontWeight: 900, fontSize: '16px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: lockCheckIn ? 'none' : '0 10px 25px rgba(245, 158, 11, 0.3)', transition: 'all 0.3s', marginTop: '10px' }}>
          {lockCheckIn ? <><AlertTriangle size={18} /> Lokasi Terlalu Jauh (&gt;100m)</> : <><MapPin size={20} /> Simpan Laporan Check-In</>}
        </button>
      </div>
    </div>
  );
}
