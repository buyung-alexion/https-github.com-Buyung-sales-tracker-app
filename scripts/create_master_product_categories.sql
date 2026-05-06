
-- Create missing master tables for Data Management

-- 1. Master Product Categories
CREATE TABLE IF NOT EXISTS master_product_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Master Prospect Status
CREATE TABLE IF NOT EXISTS master_prospect_status (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Master Actions (Tipe Aktivitas)
CREATE TABLE IF NOT EXISTS master_actions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all
ALTER TABLE master_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prospect_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_actions ENABLE ROW LEVEL SECURITY;

-- Add Policies for master_product_categories
DROP POLICY IF EXISTS "Allow public read for master_product_categories" ON master_product_categories;
CREATE POLICY "Allow public read for master_product_categories" ON master_product_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all for authenticated users" ON master_product_categories;
CREATE POLICY "Allow all for authenticated users" ON master_product_categories FOR ALL USING (true);

-- Add Policies for master_prospect_status
DROP POLICY IF EXISTS "Allow public read for master_prospect_status" ON master_prospect_status;
CREATE POLICY "Allow public read for master_prospect_status" ON master_prospect_status FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all for authenticated users" ON master_prospect_status;
CREATE POLICY "Allow all for authenticated users" ON master_prospect_status FOR ALL USING (true);

-- Add Policies for master_actions
DROP POLICY IF EXISTS "Allow public read for master_actions" ON master_actions;
CREATE POLICY "Allow public read for master_actions" ON master_actions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all for authenticated users" ON master_actions;
CREATE POLICY "Allow all for authenticated users" ON master_actions FOR ALL USING (true);

-- Seed some initial data if empty
INSERT INTO master_product_categories (id, name) VALUES ('CAT001', 'Daging Sapi'), ('CAT002', 'Daging Ayam') ON CONFLICT DO NOTHING;
INSERT INTO master_prospect_status (id, name) VALUES ('HOT', 'Hot Prospect'), ('COLD', 'Cold Prospect') ON CONFLICT DO NOTHING;
INSERT INTO master_actions (id, name) VALUES ('VISIT', 'Visit Toko'), ('CALL', 'Telepon'), ('WA', 'WhatsApp') ON CONFLICT DO NOTHING;
