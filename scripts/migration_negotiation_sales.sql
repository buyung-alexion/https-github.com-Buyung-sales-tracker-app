-- Migration: Add sales_id to leads_negotiations
ALTER TABLE public.leads_negotiations 
ADD COLUMN IF NOT EXISTS sales_id TEXT;
