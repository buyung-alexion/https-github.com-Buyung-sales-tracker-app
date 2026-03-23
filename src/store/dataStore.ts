import { supabase } from '../lib/supabase';
import type { Sales, Prospek, Customer, Activity, Area, PlanBesok } from '../types';

export const store = {
  // ─── PROSPEK ────────────────────────────────────────────
  async addProspek(p: Omit<Prospek, 'id' | 'created_at'>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { foto_profil, ...dbPayload } = p as any;
    const { data, error } = await supabase.from('prospek').insert([dbPayload]).select().single();
    if (error) console.error('addProspek error:', error);
    return data;
  },

  async updateProspek(id: string, updates: Partial<Prospek>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { foto_profil, ...dbPayload } = updates as any;
    const { error } = await supabase.from('prospek').update(dbPayload).eq('id', id);
    if (error) console.error('updateProspek error:', error);
  },

  async deleteProspek(id: string) {
    const { error } = await supabase.from('prospek').delete().eq('id', id);
    if (error) console.error('deleteProspek error:', error);
  },

  // ─── CUSTOMER ───────────────────────────────────────────
  async addCustomer(c: Omit<Customer, 'id'>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { foto_profil, ...dbPayload } = c as any;
    const { data, error } = await supabase.from('customer').insert([dbPayload]).select().single();
    if (error) console.error('addCustomer error:', error);
    return data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { foto_profil, ...dbPayload } = updates as any;
    const { error } = await supabase.from('customer').update(dbPayload).eq('id', id);
    if (error) console.error('updateCustomer error:', error);
  },

  // ─── CONVERT PROSPEK → CUSTOMER ─────────────────────────
  async convertToCustomer(prospek: Prospek, orderVolume: number) {
    const customerData = {
      nama_toko: prospek.nama_toko,
      no_wa: prospek.no_wa,
      area: prospek.area,
      total_order_volume: orderVolume,
      sales_pic: prospek.sales_owner,
      link_map: prospek.link_map,
    };
    
    // 1. Insert Customer
    const { data: customer, error: errC } = await supabase.from('customer').insert([customerData]).select().single();
    if (errC || !customer) {
      console.error('convertToCustomer error:', errC);
      return null;
    }

    // 2. Delete Prospek
    await this.deleteProspek(prospek.id);

    // 3. Log Activity
    await this.logActivity({
      id_sales: prospek.sales_owner,
      target_id: customer.id,
      target_type: 'customer',
      target_nama: prospek.nama_toko,
      tipe_aksi: 'Visit',
      catatan_hasil: `CLOSING! Order pertama ${orderVolume}kg. Data dipindahkan ke Customer.`,
    });

    return customer;
  },

  // ─── ACTIVITY ───────────────────────────────────────────
  async logActivity(a: Omit<Activity, 'id' | 'timestamp'>) {
    const { data, error } = await supabase.from('activity').insert([a]).select().single();
    if (error) console.error('logActivity error:', error);
    return data;
  },

  async logWA(salesId: string, targetId: string, targetType: 'prospek' | 'customer', targetNama: string, noWA: string, catatan = '') {
    await this.logActivity({
      id_sales: salesId,
      target_id: targetId,
      target_type: targetType,
      target_nama: targetNama,
      tipe_aksi: 'WA',
      catatan_hasil: catatan || 'Dibuka via WhatsApp.'
    });
    const msg = encodeURIComponent(`Halo ${targetNama}, kami dari Sales Daging—ada yang bisa dibantu?`);
    window.open(`https://wa.me/${noWA}?text=${msg}`, '_blank');
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

  // ─── PLAN BESOK (RENCANA) ───────────────────────────────
  async addPlanBesok(p: Omit<PlanBesok, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase.from('plan_besok').insert([p]).select().single();
    if (error) console.error('addPlanBesok error:', error);
    return data;
  },
  async updatePlanBesok(id: string, updates: Partial<PlanBesok>) {
    const { error } = await supabase.from('plan_besok').update(updates).eq('id', id);
    if (error) console.error('updatePlanBesok error:', error);
  },
  async deletePlanBesok(id: string) {
    const { error } = await supabase.from('plan_besok').delete().eq('id', id);
    if (error) console.error('deletePlanBesok error:', error);
  },

  // ─── SALES CRUD ─────────────────────────────────────────
  async addSales(sales: Sales) {
    const { error } = await supabase.from('sales').insert([sales]);
    if (error) console.error('addSales error:', error);
  },
  async updateSales(id: string, updates: Partial<Sales>) {
    const { error } = await supabase.from('sales').update(updates).eq('id', id);
    if (error) console.error('updateSales error:', error);
  },
};

