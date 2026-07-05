-- ============================================================
-- Kalkulator SE-2026 — Initial Schema Migration
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
-- 4. Tabel: public.family_members
--    Anggota keluarga dan pendapatan masing-masing (Step 1).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id  UUID NOT NULL REFERENCES public.respondents(id) ON DELETE CASCADE,
  nama           TEXT,
  pekerjaan      TEXT,
  gaji           NUMERIC DEFAULT 0,
  ijarah         NUMERIC DEFAULT 0,
  rekening       NUMERIC DEFAULT 0,
  status_tinggal TEXT
);


-- ─────────────────────────────────────────────────────────────
-- 5. Tabel: public.business_details
--    Profil usaha + pendapatan + pengeluaran usaha (Step 2 & 3).
--    Kolom pendapatan sudah disesuaikan dengan migrasi Dexie v2
--    (R27.a = barang/jasa, R27.b = lainnya, R27.c = total).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_details (
  respondent_id                  UUID PRIMARY KEY REFERENCES public.respondents(id) ON DELETE CASCADE,
  jenis_usaha                    TEXT,
  jenis_barang                   TEXT,
  tahun_mulai                    INTEGER,
  nib                            TEXT,
  alamat_usaha                   TEXT,
  -- Pengeluaran usaha (/bulan)
  r26a_upah                      NUMERIC DEFAULT 0,
  r26b_produksi                  NUMERIC DEFAULT 0,
  r26c_barang_dagangan           NUMERIC DEFAULT 0,
  r26d_operasional               NUMERIC DEFAULT 0,
  r26e_non_operasional           NUMERIC DEFAULT 0,
  total_upah_bulan               NUMERIC DEFAULT 0,
  biaya_produksi_bulan           NUMERIC DEFAULT 0,
  biaya_pembelian_barang_bulan   NUMERIC DEFAULT 0,
  operasional_bulan              NUMERIC DEFAULT 0,
  non_operasional_bulan          NUMERIC DEFAULT 0,
  total_pengeluaran_usaha_bulan  NUMERIC DEFAULT 0,
  -- Pendapatan (R27.a): Nilai Penjualan & Jasa
  pendapatan_barang_jasa_bulan   NUMERIC DEFAULT 0,
  pendapatan_barang_jasa_tahun   NUMERIC DEFAULT 0,
  -- Pendapatan (R27.b): Lainnya
  pendapatan_lainnya_bulan       NUMERIC DEFAULT 0,
  pendapatan_lainnya_tahun       NUMERIC DEFAULT 0,
  -- Pendapatan (R27.c): Total /tahun
  total_pendapatan_tahun         NUMERIC DEFAULT 0,
  -- Aset usaha
  nilai_aset_tanah_bangunan      NUMERIC DEFAULT 0,
  nilai_aset_selain_tanah        NUMERIC DEFAULT 0,
  total_aset_usaha               NUMERIC DEFAULT 0
);


-- ─────────────────────────────────────────────────────────────
-- 6. Tabel: public.family_expenses
--    Pengeluaran makan (Step 4) dan non-makan (Step 5).
--    Rincian disimpan dalam jsonb untuk fleksibilitas.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_expenses (
  respondent_id            UUID PRIMARY KEY REFERENCES public.respondents(id) ON DELETE CASCADE,
  rincian_makan            JSONB,  -- {beras, sayuran, lauk, ...}
  rincian_non_makan        JSONB,  -- {listrik, internet, air, ...}
  rincian_tahunan          JSONB,  -- {beli_baju, pajak_stnk, ...}
  total_makan_bulan        NUMERIC DEFAULT 0,
  total_non_makan_bulan    NUMERIC DEFAULT 0,
  total_beban_keluarga_bulan NUMERIC DEFAULT 0
);


-- ─────────────────────────────────────────────────────────────
-- 7. Tabel: public.assets_conditions
--    Aset dan kondisi hunian (Step 6).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets_conditions (
  respondent_id                UUID PRIMARY KEY REFERENCES public.respondents(id) ON DELETE CASCADE,
  luas_bangunan_tinggal        NUMERIC,
  luas_tanah_ditempati         NUMERIC,
  luas_bangunan_usaha          NUMERIC,
  tanah_selain_ditempati_unit  INTEGER,
  tanah_selain_ditempati_m2    NUMERIC,
  tanah_selain_ditempati_rp    NUMERIC,
  nilai_aset_tanah_bangunan    NUMERIC DEFAULT 0,
  jml_motor                    INTEGER DEFAULT 0,
  val_motor_rp                 NUMERIC DEFAULT 0,
  jml_mobil                    INTEGER DEFAULT 0,
  val_mobil_rp                 NUMERIC DEFAULT 0,
  emas_gram                    NUMERIC DEFAULT 0,
  emas_rp                      NUMERIC DEFAULT 0,
  riwayat_penyakit             TEXT,
  disabilitas                  TEXT
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


-- ── public.family_members ─────────────────────────────────────
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own family members" ON public.family_members;
CREATE POLICY "Users can manage own family members"
  ON public.family_members
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


-- ── public.business_details ───────────────────────────────────
ALTER TABLE public.business_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own business details" ON public.business_details;
CREATE POLICY "Users can manage own business details"
  ON public.business_details
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


-- ── public.family_expenses ────────────────────────────────────
ALTER TABLE public.family_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own family expenses" ON public.family_expenses;
CREATE POLICY "Users can manage own family expenses"
  ON public.family_expenses
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


-- ── public.assets_conditions ─────────────────────────────────
ALTER TABLE public.assets_conditions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own assets" ON public.assets_conditions;
CREATE POLICY "Users can manage own assets"
  ON public.assets_conditions
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
