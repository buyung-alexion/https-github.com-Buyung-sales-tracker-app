export type Area = string; // Changed to string for dynamic inputs
export type StatusProspek = 'Cold' | 'Warm' | 'Hot';
export type TipeAksi = 'WA' | 'Visit' | 'Call';
export type Armada = 'A' | 'B' | 'C';

export interface Prospek {
  id: string;
  nama_toko: string;
  nama_pic: string;
  no_wa: string;
  area: Area;
  status: StatusProspek;
  sales_owner: string; // ID sales
  foto_lokasi?: string;
  link_map?: string;
  kategori?: string;
  rating?: number;
  foto_profil?: string;
  created_at: string; // ISO string
}

export interface Customer {
  id: string;
  nama_toko: string;
  nama_pic?: string;
  no_wa: string;
  area: Area;
  tanggal_join?: string; // ISO string
  total_order_volume: number; // kg
  last_order_date: string; // ISO string
  sales_pic: string; // ID sales
  link_map?: string;
  status?: string;
  created_at?: string;
  created_by?: string;
  kategori?: string;
  rating?: number;
  foto_profil?: string;
}

export interface Activity {
  id: string;
  timestamp: string; // ISO string
  id_sales: string;
  target_id: string;
  target_type: 'prospek' | 'customer' | 'area';
  target_nama: string; // denormalized for display
  tipe_aksi: TipeAksi;
  catatan_hasil: string;
  geotagging?: { area: Area; lat?: number; lng?: number; photo?: string };
}

export interface PlanBesok {
  id: string;
  sales_id: string;
  target_id: string;
  target_type: 'prospek' | 'customer';
  target_nama: string;
  tanggal_rencana: string; // YYYY-MM-DD
  tipe_aksi: TipeAksi;
  status: 'Belum Dikunjungi' | 'Selesai' | 'Batal';
  catatan?: string;
  created_at: string;
}

export interface Sales {
  id: string;
  nama: string;
  no_wa?: string;
  armada: Armada;
  target_prospek_baru: number;
  target_closing_baru: number;
  target_maintenance: number; // visits/month
  target_visit: number; // total visits targets
}

export interface ChatMessage {
  id: string; // uuid
  chat_id: string; // Target room id (e.g. 'g1', 'u1')
  sender_id: string; // 'sys', 'Manager', or Sales ID
  sender_name: string; // Name representation
  text: string;
  timestamp: string; // ISO string
  status: 'sent' | 'delivered' | 'read';
}

