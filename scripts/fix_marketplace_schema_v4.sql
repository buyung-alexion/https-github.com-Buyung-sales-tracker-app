-- FINAL REPAIR FOR MARKETPLACE DATABASE (v4 - Policy Fix)
-- Run this in your Supabase SQL Editor

-- 1. Drop existing table
DROP TABLE IF EXISTS public.leads_negotiations;

-- 2. Create table
CREATE TABLE public.leads_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL, 
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

-- 4. Enable RLS
ALTER TABLE public.leads_negotiations ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (THE FIX)
-- Allow EVERYONE (including Anonymous) to INSERT
DROP POLICY IF EXISTS "Anyone can insert" ON public.leads_negotiations;
CREATE POLICY "Anyone can insert" ON public.leads_negotiations FOR INSERT WITH CHECK (true);

-- Allow EVERYONE to SELECT (Required for the .select() after insert to work)
DROP POLICY IF EXISTS "Anyone can select" ON public.leads_negotiations;
CREATE POLICY "Anyone can select" ON public.leads_negotiations FOR SELECT USING (true);

-- Allow AUTHENTICATED users to UPDATE (for Sales to mark as processed)
DROP POLICY IF EXISTS "Authenticated can update" ON public.leads_negotiations;
CREATE POLICY "Authenticated can update" ON public.leads_negotiations FOR UPDATE TO authenticated USING (true);
