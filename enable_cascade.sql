-- enable_cascade.sql
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable cascading updates for Activity table
ALTER TABLE activity
DROP CONSTRAINT IF EXISTS activity_id_sales_fkey,
ADD CONSTRAINT activity_id_sales_fkey
FOREIGN KEY (id_sales) REFERENCES sales(id) ON UPDATE CASCADE;

-- 2. Enable cascading updates for Attendance table
ALTER TABLE attendance
DROP CONSTRAINT IF EXISTS attendance_sales_id_fkey,
ADD CONSTRAINT attendance_sales_id_fkey
FOREIGN KEY (sales_id) REFERENCES sales(id) ON UPDATE CASCADE;

-- 3. Enable cascading updates for Prospek table
ALTER TABLE prospek
DROP CONSTRAINT IF EXISTS prospek_sales_owner_fkey,
ADD CONSTRAINT prospek_sales_owner_fkey
FOREIGN KEY (sales_owner) REFERENCES sales(id) ON UPDATE CASCADE;

-- 4. Enable cascading updates for Customer table
ALTER TABLE customer
DROP CONSTRAINT IF EXISTS customer_sales_pic_fkey,
ADD CONSTRAINT customer_sales_pic_fkey
FOREIGN KEY (sales_pic) REFERENCES sales(id) ON UPDATE CASCADE;
