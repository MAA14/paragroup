CREATE TYPE ROLE_ENUM AS ENUM ('admin', 'user', 'moderator');
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY references auth.users(id) on delete cascade,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL,
  role ROLE_ENUM NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory Table for Dashboard
CREATE TABLE public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand TEXT NOT NULL CHECK (brand IN ('Paradose', 'Parasoes')),
    name TEXT NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert initial manual data from Dashboard.tsx
INSERT INTO public.inventory (brand, name, current_stock, min_stock)
VALUES
    ('Paradose', 'Golden Brew', 45, 30),
    ('Paradose', 'Berrycano', 28, 30),
    ('Paradose', 'Coffee Beans', 120, 50),
    ('Paradose', 'Milk', 65, 40),
    ('Parasoes', 'Chocolate', 35, 25),
    ('Parasoes', 'Vanilla', 42, 25),
    ('Parasoes', 'Choux Dough', 80, 40),
    ('Parasoes', 'Cream', 55, 30);

-- Enable RLS for inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Enable read access for all users" ON public.inventory
    FOR SELECT USING (true);

-- Allow all operations for admin
CREATE POLICY "Enable all for admins" ON public.inventory
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ==========================================
-- PRODUCTS & RAW MATERIALS (from Products.tsx, Paradose.tsx, Parasoes.tsx)
-- ==========================================

-- Products Table
CREATE TABLE public.products (
    id TEXT PRIMARY KEY, -- e.g., 'p1', 's1' to match frontend contexts
    name TEXT NOT NULL,
    brand TEXT NOT NULL CHECK (brand IN ('Paradose', 'Parasoes')),
    category TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw Materials Table (Bahan Baku)
CREATE TABLE public.raw_materials (
    id TEXT PRIMARY KEY, -- e.g., 'terigu', 'goldenBrew_mat'
    name TEXT NOT NULL,
    brand TEXT NOT NULL CHECK (brand IN ('Paradose', 'Parasoes', 'Shared')),
    unit TEXT NOT NULL,
    current_stock NUMERIC NOT NULL DEFAULT 0,
    min_stock NUMERIC NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipe Ingredients
CREATE TABLE public.recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    material_id TEXT REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    quantity_needed NUMERIC NOT NULL
);

-- ==========================================
-- POINT OF SALES & TRANSACTIONS (from POS.tsx)
-- ==========================================

-- Transactions Table
CREATE TABLE public.transactions (
    id TEXT PRIMARY KEY, -- e.g., TRX-123456789
    customer_name TEXT,
    subtotal NUMERIC NOT NULL,
    tax NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    commission NUMERIC DEFAULT 0,
    net_total NUMERIC NOT NULL,
    payment_method TEXT,
    payment_method_label TEXT,
    purchase_method TEXT,
    purchase_method_label TEXT,
    online_platform TEXT,
    offline_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction Items Table
CREATE TABLE public.transaction_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL, 
    brand TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL
);

-- ==========================================
-- REPORTS & EXPENSES (from Reports.tsx)
-- ==========================================

-- Expenses Table
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month VARCHAR(7) NOT NULL, -- Format YYYY-MM
    brand TEXT CHECK (brand IN ('Paradose', 'Parasoes', 'Shared')),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INSERT INITIAL DATA
-- ==========================================

-- Insert Initial Products Data
INSERT INTO public.products (id, name, brand, category, price, stock, min_stock, description)
VALUES 
    ('p1', 'Golden Brew', 'Paradose', 'coffee', 25000, 45, 30, 'Kopi premium dengan rasa smooth'),
    ('p2', 'Berrycano', 'Paradose', 'coffee', 28000, 28, 30, 'Kopi dengan sentuhan berry'),
    ('s1', 'Chocolate Soes', 'Parasoes', 'pastry', 15000, 35, 25, 'Choux pastry rasa coklat'),
    ('s2', 'Vanilla Soes', 'Parasoes', 'pastry', 15000, 42, 25, 'Choux pastry rasa vanilla');

-- Insert Initial Raw Materials Data
INSERT INTO public.raw_materials (id, name, brand, unit, current_stock, min_stock)
VALUES
    ('bijiKopiBlend', 'Biji Kopi Blend', 'Paradose', 'kg', 9, 8),
    ('susuDiamond', 'Susu Diamond', 'Paradose', 'liter', 26, 24),
    ('gulaAren', 'Gula Aren', 'Paradose', 'liter', 2, 1),
    ('cranberryDiamond', 'Cranberry Diamond', 'Paradose', 'Karton', 7, 6),
    ('botol', 'Botol', 'Paradose', 'pcs', 100, 75),
    ('terigu', 'Terigu', 'Parasoes', 'kg', 80, 40),
    ('cream', 'Cream', 'Parasoes', 'kg', 55, 30),
    ('bubukCoklat', 'Bubuk Coklat', 'Parasoes', 'kg', 45, 20),
    ('vanillaExtract', 'Vanilla Extract', 'Parasoes', 'bottles', 38, 15),
    ('telur', 'Telur', 'Parasoes', 'pcs', 120, 50),
    ('mentega', 'Mentega', 'Parasoes', 'kg', 65, 30);

-- Insert Initial Recipe Ingredients
INSERT INTO public.recipe_ingredients (product_id, material_id, quantity_needed)
VALUES
    ('s1', 'terigu', 2),
    ('s1', 'cream', 1),
    ('s1', 'bubukCoklat', 1),
    ('s1', 'telur', 1),
    ('s1', 'mentega', 1),
    ('s2', 'terigu', 2),
    ('s2', 'cream', 1),
    ('s2', 'vanillaExtract', 1),
    ('s2', 'telur', 1),
    ('s2', 'mentega', 1);

-- Insert Initial Expenses
INSERT INTO public.expenses (month, brand, category, amount)
VALUES
    ('2026-04', 'Shared', 'Bahan Baku', 1800000),
    ('2026-04', 'Shared', 'Operasional', 450000),
    ('2026-04', 'Shared', 'Marketing', 200000),
    ('2026-04', 'Shared', 'Utilitas', 185000);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Allow read access for all users
CREATE POLICY "Enable read access for all" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all" ON public.raw_materials FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.raw_materials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.raw_materials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.raw_materials FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all" ON public.recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.recipe_ingredients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.recipe_ingredients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.recipe_ingredients FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.transactions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.transaction_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.transaction_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.transaction_items FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.expenses FOR DELETE USING (auth.role() = 'authenticated');