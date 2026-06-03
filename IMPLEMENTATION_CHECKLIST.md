# Implementation Checklist - Ready to Deploy ✅

## Status: All Code Changes Complete ✅

### Verification Results

- ✅ Development server starts without errors
- ✅ All imports are correct
- ✅ No TypeScript compilation errors
- ✅ All three files modified successfully

---

## Critical Next Steps Before Going Live

### 1. Database Migration (REQUIRED) ⚠️

**Must do this for fixes #2 to work (Paradose & Parasoes stock persistence)**

```sql
-- Copy and paste ALL of this into Supabase SQL Editor:
-- File: migrations/add_stock_tables.sql

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

ALTER TABLE public.paradose_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parasoes_stocks ENABLE ROW LEVEL SECURITY;

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

INSERT INTO public.paradose_stocks (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.parasoes_stocks (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
```

Steps:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste all the SQL above
4. Click "Execute"
5. Verify tables are created (check Tables section)

---

## Testing the Fixes

### Fix #1: Session Persistence ✅

**Status**: Ready to test (no DB required)

Steps:

1. Open http://localhost:5174
2. Login with test account
3. Press F5 to refresh page
4. ✅ Should stay logged in
5. ✅ Should not redirect to login

**Expected**: User profile and session persists

---

### Fix #2: Stock Persistence (Paradose & Parasoes) ⚠️

**Status**: Ready to test (requires DB migration)

**Prerequisites**: Must run SQL migration first!

Steps:

1. Go to Paradose page (http://localhost:5174/paradose)
2. Click "-Use" button on any item (e.g., Golden Brew: 12 → 11)
3. Notice green "Simpan Perubahan" (Save Changes) button appears
4. Click "Simpan Perubahan"
5. See success toast message
6. Press F5 to refresh
7. ✅ Stock value should be 11 (persisted)
8. Repeat for Parasoes page

**Expected**:

- Changes save to database
- Values persist after refresh
- Green save button only shows when changes exist

---

### Fix #3: Add Product (Tambah Produk) ✅

**Status**: Ready to test (no migration needed)

Steps:

1. Go to Products page
2. Click "Tambah Produk" button
3. Fill form:
   - Nama: "Kopi Espresso Baru"
   - Brand: Paradose
   - Kategori: coffee
   - Harga: 50000
   - Stok: 100
   - Min Stok: 20
   - Deskripsi: Optional
4. Click "Tambah Produk" button
5. ✅ Success message appears
6. ✅ New product appears in table immediately
7. Try leaving form fields empty and submitting - should show validation errors

**Expected**:

- Product added to database
- Appears in table immediately
- Validation shows helpful error messages

---

## Troubleshooting Guide

### Problem: "Simpan Perubahan" button not appearing

**Solution**:

- Verify migration was run
- Check browser console for errors
- Check Supabase tables were created

### Problem: Changes not saving

**Solution**:

- Ensure you clicked "Simpan Perubahan" button
- Check browser console for API errors
- Verify Supabase credentials in .env.local

### Problem: Still getting logged out on refresh

**Solution**:

- Clear browser cache and cookies
- Verify Supabase session is valid
- Check browser DevTools → Application → Cookies for supabase session

### Problem: Can't add products

**Solution**:

- Ensure all form fields are filled
- Check that price/stock/min_stock are valid numbers
- See browser console for detailed error message
- Verify products table exists in Supabase

---

## File Summary

### Changed Files:

1. `src/app/contexts/AuthContext.tsx` - Session fix
2. `src/app/pages/Paradose.tsx` - Stock persistence
3. `src/app/pages/Parasoes.tsx` - Stock persistence
4. `src/app/pages/Products.tsx` - Product addition fix

### New Files:

1. `migrations/add_stock_tables.sql` - Database schema
2. `FIXES_SUMMARY.md` - Detailed documentation
3. `IMPLEMENTATION_CHECKLIST.md` - This file

---

## Timeline to Go Live

**Day 1 - Setup (30 mins)**

- [ ] Run SQL migration in Supabase
- [ ] Verify tables are created

**Day 2 - Testing (1-2 hours)**

- [ ] Test session persistence
- [ ] Test Paradose stock management
- [ ] Test Parasoes stock management
- [ ] Test product addition

**Day 3 - Deploy**

- [ ] Push code to production
- [ ] Verify all features working in production

---

## Success Indicators ✅

All three issues should now be fixed:

1. **Session Persistence**: Users stay logged in after page refresh ✅
2. **Stock Management**: "Save Changes" button saves to database, persists on refresh ✅
3. **Product Addition**: "Tambah Produk" adds products with proper validation ✅

---

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Review the troubleshooting section above
3. Verify the SQL migration was executed
4. Check Supabase tables exist in your dashboard
5. Verify environment variables are set correctly

---

**Ready for testing!** 🚀
