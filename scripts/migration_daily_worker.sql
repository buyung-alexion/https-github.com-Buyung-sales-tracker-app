-- Create area_rates table
CREATE TABLE IF NOT EXISTS area_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_name TEXT NOT NULL UNIQUE,
    daily_rate NUMERIC NOT NULL DEFAULT 0,
    overtime_rate_per_hour NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES sales(id), -- Match sales.id type (TEXT)
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    area_id UUID REFERENCES area_rates(id),
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    overtime_hours NUMERIC NOT NULL DEFAULT 0,
    daily_rate_applied NUMERIC NOT NULL DEFAULT 0,
    overtime_rate_applied NUMERIC NOT NULL DEFAULT 0,
    total_pay NUMERIC NOT NULL DEFAULT 0,
    is_out_of_city BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alpa')) NOT NULL DEFAULT 'Hadir',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some initial area rates as examples
INSERT INTO area_rates (area_name, daily_rate, overtime_rate_per_hour)
VALUES 
('Kota', 100000, 20000),
('Gerogot', 120000, 25000),
('Sepaku', 150000, 30000)
ON CONFLICT (area_name) DO NOTHING;

-- Enable RLS
ALTER TABLE area_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Add Policies (Basic - can be refined)
CREATE POLICY "Allow authenticated read for area_rates" ON area_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow individual read/write for attendance_records" ON attendance_records FOR ALL TO authenticated USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM sales WHERE id = auth.uid()::text AND role = 'Manager'));

-- Create payroll_settings table
CREATE TABLE IF NOT EXISTS payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial payroll settings
INSERT INTO payroll_settings (setting_key, setting_value, description)
VALUES 
('rate_driver', 170000, 'Gaji harian Driver'),
('rate_helper', 150000, 'Gaji harian Helper'),
('rate_produksi', 170000, 'Gaji harian Produksi'),
('overtime_flat_bonus', 25000, 'Bonus lembur flat jika lewat jam ambang'),
('out_of_city_bonus', 50000, 'Bonus pengantaran luar kota'),
('overtime_start_hour', 18, 'Jam mulai hitung lembur (format 24 jam)')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read for payroll_settings" ON payroll_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow manager write for payroll_settings" ON payroll_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM sales WHERE id = auth.uid()::text AND role = 'Manager'));
