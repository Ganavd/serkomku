-- ============================================================================
-- MIGRASI FINAL ALL-IN-ONE: TOKO RAJAJUTAN ARKANA
-- Menyiapkan seluruh Tabel, Kebijakan Akses (RLS), Storage Bucket, & Indeks Database
-- ============================================================================

-- 1. TABEL KATEGORI
CREATE TABLE IF NOT EXISTS kategori (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE
);

-- 2. TABEL PRODUK
CREATE TABLE IF NOT EXISTS produk (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  harga INT NOT NULL CHECK (harga >= 0),
  stok INT NOT NULL DEFAULT 0 CHECK (stok >= 0),
  deskripsi TEXT,
  gambar_url TEXT,
  kategori_id INT REFERENCES kategori(id) ON DELETE SET NULL,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. TABEL TRANSAKSI
CREATE TABLE IF NOT EXISTS transaksi (
  id SERIAL PRIMARY KEY,
  kode_transaksi VARCHAR(50) NOT NULL UNIQUE,
  nama_pelanggan VARCHAR(100) NOT NULL,
  email_pelanggan VARCHAR(100) NOT NULL,
  telepon_pelanggan VARCHAR(20) NOT NULL,
  alamat_pengiriman TEXT NOT NULL,
  total_harga INT NOT NULL CHECK (total_harga >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'Menunggu Pembayaran',
  dibuat_pada TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. TABEL DETAIL TRANSAKSI
CREATE TABLE IF NOT EXISTS detail_transaksi (
  id SERIAL PRIMARY KEY,
  transaksi_id INT NOT NULL REFERENCES transaksi(id) ON DELETE CASCADE,
  produk_id INT NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
  jumlah INT NOT NULL CHECK (jumlah > 0),
  harga_satuan INT NOT NULL CHECK (harga_satuan >= 0),
  subtotal INT NOT NULL CHECK (subtotal >= 0)
);

-- ============================================================================
-- HAK AKSES & ROW LEVEL SECURITY (RLS) TERBUKA UNTUK PUBLIK & ADMIN
-- ============================================================================
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_transaksi ENABLE ROW LEVEL SECURITY;

-- Policy Kategori
DROP POLICY IF EXISTS "kategori_select_publik" ON kategori;
CREATE POLICY "kategori_select_publik" ON kategori FOR SELECT USING (true);
DROP POLICY IF EXISTS "kategori_all_admin" ON kategori;
CREATE POLICY "kategori_all_admin" ON kategori FOR ALL USING (true);

-- Policy Produk
DROP POLICY IF EXISTS "produk_select_publik" ON produk;
CREATE POLICY "produk_select_publik" ON produk FOR SELECT USING (true);
DROP POLICY IF EXISTS "produk_insert_terbuka" ON produk;
CREATE POLICY "produk_insert_terbuka" ON produk FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "produk_update_terbuka" ON produk;
CREATE POLICY "produk_update_terbuka" ON produk FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "produk_delete_terbuka" ON produk;
CREATE POLICY "produk_delete_terbuka" ON produk FOR DELETE USING (true);

-- Policy Transaksi
DROP POLICY IF EXISTS "transaksi_select_publik" ON transaksi;
CREATE POLICY "transaksi_select_publik" ON transaksi FOR SELECT USING (true);
DROP POLICY IF EXISTS "transaksi_insert_publik" ON transaksi;
CREATE POLICY "transaksi_insert_publik" ON transaksi FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "transaksi_update_publik" ON transaksi;
CREATE POLICY "transaksi_update_publik" ON transaksi FOR UPDATE USING (true) WITH CHECK (true);

-- Policy Detail Transaksi
DROP POLICY IF EXISTS "detail_transaksi_select_publik" ON detail_transaksi;
CREATE POLICY "detail_transaksi_select_publik" ON detail_transaksi FOR SELECT USING (true);
DROP POLICY IF EXISTS "detail_transaksi_insert_publik" ON detail_transaksi;
CREATE POLICY "detail_transaksi_insert_publik" ON detail_transaksi FOR INSERT WITH CHECK (true);

-- ============================================================================
-- EMBEDDED STORAGE BUCKET UNTUK UPLOAD FOTO PRODUK
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('produk-images', 'produk-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "gambar_select_publik" ON storage.objects;
CREATE POLICY "gambar_select_publik" ON storage.objects FOR SELECT USING (bucket_id = 'produk-images');

DROP POLICY IF EXISTS "gambar_insert_terbuka" ON storage.objects;
CREATE POLICY "gambar_insert_terbuka" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'produk-images');

DROP POLICY IF EXISTS "gambar_update_terbuka" ON storage.objects;
CREATE POLICY "gambar_update_terbuka" ON storage.objects FOR UPDATE USING (bucket_id = 'produk-images');

DROP POLICY IF EXISTS "gambar_delete_terbuka" ON storage.objects;
CREATE POLICY "gambar_delete_terbuka" ON storage.objects FOR DELETE USING (bucket_id = 'produk-images');

-- ============================================================================
-- INDEKS OPTIMASI QUERY PENJUALAN & CARI PRODUK
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_detail_transaksi_produk ON detail_transaksi(produk_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_kode ON transaksi(kode_transaksi);
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori_id);

-- ============================================================================
-- DATA AWAL (SEED DATA SAMPLE PRODUK)
-- ============================================================================
INSERT INTO kategori (id, nama, slug) VALUES
  (1, 'Pakaian Rajut', 'pakaian-rajut'),
  (2, 'Aksesoris & Tas', 'aksesoris-tas'),
  (3, 'Mainan & Boneka', 'mainan-boneka')
ON CONFLICT (id) DO NOTHING;

INSERT INTO produk (id, nama, harga, stok, deskripsi, kategori_id) VALUES
  (1, 'Sweater Wol Soft Blue', 185000, 15, 'Sweater rajut hangat berbahan 100% wol wol berkualitas tinggi dengan rajutan rapi.', 1),
  (2, 'Cardigan Rajut Oversize', 210000, 10, 'Cardigan rajut santai bergaya modern dengan kancing kayu eksklusif.', 1),
  (3, 'Tas Jinjang (Tote Bag) Rajut', 95000, 20, 'Tas rajut kasual berkapasitas besar, cocok untuk kuliah maupun bersantai.', 2),
  (4, 'Syal Wol Musim Dingin', 75000, 25, 'Syal rajut lembut dengan tekstur tebal menjaga leher tetap hangat.', 2),
  (5, 'Boneka Rajut Amigurumi Kelinci', 65000, 12, 'Boneka kerajinan tangan berbentuk kelinci lucu buatan tangan asli.', 3)
ON CONFLICT (id) DO NOTHING;
