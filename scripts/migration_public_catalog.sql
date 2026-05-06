-- Migration: Public Catalog & Negotiation Engine
-- Description: Creates products and leads_negotiations tables with RLS policies.

-- 1. Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT,
    min_bulk_qty INTEGER NOT NULL DEFAULT 10,
    floor_price NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create leads_negotiations table
CREATE TABLE IF NOT EXISTS leads_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    requested_qty INTEGER NOT NULL,
    offered_price NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'countered')) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_negotiations ENABLE ROW LEVEL SECURITY;

-- 4. Products Policies
-- Allow public to view active products
DROP POLICY IF EXISTS "Public Read Access" ON products;
CREATE POLICY "Public Read Access" ON products FOR SELECT USING (is_active = true);

-- Allow authenticated managers to manage products
DROP POLICY IF EXISTS "Manager Management" ON products;
CREATE POLICY "Manager Management" ON products FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM sales WHERE id = auth.uid()::text AND role = 'Manager'));

-- 5. Leads Negotiations Policies
-- Allow public to submit negotiations
DROP POLICY IF EXISTS "Public Insert Access" ON leads_negotiations;
CREATE POLICY "Public Insert Access" ON leads_negotiations FOR INSERT WITH CHECK (true);

-- Allow authenticated users (Sales/Manager) to view all negotiations
DROP POLICY IF EXISTS "Sales Read Access" ON leads_negotiations;
CREATE POLICY "Sales Read Access" ON leads_negotiations FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update status
DROP POLICY IF EXISTS "Sales Update Access" ON leads_negotiations;
CREATE POLICY "Sales Update Access" ON leads_negotiations FOR UPDATE TO authenticated USING (true);

-- 6. Seed initial products for testing
INSERT INTO products (name, category, price, image_url, min_bulk_qty, floor_price)
VALUES 
('Sapi Sirloin (Premium)', 'Beef', 150000, 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=800', 5, 135000),
('Ayam Karkas', 'Poultry', 35000, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=800', 20, 31000),
('Daging Giling Beef', 'Beef', 110000, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=800', 10, 100000)
ON CONFLICT DO NOTHING;
