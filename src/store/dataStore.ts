import { supabase } from '../lib/supabase';
import type { Sales, Prospek, Customer, Activity, Area } from '../types';

export const store = {
  // ─── PROSPEK ────────────────────────────────────────────
  async addProspek(p: Omit<Prospek, 'id' | 'created_at'>) {
    // Only send basic columns confirmed by seed
    const prospekData = {
      id: crypto.randomUUID(),
      nama_toko: p.nama_toko,
      nama_pic: p.nama_pic,
      no_wa: p.no_wa,
      area: p.area,
      status: p.status,
      sales_owner: p.sales_owner,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('prospek').insert([prospekData]);
    if (error) console.error('addProspek error:', error);
    return { data: prospekData as Prospek, error };
  },

  async updateProspek(id: string, updates: Partial<Prospek>) {
    const { data, error } = await supabase.from('prospek').update(updates).eq('id', id);
    if (error) console.error('updateProspek error:', error);
    return { data, error };
  },

  async deleteProspek(id: string) {
    const { error } = await supabase.from('prospek').delete().eq('id', id);
    if (error) console.error('deleteProspek error:', error);
    return { error };
  },

  // ─── CUSTOMER ───────────────────────────────────────────
  async addCustomer(c: any) {
    // Completely minimalist based on errors and seed
    const customerData = {
      id: crypto.randomUUID(),
      nama_toko: c.nama_toko,
      nama_pic: c.nama_pic || 'Bpk/Ibu',
      no_wa: c.no_wa,
      area: c.area,
      sales_pic: c.sales_pic,
      total_order_volume: c.total_order_volume || 0,
      last_order_date: c.last_order_date || new Date().toISOString(),
      tanggal_join: new Date().toISOString(),
      is_from_prospek: false
    };
    const { error } = await supabase.from('customer').insert([customerData]);
    if (error) console.error('addCustomer error:', error);
    return { data: customerData as Customer, error };
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
    const { data, error } = await supabase.from('customer').update(updates).eq('id', id);
    if (error) console.error('updateCustomer error:', error);
    return { data, error };
  },

  // ─── CONVERT PROSPEK → CUSTOMER ─────────────────────────
  async convertToCustomer(prospek: Prospek, orderVolume: number) {
    const newId = crypto.randomUUID();
    const customerData = {
      id: newId,
      nama_toko: prospek.nama_toko,
      nama_pic: prospek.nama_pic,
      no_wa: prospek.no_wa,
      area: prospek.area,
      total_order_volume: orderVolume || 0,
      sales_pic: prospek.sales_owner,
      last_order_date: new Date().toISOString(),
      tanggal_join: new Date().toISOString(),
      is_from_prospek: true
    };
    
    // 1. Insert Customer
    const { error: errC } = await supabase.from('customer').insert([customerData]);
    if (errC) {
      console.error('convertToCustomer error:', errC);
      return { data: null, error: errC };
    }

    // 2. Delete Prospek
    await this.deleteProspek(prospek.id);

    // 3. Log Activity
    await this.logActivity({
      id_sales: prospek.sales_owner,
      target_id: newId,
      target_type: 'customer',
      target_nama: prospek.nama_toko,
      tipe_aksi: 'Visit',
      catatan_hasil: `CLOSING! Data dipindahkan ke Customer.`,
    });

    return { data: customerData as Customer, error: null };
  },

  // ─── ACTIVITY ───────────────────────────────────────────
  async logActivity(a: Omit<Activity, 'id' | 'timestamp'>) {
    const activityData = {
      id: crypto.randomUUID(),
      id_sales: a.id_sales,
      target_id: a.target_id,
      target_type: a.target_type,
      target_nama: a.target_nama,
      tipe_aksi: a.tipe_aksi,
      catatan_hasil: a.catatan_hasil,
      timestamp: new Date().toISOString()
    };
    const { error } = await supabase.from('activity').insert([activityData]);
    if (error) console.error('logActivity error:', error);
    return { data: activityData as Activity, error };
  },

  async logWA(salesId: string, targetId: string, targetType: 'prospek' | 'customer', targetNama: string, noWA: string, catatan = '') {
    await this.logActivity({
      id_sales: salesId,
      target_id: targetId,
      target_type: targetType,
      target_nama: targetNama,
      tipe_aksi: 'WA',
      catatan_hasil: catatan || 'Followup via WhatsApp.'
    });
    const msg = encodeURIComponent(`Halo ${targetNama}, kami dari Sales Daging—ada yang bisa dibantu?`);
    window.open(`https://wa.me/${noWA}?text=${msg}`, '_blank');
  },

  async logCall(salesId: string, targetId: string, targetType: 'prospek' | 'customer', targetNama: string, noTelp: string, catatan = '') {
    await this.logActivity({
      id_sales: salesId,
      target_id: targetId,
      target_type: targetType,
      target_nama: targetNama,
      tipe_aksi: 'Call',
      catatan_hasil: catatan || 'Followup via telepon.'
    });
    window.open(`tel:${noTelp}`, '_self');
  },

  async logOrder(salesId: string, targetId: string, targetNama: string, volume: number) {
    await this.logActivity({
      id_sales: salesId,
      target_id: targetId,
      target_type: 'customer',
      target_nama: targetNama,
      tipe_aksi: 'Order',
      catatan_hasil: `SALES ORDER: ${volume}kg.`
    });
    // In a real app, this might also update customer.total_order_volume or create a record in an 'orders' table.
    // For this mock, we just log the activity as requested.
  },

  async logVisit(salesId: string, area: Area, catatan: string) {
    await this.logActivity({
      id_sales: salesId,
      target_id: salesId, // self target for general check-in if needed
      target_type: 'customer',
      target_nama: `Check-in ${area}`,
      tipe_aksi: 'Visit',
      catatan_hasil: catatan,
      geotagging: { area },
    });
  },

  async logNote(salesId: string, targetId: string, targetType: 'prospek' | 'customer', targetNama: string, catatan: string) {
    await this.logActivity({
      id_sales: salesId,
      target_id: targetId,
      target_type: targetType,
      target_nama: targetNama,
      tipe_aksi: 'Note',
      catatan_hasil: catatan
    });
  },



  // ─── SALES CRUD ─────────────────────────────────────────
  async addSales(sales: Sales) {
    const { data, error } = await supabase.from('sales').insert([sales]);
    if (error) console.error('addSales error:', error);
    return { data, error };
  },
  async updateSales(id: string, updates: Partial<Sales>) {
    const { data, error } = await supabase.from('sales').update(updates).eq('id', id).select();
    if (error) console.error('updateSales error:', error);
    return { data, error };
  },
  async deleteSales(id: string) {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) console.error('deleteSales error:', error);
    return { error };
  },

  // ─── ROLES ──────────────────────────────────────────────
  async fetchRoles() {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) console.error('fetchRoles error:', error);
    return data || [];
  },
  async addRole(roleData: { role: string; akses: string }) {
    const { data, error } = await supabase.from('roles').insert([roleData]);
    if (error) console.error('addRole error:', error);
    return data;
  },
  async updateRole(id: string, roleData: { role: string; akses: string }) {
    const { error } = await supabase.from('roles').update(roleData).eq('id', id);
    if (error) console.error('updateRole error:', error);
  },
  async deleteRole(id: string) {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) console.error('deleteRole error:', error);
  },

  // ─── SYSTEM TARGETS ─────────────────────────────────────
  async fetchSystemTargets() {
    const { data, error } = await supabase.from('system_targets').select('*').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') console.error('fetchSystemTargets error:', error);
    return data;
  },
  async updateSystemTargets(targetsData: any) {
    // Upsert pattern on ID=1
    const { error } = await supabase.from('system_targets').upsert({ id: 1, ...targetsData });
    if (error) console.error('updateSystemTargets error:', error);
  },
};

