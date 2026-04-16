export type Area = string; // Stores AreaId (e.g., 'A001')
export type StatusProspek = 'Cold' | 'Warm' | 'Hot';
export type TipeAksi = 'WA' | 'Visit' | 'Call' | 'Order' | 'Note';

export interface Prospek {
  id: string;
  nama_toko: string;
  nama_pic: string;
  no_wa: string;
  area: Area;
  status: StatusProspek;
  sales_owner: string; // ID sales
  channel?: string; // Lead source (e.g. Reference, Canvasing)
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
  is_from_prospek?: boolean;
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

export interface Sales {
  id: string;
  nama: string;
  no_wa?: string;
  target_maintenance?: number; // kept as optional just in case, but unused
  username?: string;
  password?: string;
  role?: string;
  foto_profil?: string; // uploaded profile photo URL
}

export interface RoleDef {
  id: string;
  role: string;
  akses: string; // Comma separated accesses
}

export interface SystemTargets {
  id: number;
  global_omset?: string;
  ind_omset?: string;
  global_prospek?: number;
  global_closing?: number;
  ind_poin: number;
  b_visit: number;
  b_prospek: number;
  b_closing: number;
  b_maint: number;
  b_order: number;
  b_chat: number;
}

export interface ChatMessage {
  id: string; // uuid
  chat_id: string; // Target room id (e.g. 'g1', 'u1')
  sender_id: string; // 'sys', 'Manager', or Sales ID
  sender_name: string; // Name representation
  text: string;
  attachment?: string; // Base64 image URL
  timestamp: string; // ISO string
  status: 'sent' | 'delivered' | 'read';
}

export type ChatContact = {
  id: string;
  name: string;
  type: 'group' | 'direct';
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
};

