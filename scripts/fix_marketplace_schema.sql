-- Consolidated Fix for Marketplace Leads & Negotiations
-- Run this in your Supabase SQL Editor

-- 1. Ensure the table exists with all required columns
CREATE TABLE IF NOT EXISTS public.leads_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    sales_id TEXT, -- To track which sales person got the lead
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    requested_qty INTEGER NOT NULL,
    offered_price NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update/Add the status constraint to include 'processed'
ALTER TABLE public.leads_negotiations DROP CONSTRAINT IF EXISTS leads_negotiations_status_check;
ALTER TABLE public.leads_negotiations ADD CONSTRAINT leads_negotiations_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'countered', 'processed'));

-- 3. Ensure the sales_id column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads_negotiations' AND column_name='sales_id') THEN
        ALTER TABLE public.leads_negotiations ADD COLUMN sales_id TEXT;
    END IF;
END $$;

-- 4. Set RLS Policies
ALTER TABLE public.leads_negotiations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Insert Access" ON public.leads_negotiations;
CREATE POLICY "Public Insert Access" ON public.leads_negotiations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Select Access" ON public.leads_negotiations;
CREATE POLICY "Authenticated Select Access" ON public.leads_negotiations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Update Access" ON public.leads_negotiations;
CREATE POLICY "Authenticated Update Access" ON public.leads_negotiations FOR UPDATE TO authenticated USING (true);
