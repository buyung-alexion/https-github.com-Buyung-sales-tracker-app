import { supabase } from '../lib/supabase';
import type { Sales, Prospek, Customer, Activity, Area, SalesOrder, Product, LeadNegotiation } from '../types';

// Sequential ID generation for Prospects and Customers
// Prefixes: P for Prospect, C for Customer, S for Sales

export const store = {
  // ─── PROSPEK ────────────────────────────────────────────
  async addProspek(p: Omit<Prospek, 'id' | 'created_at'>, salesName?: string) {
    const nextId = await this.generateNextProspekId();
    const prospekData = {
      id: nextId,
      nama_toko: p.nama_toko,
      nama_pic: p.nama_pic || 'Bpk/Ibu',
      no_wa: p.no_wa,
      area: p.area,
      status: p.status,
      sales_owner: p.sales_owner,
      sales_name: salesName,
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
  async addCustomer(c: any, salesName?: string) {
    const nextId = await this.generateNextCustomerId();
    const customerData = {
      id: nextId,
      nama_toko: c.nama_toko,
      nama_pic: c.nama_pic || 'Bpk/Ibu',
      no_wa: c.no_wa,
      area: c.area,
      sales_pic: c.sales_pic,
      sales_name: salesName,
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
  async convertToCustomer(prospek: Prospek, salesName?: string) {
    const nextId = await this.generateNextCustomerId();
    const customerData = {
      id: nextId,
      nama_toko: prospek.nama_toko,
      nama_pic: prospek.nama_pic,
      no_wa: prospek.no_wa,
      area: prospek.area,
      sales_pic: prospek.sales_owner,
      sales_name: prospek.sales_name,
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
      sales_name: salesName || prospek.sales_name,
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
      id: crypto.randomUUID(), // Keeping UUID for activities for now as they are internal logs
      id_sales: a.id_sales,
      sales_name: a.sales_name,
      target_id: a.target_id,
      target_type: a.target_type,
      target_nama: a.target_nama,
      tipe_aksi: a.tipe_aksi,
      catatan_hasil: a.catatan_hasil,
      geotagging: (a as any).geotagging,
      timestamp: new Date().toISOString()
    };
    const { error } = await supabase.from('activity').insert([activityData]);
    if (error) console.error('logActivity error:', error);
    return { data: activityData as Activity, error };
  },

  async logWA(salesId: string, targetId: string, targetType: 'prospek' | 'customer', targetNama: string, noWA: string, catatan = '', salesName?: string) {
    await this.logActivity({
      id_sales: salesId,
      sales_name: salesName,
      target_id: targetId,
      target_type: targetType,
      target_nama: targetNama,
      tipe_aksi: 'WA',
      catatan_hasil: catatan || 'Followup via WhatsApp.'
    });
    const msg = encodeURIComponent(`Halo ${targetNama}, kami dari Sales Daging—ada yang bisa dibantu?`);
    window.open(`https://wa.me/${noWA}?text=${msg}`, '_blank');
  },

  async logCall(salesId: string, targetId: string, targetType: 'prospek' | 'customer', targetNama: string, noTelp: string, catatan = '', salesName?: string) {
    await this.logActivity({
      id_sales: salesId,
      sales_name: salesName,
      target_id: targetId,
      target_type: targetType,
      target_nama: targetNama,
      tipe_aksi: 'Call',
      catatan_hasil: catatan || 'Followup via telepon.'
    });
    window.open(`tel:${noTelp}`, '_self');
  },

  async logOrder(salesId: string, targetId: string, targetNama: string, amount: number, salesName?: string, customDate?: string) {
    const orderDate = customDate || new Date().toISOString();

    // 1. Log Activity
    await this.logActivity({
      id_sales: salesId,
      sales_name: salesName,
      target_id: targetId,
      target_type: 'customer',
      target_nama: targetNama,
      tipe_aksi: 'Order',
      catatan_hasil: `SALES ORDER: ${amount.toLocaleString('id-ID')} Volume`,
      // activity timestamp is internal, let's keep it current or we can pass it if we modify logActivity
      // but let's leave activity timestamp as is, it's just a log.
    });

    // 2. Insert into structured orders table
    const { error: orderErr } = await supabase.from('orders').insert([{
      sales_id: salesId,
      customer_id: targetId,
      customer_name: targetNama,
      amount: amount,
      created_at: orderDate
    }]);
    if (orderErr) console.error('logOrder table error:', orderErr);

    // 3. Update Customer Table last_order_date and total_order_volume
    const { data: cust } = await supabase.from('customer').select('total_order_volume').eq('id', targetId).single();
    const currentVolume = cust?.total_order_volume || 0;
    const newVolume = currentVolume + amount;

    await supabase.from('customer').update({ 
      last_order_date: orderDate,
      total_order_volume: newVolume
    }).eq('id', targetId);
  },

  async updateOrder(orderId: string, amount: number, customDate?: string) {
    const { data: oldOrder } = await supabase.from('orders').select('amount, customer_id, created_at').eq('id', orderId).single();
    if (oldOrder) {
      const diff = amount - (oldOrder.amount || 0);
      
      const updatePayload: any = { amount };
      if (customDate) updatePayload.created_at = customDate;

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);
      if (error) throw error;

      const { data: cust } = await supabase.from('customer').select('total_order_volume').eq('id', oldOrder.customer_id).single();
      const currentVolume = cust?.total_order_volume || 0;
      const newVolume = currentVolume + diff;
      
      await supabase.from('customer').update({ total_order_volume: newVolume }).eq('id', oldOrder.customer_id);
    }
  },

  async fetchOrders(salesId?: string): Promise<SalesOrder[]> {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (salesId) query = query.eq('sales_id', salesId);
    
    const { data, error } = await query;
    if (error) {
      console.error('fetchOrders error:', error);
      return [];
    }
    return data as SalesOrder[];
  },

  async logVisit(salesId: string, area: Area, catatan: string, salesName?: string) {
    await this.logActivity({
      id_sales: salesId,
      sales_name: salesName,
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

  async clockIn(salesId: string, loc: { lat: number, lng: number, area: string }, photo: string, salesName?: string) {
    const attendanceData = {
      id: crypto.randomUUID(),
      sales_id: salesId,
      sales_name: salesName,
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

  async logNote(salesId: string, targetId: string, targetType: 'prospek' | 'customer', targetNama: string, catatan: string, salesName?: string) {
    await this.logActivity({
      id_sales: salesId,
      sales_name: salesName,
      target_id: targetId,
      target_type: targetType,
      target_nama: targetNama,
      tipe_aksi: 'Note',
      catatan_hasil: catatan
    });
  },

  // ─── ID GENERATORS ──────────────────────────────────────
  async generateNextProspekId() {
    const { data } = await supabase.from('prospek').select('id');
    const existingIds = (data || [])
      .map(p => p.id)
      .filter(id => id && id.startsWith('P'))
      .map(id => parseInt(id.substring(1)))
      .filter(num => !isNaN(num))
      .sort((a, b) => b - a);
    
    const nextNum = existingIds.length > 0 ? existingIds[0] + 1 : 1;
    return `P${nextNum.toString().padStart(3, '0')}`;
  },

  async generateNextCustomerId() {
    const { data } = await supabase.from('customer').select('id');
    const existingIds = (data || [])
      .map(c => c.id)
      .filter(id => id && id.startsWith('C'))
      .map(id => parseInt(id.substring(1)))
      .filter(num => !isNaN(num))
      .sort((a, b) => b - a);
    
    const nextNum = existingIds.length > 0 ? existingIds[0] + 1 : 1;
    return `C${nextNum.toString().padStart(3, '0')}`;
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

  // --- PAYROLL SETTINGS ---
  async fetchPayrollSettings() {
    const { data, error } = await supabase.from('payroll_settings').select('*').order('setting_key');
    if (error) console.error('fetchPayrollSettings error:', error);
    return data || [];
  },
  async updatePayrollSetting(key: string, value: number) {
    const { error } = await supabase.from('payroll_settings').update({ setting_value: value }).eq('setting_key', key);
    if (error) console.error('updatePayrollSetting error:', error);
    return { error };
  },
  async addPayrollSetting(key: string, value: number, description: string) {
    const { data, error } = await supabase.from('payroll_settings').insert([{ setting_key: key, setting_value: value, description }]).select();
    if (error) console.error('addPayrollSetting error:', error);
    return { data, error };
  },
  async deletePayrollSetting(key: string) {
    const { error } = await supabase.from('payroll_settings').delete().eq('setting_key', key);
    if (error) console.error('deletePayrollSetting error:', error);
    return { error };
  },

  // --- AREA RATES ---
  async fetchAreaRates() {
    const { data, error } = await supabase.from('area_rates').select('*').order('area_name');
    if (error) console.error('fetchAreaRates error:', error);
    return data || [];
  },
  async addAreaRate(rate: { area_name: string; daily_rate: number; overtime_rate_per_hour: number }) {
    const { data, error } = await supabase.from('area_rates').insert([rate]).select();
    if (error) console.error('addAreaRate error:', error);
    return { data, error };
  },
  async updateAreaRate(id: string, updates: Partial<{ area_name: string; daily_rate: number; overtime_rate_per_hour: number }>) {
    const { data, error } = await supabase.from('area_rates').update(updates).eq('id', id).select();
    if (error) console.error('updateAreaRate error:', error);
    return { data, error };
  },
  async deleteAreaRate(id: string) {
    const { error } = await supabase.from('area_rates').delete().eq('id', id);
    if (error) console.error('deleteAreaRate error:', error);
    return { error };
  },

  // ─── PUBLIC CATALOG ────────────────────────────────────
  async fetchProducts(activeOnly = true) {
    let query = supabase.from('products').select('*').order('name');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) console.error('fetchProducts error:', error);
    return { data: (data || []) as Product[], error };
  },

  async addProduct(p: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('products').upsert([p]).select();
    return { data, error };
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select();
    return { data, error };
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return { error };
  },

  // ─── NEGOTIATIONS ───────────────────────────────────────
  async fetchNegotiations() {
    const { data, error } = await supabase.from('leads_negotiations').select('*, products(*)').order('created_at', { ascending: false });
    if (error) console.error('fetchNegotiations error:', error);
    return { data: (data || []) as any[], error };
  },

  async submitNegotiation(n: Omit<LeadNegotiation, 'id' | 'created_at' | 'status'>) {
    const negotiationData = {
      ...n,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('leads_negotiations').insert([negotiationData]).select();
    return { data, error };
  },

  async updateNegotiationStatus(id: string, status: LeadNegotiation['status']) {
    const { data, error } = await supabase.from('leads_negotiations').update({ status }).eq('id', id).select();
    return { data, error };
  },
};
