-- Migration: Add Discount, Stock, and Sold Count to Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- Optional: Remove floor_price if it exists (user asked to remove it from UI earlier)
-- ALTER TABLE public.products DROP COLUMN IF EXISTS floor_price;
