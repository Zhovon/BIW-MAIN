-- =========================================================
-- BIW CRM Enhancement Migration
-- Run this against your Supabase SQL Editor
-- =========================================================

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create sale_employees junction table (multi-employee per sale)
CREATE TABLE IF NOT EXISTS sale_employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add customer_id column to sales table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Add phone and opening_hours columns to branches table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'branches' AND column_name = 'phone'
    ) THEN
        ALTER TABLE branches ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'branches' AND column_name = 'opening_hours'
    ) THEN
        ALTER TABLE branches ADD COLUMN opening_hours TEXT;
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sale_employees_sale_id ON sale_employees(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_employees_employee_id ON sale_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);
