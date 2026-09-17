'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

export default function TransaksiPage() {
  const { kode } = useParams();
  const [transaksi, setTransaksi] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kode) fetchTransaction();
  }, [kode]);

  async function fetchTransaction() {
    setLoading(true);
    const { data: trx, error: trxErr } = await supabase
      .from('transaksi')
      .select('*')
      .eq('kode_transaksi', kode)
      .single();

    if (trx) {
      setTransaksi(trx);

      const { data: dtl } = await supabase
        .from('detail_transaksi')
        .select('*, produk(nama)')
        .eq('transaksi_id', trx.id);

      if (dtl) setDetails(dtl);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
        Memuat detail pesanan...
      </div>
    );
  }

  if (!transaksi) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Transaksi Tidak Ditemukan</h2>
        <Link href="/katalog" className="btn btn-outline mt-4">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <main style={{ padding: '40px 0', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '700px' }}>
        <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
          <CheckCircle2 size={56} style={{ color: '#166534', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Pesanan Berhasil Dibuat!</h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Terima kasih telah berbelanja di Toko Rajut Nusantara.
          </p>

          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '28px'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Kode Transaksi</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a8a' }}>{transaksi.kode_transaksi}</div>
          </div>

          <div style={{ textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Detail Pelanggan</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}><strong>Nama:</strong> {transaksi.nama_pelanggan}</p>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}><strong>Email:</strong> {transaksi.email_pelanggan}</p>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}><strong>Telepon:</strong> {transaksi.telepon_pelanggan}</p>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}><strong>Alamat:</strong> {transaksi.alamat_pengiriman}</p>
          </div>

          <div style={{ textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Daftar Item</h3>
            {details.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                <span>{item.produk?.nama || 'Produk Rajut'} x{item.jumlah}</span>
                <span>Rp {item.subtotal?.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total Keseluruhan</span>
              <span style={{ color: '#2563eb' }}>Rp {transaksi.total_harga?.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <Link href="/katalog" className="btn btn-primary btn-block">
            <ShoppingBag size={16} /> Kembali ke Katalog Produk
          </Link>
        </div>
      </div>
    </main>
  );
}
