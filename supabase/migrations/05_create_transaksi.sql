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

CREATE TABLE IF NOT EXISTS detail_transaksi (
  id SERIAL PRIMARY KEY,
  transaksi_id INT NOT NULL REFERENCES transaksi(id) ON DELETE CASCADE,
  produk_id INT NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
  jumlah INT NOT NULL CHECK (jumlah > 0),
  harga_satuan INT NOT NULL CHECK (harga_satuan >= 0),
  subtotal INT NOT NULL CHECK (subtotal >= 0)
);

ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_transaksi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transaksi_select_publik" ON transaksi;
CREATE POLICY "transaksi_select_publik" ON transaksi FOR SELECT USING (true);

DROP POLICY IF EXISTS "transaksi_insert_publik" ON transaksi;
CREATE POLICY "transaksi_insert_publik" ON transaksi FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "detail_transaksi_select_publik" ON detail_transaksi;
CREATE POLICY "detail_transaksi_select_publik" ON detail_transaksi FOR SELECT USING (true);

DROP POLICY IF EXISTS "detail_transaksi_insert_publik" ON detail_transaksi;
CREATE POLICY "detail_transaksi_insert_publik" ON detail_transaksi FOR INSERT WITH CHECK (true);
