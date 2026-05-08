-- ROBUST REPAIR FOR MARKETPLACE DATABASE
-- Run this in your Supabase SQL Editor

-- 1. Drop existing table to ensure fresh start (WARNING: This will delete existing lead data)
-- If you want to keep data, comment out the DROP line and use the ALTER lines below.
DROP TABLE IF EXISTS public.leads_negotiations;

-- 2. Re-create the table with exact columns needed by the app
CREATE TABLE public.leads_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    sales_id TEXT, 
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    requested_qty INTEGER NOT NULL,
    offered_price NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add the status constraint
ALTER TABLE public.leads_negotiations ADD CONSTRAINT leads_negotiations_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'countered', 'processed'));

-- 4. Set RLS Policies (CRITICAL for public submission)
ALTER TABLE public.leads_negotiations ENABLE ROW LEVEL SECURITY;

-- Allow PUBLIC (Consumen) to insert
DROP POLICY IF EXISTS "Public Insert" ON public.leads_negotiations;
CREATE POLICY "Public Insert" ON public.leads_negotiations FOR INSERT WITH CHECK (true);

-- Allow AUTHENTICATED (Sales/Manager) to see and update
DROP POLICY IF EXISTS "Auth All" ON public.leads_negotiations;
CREATE POLICY "Auth All" ON public.leads_negotiations FOR ALL TO authenticated USING (true);

-- 5. Final check on Products table (Ensure it has enough data)
-- If price is missing or columns are different, this might affect products display.
-- But the screenshot shows products are visible, so we focus on leads_negotiations.
