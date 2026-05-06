import { useMemo, useState, useRef, useEffect } from 'react';
import { useSalesData } from '../../hooks/useSalesData';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Loader2, Crosshair, X, Truck, Wrench, FileText } from 'lucide-react';
import { store } from '../../store/dataStore';

interface Props { salesId: string; onSuccess?: () => void; }

const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color:${color};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px ${color}"></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10]
});
const iconBlue = createIcon('#3b82f6');

export default function WorkerActivityReport({ salesId, onSuccess }: Props) {
  const { customers, masterAreas, sales = [], refresh } = useSalesData();
  const currentSales = sales.find(s => s.id === salesId);
  const salesName = currentSales?.nama;
  const userRole = currentSales?.role || 'Helper';

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>({ lat: -1.265, lng: 116.83 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipeAksi, setTipeAksi] = useState<string>(userRole?.toLowerCase() === 'produksi' ? 'Production' : 'Delivery');

  const mapRef = useRef<L.Map | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    if (!targetId) return null;
    return customers.find(c => c.id === targetId);
  }, [targetId, customers]);

  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (mapRef.current) {
          mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
        }
      },
      (err) => { console.error('Location failed', err); },
      { enableHighAccuracy: true }
    );
  };

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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!selectedArea) return alert('Pilih area!');
    if (tipeAksi === 'Delivery' && !targetId) return alert('Pilih toko/customer!');
    if (!photoBase64 || !location) return alert('Foto & Lokasi diperlukan!');

    setIsSubmitting(true);
    setSaveError(null);
    try {
      const targetName = tipeAksi === 'Delivery' ? (selectedCustomer?.nama_toko || 'Toko') : 'Aktivitas Umum';
      
      const { error } = await store.logActivity({
        id_sales: salesId,
        target_id: tipeAksi === 'Delivery' ? targetId : salesId,
        target_type: tipeAksi === 'Delivery' ? 'customer' : 'area',
        target_nama: targetName,
        tipe_aksi: tipeAksi as any,
        sales_name: salesName,
        catatan_hasil: catatan || `${tipeAksi} di ${targetName}`,
        geotagging: { area: selectedArea, lat: location.lat, lng: location.lng, photo: photoBase64 }
      });

      if (error) throw error;

      setSuccess(true);
      await refresh();
      setTimeout(() => {
        setSuccess(false); setCatatan(''); setPhotoBase64(null); setTargetId(''); setSearchQuery('');
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setSaveError('Gagal menyimpan laporan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Map Preview */}
      <div style={{ height: '25vh', width: '100%', position: 'relative' }}>
        <MapContainer center={[location?.lat || -1.265, location?.lng || 116.83]} zoom={15} style={{ height: '100%' }} zoomControl={false} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {location && <Marker position={[location.lat, location.lng]} icon={iconBlue} />}
        </MapContainer>
        <button 
          onClick={handleGetLocation}
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, background: '#fff', border: 'none', borderRadius: '12px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <Crosshair size={20} color="#3b82f6" />
        </button>
      </div>

      {/* Form Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {success && <div style={{ padding: '16px', background: '#ecfdf5', color: '#059669', borderRadius: '16px', fontWeight: 800, textAlign: 'center' }}>Laporan Berhasil Terkirim!</div>}
        {saveError && <div style={{ padding: '16px', background: '#fef2f2', color: '#ef4444', borderRadius: '16px', fontWeight: 800, textAlign: 'center' }}>{saveError}</div>}

        {/* Tipe Aktivitas */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Jenis Aktivitas</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {userRole?.toLowerCase() === 'produksi' ? (
              [
                { id: 'Production', label: 'Produksi', icon: Wrench, color: '#10b981' },
                { id: 'Note', label: 'Lainnya', icon: FileText, color: '#64748b' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => { setTipeAksi(type.id); setTargetId(''); setSearchQuery(''); }}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: '16px', border: tipeAksi === type.id ? `2px solid ${type.color}` : '1.5px solid #f1f5f9',
                    background: tipeAksi === type.id ? `${type.color}10` : '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                >
                  <type.icon size={20} color={tipeAksi === type.id ? type.color : '#94a3b8'} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: tipeAksi === type.id ? type.color : '#64748b' }}>{type.label}</span>
                </button>
              ))
            ) : (
              [
                { id: 'Delivery', label: 'Antar', icon: Truck, color: '#3b82f6' },
                { id: 'Maintenance', label: 'BBM/Servis', icon: Wrench, color: '#f59e0b' },
                { id: 'Note', label: 'Lainnya', icon: FileText, color: '#64748b' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => { setTipeAksi(type.id); setTargetId(''); setSearchQuery(''); }}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: '16px', border: tipeAksi === type.id ? `2px solid ${type.color}` : '1.5px solid #f1f5f9',
                    background: tipeAksi === type.id ? `${type.color}10` : '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                >
                  <type.icon size={20} color={tipeAksi === type.id ? type.color : '#94a3b8'} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: tipeAksi === type.id ? type.color : '#64748b' }}>{type.label}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px' }}>AREA</label>
            <select 
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, background: '#f8fafc' }}
              value={selectedArea || ''}
              onChange={e => setSelectedArea(e.target.value)}
            >
              <option value="">-- Pilih Area --</option>
              {masterAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {tipeAksi === 'Delivery' && (
            <div className="animate-fade-up">
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px' }}>TUJUAN TOKO / CUSTOMER</label>
              <input
                type="text"
                placeholder="Cari nama toko..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setTargetId(''); }}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 600 }}
              />
              {!targetId && searchQuery.length > 1 && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '4px', background: '#fff' }}>
                  {customers.filter(c => c.nama_toko.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                    <div key={c.id} onClick={() => { setTargetId(c.id); setSearchQuery(c.nama_toko); }} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: 700 }}>{c.nama_toko}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evidence */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
           <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Bukti Foto</label>
           {!photoBase64 ? (
             <button 
               onClick={() => cameraInputRef.current?.click()}
               style={{ width: '100%', height: '120px', borderRadius: '16px', border: '2px dashed #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}
             >
               <Camera size={32} />
               <span style={{ fontSize: '14px', fontWeight: 800 }}>Ambil Foto Kejadian</span>
             </button>
           ) : (
             <div style={{ position: 'relative' }}>
                <img src={photoBase64} style={{ width: '100%', borderRadius: '16px', height: '200px', objectFit: 'cover' }} />
                <button onClick={() => setPhotoBase64(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color="#ef4444" /></button>
             </div>
           )}
           <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* Notes */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
           <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Catatan</label>
           <textarea
             style={{ width: '100%', minHeight: '100px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: 'none', fontSize: '15px', fontWeight: 600, outline: 'none' }}
             placeholder="Tulis detail aktivitas..."
             value={catatan}
             onChange={e => setCatatan(e.target.value)}
           />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ width: '100%', height: '56px', background: '#1e293b', color: '#fff', borderRadius: '16px', fontWeight: 950, border: 'none', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Kirim Laporan'}
        </button>
      </div>
    </div>
  );
}
