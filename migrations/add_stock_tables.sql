-- Paradose Stock Management Table
CREATE TABLE IF NOT EXISTS public.paradose_stocks (
    id INTEGER PRIMARY KEY DEFAULT 1,
    golden_brew_current INTEGER NOT NULL DEFAULT 12,
    golden_brew_min INTEGER NOT NULL DEFAULT 10,
    berrycano_current INTEGER NOT NULL DEFAULT 7,
    berrycano_min INTEGER NOT NULL DEFAULT 10,
    biji_kopi_blend_current INTEGER NOT NULL DEFAULT 9,
    biji_kopi_blend_min INTEGER NOT NULL DEFAULT 8,
    susu_diamond_current INTEGER NOT NULL DEFAULT 26,
    susu_diamond_min INTEGER NOT NULL DEFAULT 24,
    gula_aren_current INTEGER NOT NULL DEFAULT 2,
    gula_aren_min INTEGER NOT NULL DEFAULT 1,
    cranberry_diamond_current INTEGER NOT NULL DEFAULT 7,
    cranberry_diamond_min INTEGER NOT NULL DEFAULT 6,
    botol_current INTEGER NOT NULL DEFAULT 100,
    botol_min INTEGER NOT NULL DEFAULT 75,
    custom_materials JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parasoes Stock Management Table
CREATE TABLE IF NOT EXISTS public.parasoes_stocks (
    id INTEGER PRIMARY KEY DEFAULT 1,
    chocolate_soes_current INTEGER NOT NULL DEFAULT 35,
    chocolate_soes_min INTEGER NOT NULL DEFAULT 25,
    vanilla_soes_current INTEGER NOT NULL DEFAULT 42,
    vanilla_soes_min INTEGER NOT NULL DEFAULT 25,
    terigu_current INTEGER NOT NULL DEFAULT 80,
    terigu_min INTEGER NOT NULL DEFAULT 40,
    cream_current INTEGER NOT NULL DEFAULT 55,
    cream_min INTEGER NOT NULL DEFAULT 30,
    bubuk_coklat_current INTEGER NOT NULL DEFAULT 45,
    bubuk_coklat_min INTEGER NOT NULL DEFAULT 20,
    vanilla_extract_current INTEGER NOT NULL DEFAULT 38,
    vanilla_extract_min INTEGER NOT NULL DEFAULT 15,
    telur_current INTEGER NOT NULL DEFAULT 120,
    telur_min INTEGER NOT NULL DEFAULT 50,
    mentega_current INTEGER NOT NULL DEFAULT 65,
    mentega_min INTEGER NOT NULL DEFAULT 30,
    custom_materials JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paradose_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parasoes_stocks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and update
CREATE POLICY "Enable read for authenticated users" ON public.paradose_stocks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.paradose_stocks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.paradose_stocks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON public.parasoes_stocks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.parasoes_stocks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.parasoes_stocks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert initial data
INSERT INTO public.paradose_stocks (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.parasoes_stocks (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
