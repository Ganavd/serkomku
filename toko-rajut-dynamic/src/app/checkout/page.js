'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, clearCart, removeMultipleFromCart } = useCart();
  const router = useRouter();

  const [resolvedCheckoutItems, setResolvedCheckoutItems] = useState([]);
  const [checkoutSource, setCheckoutSource] = useState('cart');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Prioritaskan item yang dipilih dari halaman keranjang
    const selectedCartData = sessionStorage.getItem('rajajutan_checkout_items');
    if (selectedCartData) {
      try {
        const parsed = JSON.parse(selectedCartData);
        if (parsed && parsed.length > 0) {
          setResolvedCheckoutItems(parsed);
          setCheckoutSource('cart_selected');
          setIsLoaded(true);
          return;
        }
      } catch (e) {}
    }

    // 2. Cek apakah ini transaksi Beli Langsung dari detail produk
    const buyNowData = sessionStorage.getItem('rajajutan_buy_now');
    if (buyNowData) {
      try {
        const parsed = JSON.parse(buyNowData);
        if (parsed && parsed.length > 0) {
          setResolvedCheckoutItems(parsed);
          setCheckoutSource('buy_now');
          setIsLoaded(true);
          return;
        }
      } catch (e) {}
    }

    // 3. Fallback ke seluruh isi keranjang
    setResolvedCheckoutItems(cart);
    setCheckoutSource('cart');
    setIsLoaded(true);
  }, []);

  const checkoutItems = resolvedCheckoutItems;
  const isDirect = checkoutSource === 'buy_now';
  const totalHarga = checkoutItems.reduce((sum, item) => sum + (item.harga * item.quantity), 0);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    alamat: '',
    metode_pembayaran: 'QRIS'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (isLoaded && checkoutItems.length === 0) {
    return (
      <main style={{ padding: '60px 0', textAlign: 'center', minHeight: '75vh' }}>
        <div className="container">
          <h2>Tidak Ada Pesanan untuk Ditransaksikan</h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Silakan pilih produk terlebih dahulu di katalog kami.</p>
          <button onClick={() => router.push('/katalog')} className="btn btn-primary mt-4">
            Kembali ke Katalog
          </button>
        </div>
      </main>
    );
  }

  const validate = () => {
    const errs = {};
    if (!formData.nama.trim()) errs.nama = 'Nama pemesan wajib diisi.';
    if (!formData.email.trim()) {
      errs.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Format email tidak valid.';
    }
    if (!formData.telepon.trim()) errs.telepon = 'Nomor telepon wajib diisi.';
    if (!formData.alamat.trim()) errs.alamat = 'Alamat pengiriman lengkap wajib diisi.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const kodeTransaksi = `TRX-${Date.now()}`;
      const paymentMethod = formData.metode_pembayaran || 'QRIS';
      
      const basePayload = {
        kode_transaksi: kodeTransaksi,
        nama_pelanggan: formData.nama,
        email_pelanggan: formData.email,
        telepon_pelanggan: formData.telepon,
        alamat_pengiriman: formData.alamat,
        total_harga: totalHarga,
        status: paymentMethod
      };

      // 1. Simpan Transaksi Utama di Database Supabase
      let trxData, trxError;
      const resWithCol = await supabase
        .from('transaksi')
        .insert([{ ...basePayload, metode_pembayaran: paymentMethod }])
        .select()
        .single();

      if (resWithCol.error) {
        const resFallback = await supabase
          .from('transaksi')
          .insert([basePayload])
          .select()
          .single();
        trxData = resFallback.data;
        trxError = resFallback.error;
      } else {
        trxData = resWithCol.data;
        trxError = resWithCol.error;
      }

      if (trxError) throw trxError;

      // 2. Simpan Detail Transaksi (Mengaitkan produk_id & jumlah pesanan)
      const detailItems = checkoutItems.map(item => ({
        transaksi_id: trxData.id,
        produk_id: item.id,
        jumlah: item.quantity,
        harga_satuan: item.harga,
        subtotal: item.harga * item.quantity
      }));

      const { error: detailError } = await supabase
        .from('detail_transaksi')
        .insert(detailItems);

      if (detailError) throw detailError;

      // 3. Update Pengurangan Stok Produk Aktual di Database Sesuai Kuantitas Dibeli
      for (const item of checkoutItems) {
        const { data: currentProduct } = await supabase
          .from('produk')
          .select('stok')
          .eq('id', item.id)
          .single();

        if (currentProduct) {
          const stokSekarang = currentProduct.stok || 0;
          const sisaStok = Math.max(0, stokSekarang - item.quantity);
          await supabase
            .from('produk')
            .update({ stok: sisaStok })
            .eq('id', item.id);
        }
      }

      // Bersihkan Session & Cache agar Data Terjual & Stok Terbaca Baru Instan
      sessionStorage.removeItem('rajajutan_buy_now');
      sessionStorage.removeItem('rajajutan_checkout_items');
      sessionStorage.removeItem('rajajutan_katalog_cache');
      sessionStorage.removeItem('rajajutan_featured_cache');

      if (checkoutSource === 'cart_selected') {
        const purchasedIds = checkoutItems.map(i => i.id);
        removeMultipleFromCart(purchasedIds);
      } else if (checkoutSource === 'cart') {
        clearCart();
      }

      router.push(`/transaksi/${kodeTransaksi}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Gagal memproses pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '36px 0 70px', minHeight: '80vh', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Header Bar dengan Tombol Kembali di Kanan Atas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
              {isDirect ? 'Pembelian Langsung' : 'Transaksi Keranjang'}
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: '4px 0 0 0' }}>Form Checkout Pesanan</h1>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px' }}>Isi data pengiriman dengan benar untuk menyelesaikan transaksi online Anda</p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
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
              cursor: 'pointer',
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
          </button>
        </div>

        {errorMessage && (
          <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '14px 18px', borderRadius: '10px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid #fecaca' }}>
            <AlertCircle size={20} /> {errorMessage}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
          {/* Form Data Diri */}
          <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a' }}>Data Pelanggan &amp; Alamat Pengiriman</h3>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', display: 'block' }}>Nama Lengkap *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama lengkap Anda"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
                />
                {errors.nama && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.nama}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', display: 'block' }}>Alamat Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contoh@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
                />
                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', display: 'block' }}>Nomor Telepon / WhatsApp *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="081234567890"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
                />
                {errors.telepon && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.telepon}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', display: 'block' }}>Alamat Lengkap Pengiriman *</label>
                <textarea
                  rows="3"
                  className="form-input"
                  placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kabupaten/kota..."
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontFamily: 'inherit' }}
                />
                {errors.alamat && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.alamat}</span>}
              </div>

              {/* Form Pilihan Metode Pembayaran (QRIS / Transfer Bank) */}
              <div className="form-group" style={{ marginTop: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '10px', display: 'block', color: '#0f172a' }}>
                  Metode Pembayaran *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Pilihan 1: QRIS */}
                  <div
                    onClick={() => setFormData({ ...formData, metode_pembayaran: 'QRIS' })}
                    style={{
                      border: `2px solid ${formData.metode_pembayaran === 'QRIS' ? '#2563eb' : '#e2e8f0'}`,
                      backgroundColor: formData.metode_pembayaran === 'QRIS' ? '#eff6ff' : '#ffffff',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: formData.metode_pembayaran === 'QRIS' ? '#1d4ed8' : '#0f172a' }}>
                      QRIS
                      </span>
                      <input
                        type="radio"
                        name="metode_pembayaran"
                        value="QRIS"
                        checked={formData.metode_pembayaran === 'QRIS'}
                        onChange={() => setFormData({ ...formData, metode_pembayaran: 'QRIS' })}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      Scan cepat semua e-wallet &amp; mobile banking
                    </span>
                  </div>

                  {/* Pilihan 2: Transfer Bank */}
                  <div
                    onClick={() => setFormData({ ...formData, metode_pembayaran: 'Transfer Bank' })}
                    style={{
                      border: `2px solid ${formData.metode_pembayaran === 'Transfer Bank' ? '#2563eb' : '#e2e8f0'}`,
                      backgroundColor: formData.metode_pembayaran === 'Transfer Bank' ? '#eff6ff' : '#ffffff',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: formData.metode_pembayaran === 'Transfer Bank' ? '#1d4ed8' : '#0f172a' }}>
                      Transfer Bank
                      </span>
                      <input
                        type="radio"
                        name="metode_pembayaran"
                        value="Transfer Bank"
                        checked={formData.metode_pembayaran === 'Transfer Bank'}
                        onChange={() => setFormData({ ...formData, metode_pembayaran: 'Transfer Bank' })}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      Transfer ke rekening BCA, Mandiri, BRI, BNI
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block mt-4"
                disabled={loading}
                style={{ padding: '14px', fontSize: '1rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {loading ? 'Memproses Pesanan Database...' : `Bayar Pesanan via ${formData.metode_pembayaran}`}
              </button>
            </form>
          </div>

          {/* Ringkasan Pesanan */}
          <div>
            <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>
                Ringkasan Pesanan ({checkoutItems.length} Item)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {checkoutItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{item.nama}</strong>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.quantity} x Rp {item.harga?.toLocaleString('id-ID')}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      Rp {(item.harga * item.quantity)?.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Metode Pembayaran Sebelum Subtotal/Total */}
              <div style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: '12px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.88rem'
              }}>
                <span style={{ color: '#64748b' }}>Metode Pembayaran:</span>
                <span style={{
                  fontWeight: 700,
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  border: '1px solid #bfdbfe'
                }}>
                  {formData.metode_pembayaran}
                </span>
              </div>

              <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Total Tagihan</span>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#2563eb' }}>
                  Rp {totalHarga?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
