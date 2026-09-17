'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, ShoppingCart, Zap, ShieldCheck, Truck, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [actualSold, setActualSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [notification, setNotification] = useState('');

  const { addToCart } = useCart();

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    try {
      // 1. Jalankan query produk dan penjualan bersamaan secara paralel
      const [prodRes, salesRes] = await Promise.all([
        supabase
          .from('produk')
          .select('*, kategori(nama)')
          .eq('id', id)
          .single(),
        supabase
          .from('detail_transaksi')
          .select('jumlah')
          .eq('produk_id', id)
      ]);

      if (prodRes.data) {
        setProduct(prodRes.data);
      }
      if (salesRes.data) {
        const total = salesRes.data.reduce((acc, curr) => acc + curr.jumlah, 0);
        setActualSold(total);
      }
    } catch (err) {
      console.error('Error fetching product detail:', err);
    } finally {
      setLoading(false);
    }
  }

  // 1. Tambah ke Keranjang (Tetap di halaman untuk belanja banyak barang)
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, qty);
      setNotification(`✓ Berhasil menambahkan ${qty} item "${product.nama}" ke keranjang! Anda dapat melanjutkan memilih produk lainnya.`);
      setTimeout(() => setNotification(''), 4500);
    }
  };

  // 2. Beli Sekarang (Langsung diarahkan ke Checkout tanpa memicu bubble keranjang)
  const handleBuyNow = () => {
    if (product) {
      sessionStorage.removeItem('rajajutan_checkout_items');
      sessionStorage.setItem('rajajutan_buy_now', JSON.stringify([{ ...product, quantity: qty }]));
      router.push('/checkout?direct=true');
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '80px 0', minHeight: '80vh', textAlign: 'center', color: '#64748b' }}>
        <div className="container">
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧶</div>
          <p>Memuat rincian produk rajutan...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ padding: '80px 0', minHeight: '80vh', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Produk Tidak Ditemukan</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Produk rajut yang Anda cari mungkin sudah dihapus atau tidak aktif.</p>
          <Link href="/katalog" className="btn btn-primary">
            &larr; Kembali ke Katalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '36px 0 70px', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Navigasi Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link href="/katalog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748b',
            fontSize: '0.92rem',
            fontWeight: 500,
            textDecoration: 'none'
          }}>
            <ArrowLeft size={16} /> Kembali ke Katalog Produk
          </Link>
        </div>

        {/* Notifikasi Tambah Keranjang */}
        {notification && (
          <div style={{
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontWeight: 600,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.1)'
          }}>
            <span>{notification}</span>
            <Link href="/keranjang" style={{ color: '#15803d', textDecoration: 'underline', fontWeight: 700, marginLeft: '12px' }}>
              Lihat Keranjang &rarr;
            </Link>
          </div>
        )}

        {/* Card Detail Produk */}
        <div className="card" style={{
          padding: '36px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 480px) 1fr',
            gap: '48px',
            alignItems: 'start'
          }}>
            {/* Display Gambar Multimedia Produk */}
            <div>
              <div style={{
                position: 'relative',
                width: '100%',
                paddingTop: '100%',
                backgroundColor: '#f1f5f9',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}>
                {product.gambar_url ? (
                  <img
                    src={product.gambar_url}
                    alt={product.nama}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                    <span style={{ fontSize: '4rem', marginBottom: '8px' }}>🧶</span>
                    <span>Foto Multimedia Rajutan</span>
                  </div>
                )}
              </div>

              {/* Jaminan Layanan */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginTop: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                  color: '#475569'
                }}>
                  <ShieldCheck size={20} className="text-blue-600" />
                  <span>100% Wol Asli &amp; Kerapian Terjamin</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                  color: '#475569'
                }}>
                  <Truck size={20} className="text-blue-600" />
                  <span>Pengiriman Aman Bergaransi</span>
                </div>
              </div>
            </div>

            {/* Kolom Informasi & Tombol Transaksi */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  textTransform: 'uppercase'
                }}>
                  {product.kategori?.nama || 'Rajutan'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>ID Produk: #{product.id}</span>
              </div>

              <h1 style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.25,
                marginBottom: '12px',
                letterSpacing: '-0.5px'
              }}>
                {product.nama}
              </h1>

              {/* Data Terjual Aktual dari Database (Tanpa Bintang) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '18px',
                fontSize: '0.9rem',
                color: '#64748b'
              }}>
                <div>
                  Terjual: <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{actualSold}</strong> barang
                </div>
                <span>&bull;</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} />
                  <span>Dikirim dari Ponorogo</span>
                </div>
              </div>

              {/* Harga Warna HITAM */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Harga Produk
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  <span style={{ fontSize: '1.4rem', marginRight: '4px' }}>Rp</span>
                  {product.harga?.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Deskripsi Produk */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Deskripsi Produk
                </h4>
                <p style={{
                  color: '#475569',
                  lineHeight: 1.7,
                  fontSize: '0.98rem',
                  whiteSpace: 'pre-line'
                }}>
                  {product.deskripsi || 'Produk rajutan tangan istimewa dengan benang wol pilihan dan jahitan presisi tinggi.'}
                </p>
              </div>

              {/* Status Stok */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 18px',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '28px'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Ketersediaan Stok:</span>
                <strong style={{
                  fontSize: '0.95rem',
                  color: product.stok > 0 ? '#15803d' : '#dc2626'
                }}>
                  {product.stok > 0 ? `Tersedia (${product.stok} buah)` : 'Stok Habis'}
                </strong>
              </div>

              {/* Pemilihan Jumlah (Quantity) - Bisa mengetik angka langsung */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '32px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>Kuantitas:</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff'
                }}>
                  <button
                    type="button"
                    onClick={() => setQty(prev => Math.max(1, prev - 1))}
                    style={{
                      padding: '8px 16px',
                      background: '#f1f5f9',
                      border: 'none',
                      cursor: product.stok > 0 && qty > 1 ? 'pointer' : 'not-allowed',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#334155'
                    }}
                    disabled={product.stok <= 0 || qty <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stok || 1}
                    value={product.stok <= 0 ? 0 : qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 1) {
                        setQty(1);
                      } else if (val > product.stok) {
                        setQty(product.stok);
                      } else {
                        setQty(val);
                      }
                    }}
                    onBlur={() => {
                      if (!qty || qty < 1) setQty(1);
                      if (product.stok > 0 && qty > product.stok) setQty(product.stok);
                    }}
                    disabled={product.stok <= 0}
                    style={{
                      width: '64px',
                      padding: '8px 0',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: '#0f172a',
                      border: 'none',
                      outline: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQty(prev => Math.min(product.stok, prev + 1))}
                    style={{
                      padding: '8px 16px',
                      background: '#f1f5f9',
                      border: 'none',
                      cursor: product.stok > 0 && qty < product.stok ? 'pointer' : 'not-allowed',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#334155'
                    }}
                    disabled={product.stok <= 0 || qty >= product.stok}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Subtotal: <strong style={{ color: '#0f172a' }}>Rp {(product.harga * (product.stok <= 0 ? 0 : qty))?.toLocaleString('id-ID')}</strong>
                </span>
                {product.stok > 0 && qty >= product.stok && (
                  <span style={{ fontSize: '0.8rem', color: '#eab308', fontWeight: 600 }}>
                    ⚠️ Kuantitas mencapai batas stok ({product.stok})
                  </span>
                )}
              </div>

              {/* 2 Tombol Transaksi: Tambah Keranjang ATAU Beli Sekarang */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr',
                gap: '16px'
              }}>
                {/* Tombol 1: Tambah ke Keranjang */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    backgroundColor: product.stok > 0 ? '#eff6ff' : '#f1f5f9',
                    color: product.stok > 0 ? '#2563eb' : '#94a3b8',
                    border: product.stok > 0 ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    cursor: product.stok > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: product.stok > 0 ? 1 : 0.6
                  }}
                  disabled={product.stok <= 0 || qty > product.stok}
                >
                  <ShoppingCart size={20} />
                  {product.stok <= 0 ? 'Stok Habis' : '+ Masukkan Keranjang'}
                </button>

                {/* Tombol 2: Beli Sekarang */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    backgroundColor: product.stok > 0 ? '#2563eb' : '#94a3b8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: product.stok > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: product.stok > 0 ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                    transition: 'all 0.2s',
                    opacity: product.stok > 0 ? 1 : 0.6
                  }}
                  disabled={product.stok <= 0 || qty > product.stok}
                >
                  <Zap size={20} />
                  {product.stok <= 0 ? 'Stok Habis' : 'Beli Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
