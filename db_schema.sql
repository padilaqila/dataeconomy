-- ============================================================
-- Kalkulator SE-2026 — Initial Schema Migration (v3.0.0 PRD)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabel: public.users
--    Profil user yang di-link ke auth.users Supabase.
--    Menyimpan device-lock dan status lisensi lifetime.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT,
  current_device_id    TEXT,
  is_lifetime_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  last_device_change_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fungsi trigger: otomatis buat baris di public.users
-- setiap ada user baru mendaftar via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Pasang trigger ke event signup di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. Tabel: public.blocks
--    Satu blok sensus milik satu user (petugas).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nama_blok  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 3. Tabel: public.respondents
--    Data identitas per KK/responden dalam satu blok.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.respondents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id           UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  no_bangunan        TEXT,
  no_urut_kk         TEXT,
  nomor_kk           TEXT,
  nama_kpl_keluarga  TEXT,
  alamat             TEXT,
  jumlah_penghuni    INTEGER,
  sync_status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'synced'
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. Tabel: public.financial_records
--    Data spesifik modul 6 sektor (disimpan dalam JSONB).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.financial_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id          UUID NOT NULL REFERENCES public.respondents(id) ON DELETE CASCADE,
  module_type            TEXT,   -- enum: 'RUMAH_TANGGA', 'PERTANIAN', 'PERDAGANGAN_JASA', 'PETERNAKAN', 'PERIKANAN', 'INDUSTRI_PENGOLAHAN'
  module_data            JSONB,  -- harga referensi, jumlah barang, rincian biaya/pendapatan
  total_income_monthly   NUMERIC DEFAULT 0,
  total_income_yearly    NUMERIC DEFAULT 0,
  total_expense_monthly  NUMERIC DEFAULT 0,
  total_expense_yearly   NUMERIC DEFAULT 0,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- Row Level Security (RLS)
-- Semua tabel hanya bisa diakses oleh pemiliknya.
-- ============================================================

-- ── public.users ──────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;
CREATE POLICY "Users can manage own profile"
  ON public.users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── public.blocks ─────────────────────────────────────────────
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own blocks" ON public.blocks;
CREATE POLICY "Users can manage own blocks"
  ON public.blocks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── public.respondents ────────────────────────────────────────
ALTER TABLE public.respondents ENABLE ROW LEVEL SECURITY;

-- Akses via subquery: user memiliki block_id yang terkait
DROP POLICY IF EXISTS "Users can manage own respondents" ON public.respondents;
CREATE POLICY "Users can manage own respondents"
  ON public.respondents
  FOR ALL
  USING (
    block_id IN (
      SELECT id FROM public.blocks WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    block_id IN (
      SELECT id FROM public.blocks WHERE user_id = auth.uid()
    )
  );

-- ── public.financial_records ──────────────────────────────────
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own financial records" ON public.financial_records;
CREATE POLICY "Users can manage own financial records"
  ON public.financial_records
  FOR ALL
  USING (
    respondent_id IN (
      SELECT r.id FROM public.respondents r
      JOIN public.blocks b ON b.id = r.block_id
      WHERE b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    respondent_id IN (
      SELECT r.id FROM public.respondents r
      JOIN public.blocks b ON b.id = r.block_id
      WHERE b.user_id = auth.uid()
    )
  );
