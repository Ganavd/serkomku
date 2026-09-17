'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek cache lokal agar halaman muncul secepat kilat (0 ms)
    const cached = sessionStorage.getItem('rajajutan_featured_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setProducts(parsed);
          setLoading(false);
        }
      } catch (e) {}
    }

    fetchFeatured();
  }, []);

  async function fetchFeatured() {
    try {
      const { data, error } = await supabase
        .from('produk')
        .select('id, nama, harga, deskripsi, gambar_url, kategori(nama)')
        .limit(4);

      if (!error && data) {
        setProducts(data);
        sessionStorage.setItem('rajajutan_featured_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {/* Hero Display Utama (Muncul Instan Tanpa Menunggu Database) */}
      <section style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '36px 0 44px'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        }}>
          {/* Baris Atas: Deskripsi Teks & Logo Resmi */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '40px',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                marginBottom: '16px',
                lineHeight: 1.15,
                color: '#0f172a',
                letterSpacing: '-0.8px'
              }}>
                Kehangatan &amp; Estetika Rajut Buatan Tangan
              </h1>
              <p style={{
                color: '#475569',
                fontSize: '1.08rem',
                lineHeight: 1.65,
                marginBottom: '28px',
                maxWidth: '540px'
              }}>
                Temukan berbagai produk kerajinan rajut berkualitas dari <br />
                <strong>Rajajutan Arkana</strong> mulai dari sweater wol, syal eksklusif, tas rajut modern, hingga boneka aksesoris lucu buatan tangan.
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link href="/katalog" className="btn btn-primary" style={{ padding: '12px 26px', fontSize: '0.98rem' }}>
                  Lihat Katalog Produk <ArrowRight size={18} />
                </Link>
                <Link href="/admin/dashboard" className="btn btn-outline" style={{ padding: '12px 22px', fontSize: '0.98rem' }}>
                  Dashboard Admin
                </Link>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'relative',
                borderRadius: '20px',
                padding: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.18), 0 6px 16px -4px rgba(15, 23, 42, 0.08)',
                maxWidth: '360px',
                width: '100%'
              }}>
                <img 
                  src="/Logo-Rajajutan.png" 
                  alt="Logo Rajajutan Arkana" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '14px',
                    display: 'block',
                    objectFit: 'cover'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Baris Bawah (Tetap di Dalam Tampilan Atas): 3 Kartu Keunggulan */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <Sparkles className="text-blue-600" size={32} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>100% Buatan Tangan</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Dikerjakan dengan wol premium &amp; ketelitian tinggi</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <ShieldCheck className="text-blue-600" size={32} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>Kualitas Terjamin</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Bahan lembut, awet, dan nyaman dipakai harian</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <Truck className="text-blue-600" size={32} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>Pengiriman Aman</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Pengemasan rapi dan siap kirim ke seluruh Nusantara</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian Bawah: Produk Unggulan (Baru terlihat saat scroll) */}
      <section style={{ padding: '80px 0', backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '8px'
            }}>
              Pilihan Terbaik
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Produk Unggulan
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Pilihan karya rajut paling diminati minggu ini</p>
          </div>

          {loading && products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              Memuat produk unggulan...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '28px'
            }}>
              {products.map(item => (
                <Link 
                  key={item.id} 
                  href={`/katalog/${item.id}`}
                  className="card" 
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div>
                    <div style={{
                      width: '100%',
                      height: '210px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '10px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {item.gambar_url ? (
                        <img src={item.gambar_url} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '3rem' }}>🧶</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.kategori?.nama || 'Koleksi Rajut'}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '6px 0 8px', color: '#0f172a' }}>{item.nama}</h3>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '14px', height: '42px', overflow: 'hidden', lineHeight: 1.5 }}>
                      {item.deskripsi}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>
                      Rp {item.harga?.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
                      Detail &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
