'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ShoppingBag, Share2, AlertCircle, ArrowLeft } from 'lucide-react';
import ReceiptView from '@/components/ReceiptView';
import ShareReceiptModal from '@/components/ShareReceiptModal';

export default function TransaksiPage() {
  const { kode } = useParams();
  const router = useRouter();
  const [transaksi, setTransaksi] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        Memuat struk transaksi belanja...
      </div>
    );
  }

  if (!transaksi) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Transaksi Tidak Ditemukan</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Kode transaksi yang Anda cari tidak tersedia dalam sistem.</p>
        <Link href="/katalog" className="btn btn-outline mt-4">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <main style={{ padding: '36px 0 70px', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '520px' }}>
        
        {/* Tombol Navigasi Kembali di Kanan Atas */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <Link
            href="/katalog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.88rem',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
              textDecoration: 'none',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#334155';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
        </div>

        {/* Tampilan Kertas Struk Transaksi */}
        <ReceiptView 
          transaksi={transaksi} 
          details={details} 
          receiptId="customer-receipt-print"
        />

        {/* Tombol Aksi Bawah: Kembali ke Katalog Produk & Bagikan */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '12px',
          marginTop: '24px',
          maxWidth: '380px',
          margin: '24px auto 0'
        }}>
          <Link 
            href="/katalog" 
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 14px',
              fontSize: '0.9rem',
              fontWeight: 700
            }}
          >
            <ShoppingBag size={17} /> Kembali ke Katalog
          </Link>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 14px',
              fontSize: '0.9rem',
              fontWeight: 700,
              backgroundColor: '#ffffff'
            }}
          >
            <Share2 size={17} /> Bagikan
          </button>
        </div>

        {/* Modal Bagikan */}
        <ShareReceiptModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          transaksi={transaksi}
          receiptElementId="customer-receipt-print"
          onSuccessRedirect={() => router.push('/katalog')}
        />
      </div>
    </main>
  );
}
