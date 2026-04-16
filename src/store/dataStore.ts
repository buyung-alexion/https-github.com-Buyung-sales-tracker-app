import { supabase } from '../lib/supabase';
import type { Sales, Prospek, Customer, Activity, Area } from '../types';

// Internal helper for Area-based ID generation (e.g., BPN001) is removed 
// because Supabase expects UUIDs for 'id' primary keys, not strings like "BPN001".
// We will use crypto.randomUUID() instead.

export const store = {
  // ─── PROSPEK ────────────────────────────────────────────
  async addProspek(p: Omit<Prospek, 'id' | 'created_at'>) {
    const prospekData = {
      id: crypto.randomUUID(),
      nama_toko: p.nama_toko,
      nama_pic: p.nama_pic || 'Bpk/Ibu',
      no_wa: p.no_wa,
      area: p.area,
      status: p.status,
      sales_owner: p.sales_owner,
      channel: p.channel,
      link_map: p.link_map,
      kategori: p.kategori,
      rating: p.rating,
      foto_profil: p.foto_profil,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('prospek').insert([prospekData]);
    if (error) console.error('addProspek error:', error);
    return { data: prospekData as Prospek, error };
  },

  async updateProspek(id: string, updates: Partial<Prospek>) {
    const allowedUpdates: any = {};
    const keys = ['nama_toko', 'nama_pic', 'no_wa', 'area', 'status', 'sales_owner', 'link_map', 'kategori', 'rating', 'foto_profil', 'channel'];
    keys.forEach(k => {
      if ((updates as any)[k] !== undefined) allowedUpdates[k] = (updates as any)[k];
    });
    const { data, error } = await supabase.from('prospek').update(allowedUpdates).eq('id', id);
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
      link_map: c.link_map,
      kategori: c.kategori,
      rating: c.rating,
      foto_profil: c.foto_profil,
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
    const customerData = {
      id: crypto.randomUUID(),
      nama_toko: prospek.nama_toko,
      nama_pic: prospek.nama_pic,
      no_wa: prospek.no_wa,
      area: prospek.area,
      total_order_volume: orderVolume || 0,
      sales_pic: prospek.sales_owner,
      last_order_date: new Date().toISOString(),
      tanggal_join: new Date().toISOString(),
      link_map: prospek.link_map,
      kategori: prospek.kategori,
      rating: prospek.rating,
      foto_profil: prospek.foto_profil,
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
      target_id: customerData.id,
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
      geotagging: (a as any).geotagging,
      sales_volume: (a as any).sales_volume || 0,
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
      target_type: 'area', // changed from customer to area for clarity
      target_nama: `Antivitas Area ${area}`,
      tipe_aksi: 'Visit',
      catatan_hasil: catatan,
      geotagging: { area },
    });
  },

  // ─── ATTENDANCE (CLOCK IN/OUT) ──────────────────────────
  async getTodayAttendance(salesId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('sales_id', salesId)
      .gte('check_in', `${today}T00:00:00Z`)
      .lte('check_in', `${today}T23:59:59Z`)
      .maybeSingle();
    return { data, error };
  },
  async fetchRecentAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .gte('check_in', `${today}T00:00:00Z`)
      .order('check_in', { ascending: false });
    return { data, error };
  },

  async clockIn(salesId: string, loc: { lat: number, lng: number, area: string }, photo: string) {
    const attendanceData = {
      id: crypto.randomUUID(),
      sales_id: salesId,
      check_in: new Date().toISOString(),
      loc_in: loc,
      photo_in: photo,
      status: 'active'
    };
    const { error } = await supabase.from('attendance').insert([attendanceData]);
    return { error };
  },

  async clockOut(id: string, loc: { lat: number, lng: number, area: string }, photo: string) {
    const { error } = await supabase.from('attendance').update({
      check_out: new Date().toISOString(),
      loc_out: loc,
      photo_out: photo,
      status: 'completed'
    }).eq('id', id);
    return { error };
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
  async generateNextSalesId() {
    const { data } = await supabase.from('sales').select('id');
    const existingIds = (data || [])
      .map(s => s.id)
      .filter(id => id.startsWith('S'))
      .map(id => parseInt(id.substring(1)))
      .sort((a, b) => b - a);
    
    const nextNum = existingIds.length > 0 ? existingIds[0] + 1 : 1;
    return `S${nextNum.toString().padStart(3, '0')}`;
  },

  async addSales(salesData: Partial<Sales>) {
    let finalId = (salesData as any).id;
    if (!finalId) {
      finalId = await this.generateNextSalesId();
    }
    
    const { data, error } = await supabase.from('sales').insert([{ ...salesData, id: finalId }]).select();
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

  // ─── MASTER DATA ────────────────────────────────────────
  async fetchMasterAreas() {
    const { data, error } = await supabase.from('master_areas').select('*').order('name');
    if (error) console.error('fetchMasterAreas error:', error);
    return data || [];
  },
  async addMasterArea(name: string, customId?: string) {
    let id = customId?.trim();
    if (!id) {
      const words = name.trim().split(/\s+/);
      if (words.length > 1) {
        id = words.map(w => w[0].toUpperCase()).join('');
      } else {
        id = name.length > 3 ? name.substring(0, 3).toUpperCase() : name.toUpperCase();
      }
      id = id.replace(/[^A-Z0-9]/g, '');
    }

    const { data, error } = await supabase.from('master_areas').insert([{ id, name }]).select();
    if (error) console.error('addMasterArea error:', error);
    return { data, error };
  },
  async updateMasterArea(id: string, updates: { id?: string; name?: string }) {
    const { data, error } = await supabase.from('master_areas').update(updates).eq('id', id).select();
    if (error) console.error('updateMasterArea error:', error);
    return { data, error };
  },
  async deleteMasterArea(id: string) {
    const { error } = await supabase.from('master_areas').delete().eq('id', id);
    if (error) console.error('deleteMasterArea error:', error);
    return { error };
  },

  async fetchMasterCategories() {
    const { data, error } = await supabase.from('master_categories').select('*').order('name');
    if (error) console.error('fetchMasterCategories error:', error);
    return data || [];
  },
  async addMasterCategory(name: string, customId?: string) {
    const id = customId?.trim() || crypto.randomUUID();
    const { data, error } = await supabase.from('master_categories').insert([{ id, name }]).select();
    if (error) console.error('addMasterCategory error:', error);
    return { data, error };
  },
  async updateMasterCategory(id: string, updates: { id?: string; name?: string }) {
    const { data, error } = await supabase.from('master_categories').update(updates).eq('id', id).select();
    if (error) console.error('updateMasterCategory error:', error);
    return { data, error };
  },
  async deleteMasterCategory(id: string) {
    const { error } = await supabase.from('master_categories').delete().eq('id', id);
    if (error) console.error('deleteMasterCategory error:', error);
    return { error };
  },

  async fetchMasterChannels() {
    const { data, error } = await supabase.from('master_channels').select('*').order('name');
    if (error) console.error('fetchMasterChannels error:', error);
    return data || [];
  },
  async addMasterChannel(name: string, customId?: string) {
    const id = customId?.trim() || crypto.randomUUID();
    const { data, error } = await supabase.from('master_channels').insert([{ id, name }]).select();
    if (error) console.error('addMasterChannel error:', error);
    return { data, error };
  },
  async updateMasterChannel(id: string, updates: { id?: string; name?: string }) {
    const { data, error } = await supabase.from('master_channels').update(updates).eq('id', id).select();
    if (error) console.error('updateMasterChannel error:', error);
    return { data, error };
  },
  async deleteMasterChannel(id: string) {
    const { error } = await supabase.from('master_channels').delete().eq('id', id);
    if (error) console.error('deleteMasterChannel error:', error);
    return { error };
  },

  // --- NEW MASTER STATUS & ACTIONS ---
  async fetchMasterProspectStatus() {
    const { data, error } = await supabase.from('master_prospect_status').select('*').order('name');
    if (error) console.error('fetchMasterProspectStatus error:', error);
    return data || [];
  },
  async addMasterProspectStatus(name: string, customId?: string) {
    const id = customId?.trim() || crypto.randomUUID();
    const { data, error } = await supabase.from('master_prospect_status').insert([{ id, name }]).select();
    if (error) console.error('addMasterProspectStatus error:', error);
    return { data, error };
  },
  async updateMasterProspectStatus(id: string, updates: { id?: string; name?: string }) {
    const { data, error } = await supabase.from('master_prospect_status').update(updates).eq('id', id).select();
    if (error) console.error('updateMasterProspectStatus error:', error);
    return { data, error };
  },
  async deleteMasterProspectStatus(id: string) {
    const { error } = await supabase.from('master_prospect_status').delete().eq('id', id);
    if (error) console.error('deleteMasterProspectStatus error:', error);
    return { error };
  },

  async fetchMasterActions() {
    const { data, error } = await supabase.from('master_actions').select('*').order('name');
    if (error) console.error('fetchMasterActions error:', error);
    return data || [];
  },
  async addMasterAction(name: string, customId?: string) {
    const id = customId?.trim() || crypto.randomUUID();
    const { data, error } = await supabase.from('master_actions').insert([{ id, name }]).select();
    if (error) console.error('addMasterAction error:', error);
    return { data, error };
  },
  async updateMasterAction(id: string, updates: { id?: string; name?: string }) {
    const { data, error } = await supabase.from('master_actions').update(updates).eq('id', id).select();
    if (error) console.error('updateMasterAction error:', error);
    return { data, error };
  },
  async deleteMasterAction(id: string) {
    const { error } = await supabase.from('master_actions').delete().eq('id', id);
    if (error) console.error('deleteMasterAction error:', error);
    return { error };
  },
};
