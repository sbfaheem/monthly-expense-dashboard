-- =======================================================
-- SQL SCRIPT TO ENABLE RLS (ROW LEVEL SECURITY)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lxzytxsoxvgavribszpx/editor
-- =======================================================

-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE monthly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist to prevent duplicates
DROP POLICY IF EXISTS "Allow public select" ON monthly_records;
DROP POLICY IF EXISTS "Allow public insert" ON monthly_records;
DROP POLICY IF EXISTS "Allow public update" ON monthly_records;
DROP POLICY IF EXISTS "Allow public delete" ON monthly_records;

DROP POLICY IF EXISTS "Allow public select" ON expenses;
DROP POLICY IF EXISTS "Allow public insert" ON expenses;
DROP POLICY IF EXISTS "Allow public update" ON expenses;
DROP POLICY IF EXISTS "Allow public delete" ON expenses;

DROP POLICY IF EXISTS "Allow public select" ON settings;
DROP POLICY IF EXISTS "Allow public insert" ON settings;
DROP POLICY IF EXISTS "Allow public update" ON settings;
DROP POLICY IF EXISTS "Allow public delete" ON settings;

-- 3. Create policies for monthly_records (Public read, public write)
CREATE POLICY "Allow public select" ON monthly_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON monthly_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON monthly_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON monthly_records FOR DELETE USING (true);

-- 4. Create policies for expenses (Public read, public write)
CREATE POLICY "Allow public select" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON expenses FOR DELETE USING (true);

-- 5. Create policies for settings (Public read, public write/upsert)
CREATE POLICY "Allow public select" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON settings FOR DELETE USING (true);
