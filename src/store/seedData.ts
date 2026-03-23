import type { Sales, Prospek, Customer, Activity } from '../types';


export const SEED_SALES: Sales[] = [
  { id: 's1', nama: 'Erlan', armada: 'A', target_prospek_baru: 20, target_closing_baru: 5, target_maintenance: 30, target_visit: 150 },
  { id: 's2', nama: 'Nanda', armada: 'B', target_prospek_baru: 20, target_closing_baru: 5, target_maintenance: 30, target_visit: 150 },
  { id: 's3', nama: 'Pepin', armada: 'C', target_prospek_baru: 20, target_closing_baru: 5, target_maintenance: 30, target_visit: 150 },
];

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const SEED_PROSPEK: Prospek[] = [
  { id: 'p1', nama_toko: 'Warung Pak Budi', nama_pic: 'Pak Budi', no_wa: '6281234567890', area: 'Sepaku', status: 'Hot', sales_owner: 's1', created_at: daysAgo(10) },
  { id: 'p2', nama_toko: 'RM Sinar Jaya', nama_pic: 'Bu Sari', no_wa: '6281234567891', area: 'Kota', status: 'Warm', sales_owner: 's1', created_at: daysAgo(8) },
  { id: 'p3', nama_toko: 'Depot Maju Makmur', nama_pic: 'Pak Hendra', no_wa: '6281234567892', area: 'Gerogot', status: 'Cold', sales_owner: 's1', created_at: daysAgo(15) },
  { id: 'p4', nama_toko: 'Warung Bu Rina', nama_pic: 'Bu Rina', no_wa: '6281234567893', area: 'Kota', status: 'Hot', sales_owner: 's2', created_at: daysAgo(5) },
  { id: 'p5', nama_toko: 'Kantin Sukses', nama_pic: 'Pak Doni', no_wa: '6281234567894', area: 'Sepaku', status: 'Warm', sales_owner: 's2', created_at: daysAgo(12) },
  { id: 'p6', nama_toko: 'RM Barokah', nama_pic: 'Bu Fitri', no_wa: '6281234567895', area: 'Gerogot', status: 'Cold', sales_owner: 's3', created_at: daysAgo(20) },
  { id: 'p7', nama_toko: 'Depot Sahabat', nama_pic: 'Pak Agus', no_wa: '6281234567896', area: 'Kota', status: 'Warm', sales_owner: 's3', created_at: daysAgo(7) },
  { id: 'p8', nama_toko: 'Warung Berkah', nama_pic: 'Bu Tini', no_wa: '6281234567897', area: 'Sepaku', status: 'Hot', sales_owner: 's1', created_at: daysAgo(3) },
  { id: 'p9', nama_toko: 'Kantin Jaya', nama_pic: 'Pak Rudi', no_wa: '6281234567898', area: 'Kota', status: 'Cold', sales_owner: 's2', created_at: daysAgo(18) },
  { id: 'p10', nama_toko: 'RM Sejahtera', nama_pic: 'Bu Endah', no_wa: '6281234567899', area: 'Gerogot', status: 'Warm', sales_owner: 's3', created_at: daysAgo(9) },
];

export const SEED_CUSTOMER: Customer[] = [
  { id: 'c1', nama_toko: 'Restoran Padang Indah', no_wa: '6282234567890', area: 'Kota', tanggal_join: daysAgo(90), total_order_volume: 340, last_order_date: daysAgo(3), sales_pic: 's1' },
  { id: 'c2', nama_toko: 'Warung Nasi Mbok Darmi', no_wa: '6282234567891', area: 'Sepaku', tanggal_join: daysAgo(120), total_order_volume: 210, last_order_date: daysAgo(16), sales_pic: 's1' },
  { id: 'c3', nama_toko: 'Depot Bu Lastri', no_wa: '6282234567892', area: 'Gerogot', tanggal_join: daysAgo(60), total_order_volume: 145, last_order_date: daysAgo(7), sales_pic: 's2' },
  { id: 'c4', nama_toko: 'RM Soto Lamongan', no_wa: '6282234567893', area: 'Kota', tanggal_join: daysAgo(200), total_order_volume: 560, last_order_date: daysAgo(20), sales_pic: 's2' },
  { id: 'c5', nama_toko: 'Kantin RSUD Sepaku', no_wa: '6282234567894', area: 'Sepaku', tanggal_join: daysAgo(45), total_order_volume: 95, last_order_date: daysAgo(5), sales_pic: 's3' },
  { id: 'c6', nama_toko: 'Warung Bu Sarti', no_wa: '6282234567895', area: 'Kota', tanggal_join: daysAgo(180), total_order_volume: 420, last_order_date: daysAgo(18), sales_pic: 's3' },
  { id: 'c7', nama_toko: 'RM Bebek Goreng Pak Iman', no_wa: '6282234567896', area: 'Gerogot', tanggal_join: daysAgo(75), total_order_volume: 280, last_order_date: daysAgo(2), sales_pic: 's1' },
  { id: 'c8', nama_toko: 'Kantin SMA Gerogot', no_wa: '6282234567897', area: 'Gerogot', tanggal_join: daysAgo(30), total_order_volume: 75, last_order_date: daysAgo(25), sales_pic: 's2' },
];

export const SEED_ACTIVITY: Activity[] = [
  { id: 'a1', timestamp: daysAgo(2), id_sales: 's1', target_id: 'p1', target_type: 'prospek', target_nama: 'Warung Pak Budi', tipe_aksi: 'WA', catatan_hasil: 'Sudah dibalas, tertarik coba order.' },
  { id: 'a2', timestamp: daysAgo(2), id_sales: 's1', target_id: 'c1', target_type: 'customer', target_nama: 'Restoran Padang Indah', tipe_aksi: 'Visit', catatan_hasil: 'Konfirmasi order minggu depan.', geotagging: { area: 'Kota' } },
  { id: 'a3', timestamp: daysAgo(3), id_sales: 's2', target_id: 'p4', target_type: 'prospek', target_nama: 'Warung Bu Rina', tipe_aksi: 'WA', catatan_hasil: 'Minta sampel dulu.' },
  { id: 'a4', timestamp: daysAgo(1), id_sales: 's3', target_id: 'c5', target_type: 'customer', target_nama: 'Kantin RSUD Sepaku', tipe_aksi: 'Call', catatan_hasil: 'Tanya kebutuhan bulan ini.' },
  { id: 'a5', timestamp: daysAgo(4), id_sales: 's2', target_id: 'c3', target_type: 'customer', target_nama: 'Depot Bu Lastri', tipe_aksi: 'Visit', catatan_hasil: 'Ambil order 30kg.', geotagging: { area: 'Gerogot' } },
  { id: 'a6', timestamp: daysAgo(1), id_sales: 's1', target_id: 'p8', target_type: 'prospek', target_nama: 'Warung Berkah', tipe_aksi: 'WA', catatan_hasil: 'Kirim brosur harga.' },
  { id: 'a7', timestamp: daysAgo(5), id_sales: 's3', target_id: 'p7', target_type: 'prospek', target_nama: 'Depot Sahabat', tipe_aksi: 'Visit', catatan_hasil: 'Survey lokasi.', geotagging: { area: 'Kota' } },
  { id: 'a8', timestamp: daysAgo(3), id_sales: 's2', target_id: 'c8', target_type: 'customer', target_nama: 'Kantin SMA Gerogot', tipe_aksi: 'WA', catatan_hasil: 'Tidak ada respons.' },
];
