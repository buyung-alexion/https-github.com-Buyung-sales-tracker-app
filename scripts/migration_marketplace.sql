-- Migration: Create Marketplace Tables (Products and Negotiations)

-- 1. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price BIGINT NOT NULL DEFAULT 0,
    image_url TEXT,
    min_bulk_qty INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Lead Negotiations Table
CREATE TABLE IF NOT EXISTS public.leads_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT, -- ID from customer table (e.g. C001)
    customer_name TEXT,
    product_id UUID REFERENCES public.products(id),
    requested_price BIGINT NOT NULL,
    requested_qty INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended for Supabase
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_negotiations ENABLE ROW LEVEL SECURITY;

-- Simple policies for authenticated users (Adjust as needed for your specific roles)
CREATE POLICY "Enable all for authenticated" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated" ON public.leads_negotiations FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for anon" ON public.products FOR SELECT TO anon USING (true);
