-- ==========================================
-- FINAL FIX FOR LIVE DASHBOARD
-- Run this in PROJECT: lxzytxsoxvgavribszpx
-- ==========================================

-- 1. Create Tables (Matching the frontend expectation)
CREATE TABLE IF NOT EXISTS monthly_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_year VARCHAR(20) NOT NULL UNIQUE, -- e.g. "2026-03"
    opening_balance NUMERIC NOT NULL DEFAULT 0,
    monthly_collection NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_id UUID REFERENCES monthly_records(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT DEFAULT 'Fixed', -- Using 'Fixed' or 'Variable'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS and Policies
ALTER TABLE monthly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow everything for now (Public Access)
CREATE POLICY "Allow anon select" ON monthly_records FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON monthly_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON monthly_records FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON monthly_records FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON expenses FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON settings FOR SELECT USING (true);

-- 3. Seed Data (Jan, Feb, Mar 2026)

-- Cleanup existing
DELETE FROM monthly_records;

-- Insert Reports
INSERT INTO monthly_records (month_year, opening_balance, monthly_collection) VALUES 
('2026-01', 45800, 291650),
('2026-02', 50400, 284750),
('2026-03', 32830, 283250);

-- Insert Expenses
DO $$
DECLARE
    jan_id UUID;
    feb_id UUID;
    mar_id UUID;
BEGIN
    SELECT id INTO jan_id FROM monthly_records WHERE month_year = '2026-01';
    SELECT id INTO feb_id FROM monthly_records WHERE month_year = '2026-02';
    SELECT id INTO mar_id FROM monthly_records WHERE month_year = '2026-03';

    -- January
    INSERT INTO expenses (month_id, description, amount, category) VALUES
    (jan_id, 'Security Expense', 206500, 'Fixed'),
    (jan_id, 'Electrician Charges', 8000, 'Fixed'),
    (jan_id, 'Sweeper Salary', 15000, 'Fixed'),
    (jan_id, 'Electrical Accessories', 5000, 'Fixed'),
    (jan_id, 'Miscellaneous', 6050, 'Fixed'),
    (jan_id, 'Shed Installation', 7500, 'Variable'),
    (jan_id, 'Receipt Books', 7000, 'Variable'),
    (jan_id, 'Previous Committee Outstanding', 20000, 'Variable'),
    (jan_id, 'Valve Chamber Cover', 5000, 'Variable'),
    (jan_id, 'Security Guard New Uniform', 7000, 'Variable');

    -- February
    INSERT INTO expenses (month_id, description, amount, category) VALUES
    (feb_id, 'Security Expense', 207000, 'Fixed'),
    (feb_id, 'Electrician Charges', 8000, 'Fixed'),
    (feb_id, 'Sweeper Salary', 15000, 'Fixed'),
    (feb_id, 'Sweeper Accessories', 7900, 'Fixed'),
    (feb_id, 'Electrical Accessories', 7520, 'Fixed'),
    (feb_id, 'Park', 1500, 'Fixed'),
    (feb_id, 'Chair', 1500, 'Variable'),
    (feb_id, 'Wire Lock', 400, 'Variable'),
    (feb_id, 'Wooden Stair', 3500, 'Variable'),
    (feb_id, 'Transportation for wooden Stair', 700, 'Variable'),
    (feb_id, 'Ring + Cap Labour Charges', 7500, 'Variable'),
    (feb_id, 'Miscellaneous', 2500, 'Variable'),
    (feb_id, 'Water Chamber (Remaining)', 500, 'Variable'),
    (feb_id, 'Installed CCTV Camera', 38800, 'Variable');

    -- March
    INSERT INTO expenses (month_id, description, amount, category) VALUES
    (mar_id, 'Security Expense', 210000, 'Fixed'),
    (mar_id, 'Electrician Charges', 8000, 'Fixed'),
    (mar_id, 'Sweeper Salary', 20000, 'Fixed'),
    (mar_id, 'Sweeper Accessories', 6200, 'Fixed'),
    (mar_id, 'Electrical Accessories', 14765, 'Fixed'),
    (mar_id, 'Park', 3530, 'Fixed'),
    (mar_id, 'Miscellaneous Expenses', 6800, 'Variable'),
    (mar_id, 'Gutter Cleaned', 5000, 'Variable');
END $$;
