-- ULTRA FLEXIBLE REPAIR FOR MARKETPLACE DATABASE (v3)
-- Run this in your Supabase SQL Editor

-- 1. Drop existing table to ensure fresh start
DROP TABLE IF EXISTS public.leads_negotiations;

-- 2. Create table with TEXT for product_id (More flexible than UUID)
CREATE TABLE public.leads_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL, -- Changed to TEXT to avoid UUID mismatch errors
    sales_id TEXT, 
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    requested_qty INTEGER NOT NULL,
    offered_price NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add status constraint
ALTER TABLE public.leads_negotiations ADD CONSTRAINT leads_negotiations_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'countered', 'processed'));

-- 4. Enable RLS and Policies
ALTER TABLE public.leads_negotiations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Insert" ON public.leads_negotiations;
CREATE POLICY "Public Insert" ON public.leads_negotiations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth All" ON public.leads_negotiations;
CREATE POLICY "Auth All" ON public.leads_negotiations FOR ALL TO authenticated USING (true);
