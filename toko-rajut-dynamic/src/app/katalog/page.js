'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, MapPin } from 'lucide-react';

export default function KatalogPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesMap, setSalesMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // 1. Ambil dari cache lokal agar katalog muncul instan (0 ms)
    const cached = sessionStorage.getItem('rajajutan_katalog_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.prod && parsed.prod.length > 0) {
          setCategories(parsed.cat || []);
          setProducts(parsed.prod);
          setSalesMap(parsed.sales || {});
          setLoading(false);
        }
      } catch (e) {}
    }

    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 2. Jalankan semua query database secara paralel (bersamaan)
      const [catRes, prodRes, salesRes] = await Promise.all([
        supabase.from('kategori').select('id, nama, slug'),
        supabase.from('produk').select('id, nama, harga, stok, deskripsi, gambar_url, kategori_id, kategori(nama, slug)').order('id', { ascending: true }),
        supabase.from('detail_transaksi').select('produk_id, jumlah')
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);

      const map = {};
      if (salesRes.data) {
        salesRes.data.forEach(item => {
          map[item.produk_id] = (map[item.produk_id] || 0) + item.jumlah;
        });
        setSalesMap(map);
      }

      // Simpan ke cache untuk navigasi berikutnya
      if (catRes.data && prodRes.data) {
        sessionStorage.setItem('rajajutan_katalog_cache', JSON.stringify({
          cat: catRes.data,
          prod: prodRes.data,
          sales: map
        }));
      }
    } catch (err) {
      console.error('Error fetching katalog data:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(search.toLowerCase()) ||
                          (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                            item.kategori_id === parseInt(selectedCategory) ||
                            item.kategori?.slug === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main style={{ padding: '36px 0 60px', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header Katalog Bersih */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <span style={{
              color: '#2563eb',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              display: 'block',
              marginBottom: '4px'
            }}>
              Koleksi Resmi Rajajutan Arkana
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Katalog Produk Kerajinan Rajut
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Pilihan karya rajutan buatan tangan dengan mutu benang wol terbaik.
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Cari sweater, tas, boneka rajut..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: '42px',
                paddingRight: '16px',
                height: '46px',
                borderRadius: '10px',
                borderColor: '#cbd5e1',
                width: '100%',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>
        </div>

        {/* Filter Kategori Tab (Hanya tampilkan kategori yang memiliki produk) */}
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '28px',
          scrollbarWidth: 'none'
        }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              border: selectedCategory === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: selectedCategory === 'all' ? '#2563eb' : '#ffffff',
              color: selectedCategory === 'all' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            Semua Kategori
          </button>
          {categories
            .filter(cat => products.some(p => p.kategori_id === cat.id || p.kategori?.slug === cat.slug))
            .map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  border: selectedCategory === cat.id.toString() ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: selectedCategory === cat.id.toString() ? '#2563eb' : '#ffffff',
                  color: selectedCategory === cat.id.toString() ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {cat.nama}
              </button>
            ))}
        </div>

        {/* Grid Produk */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧶</div>
            <p>Memuat produk rajutan...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#0f172a' }}>Produk Tidak Ditemukan</h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
              Tidak ada produk rajutan yang cocok dengan kata kunci &quot;{search}&quot;. Coba gunakan kata kunci lainnya.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '18px'
          }}>
            {filteredProducts.map(item => {
              const actualSold = salesMap[item.id] || 0;

              return (
                <Link
                  key={item.id}
                  href={`/katalog/${item.id}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                  className="shopee-card"
                >
                  <div>
                    {/* Foto Produk Square 1:1 (Tanpa Badge Star+) */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '100%',
                      backgroundColor: '#f1f5f9',
                      overflow: 'hidden'
                    }}>
                      {item.gambar_url ? (
                        <img
                          src={item.gambar_url}
                          alt={item.nama}
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
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem'
                        }}>
                          🧶
                        </div>
                      )}

                      {item.stok <= 0 && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(15, 23, 42, 0.65)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}>
                          Stok Habis
                        </div>
                      )}
                    </div>

                    {/* Keterangan Produk */}
                    <div style={{ padding: '12px 14px 8px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#2563eb',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {item.kategori?.nama || 'Rajutan'}
                      </span>

                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        margin: '4px 0 8px',
                        lineHeight: 1.4,
                        height: '40px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.nama}
                      </h3>

                      {/* Harga Warna HITAM */}
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, marginRight: '2px' }}>Rp</span>
                        {item.harga?.toLocaleString('id-ID')}
                      </div>

                      {/* Data Pembelian Aktual dari Database (Tanpa Bintang) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: '#64748b',
                        marginBottom: '6px'
                      }}>
                        <span>Terjual: <strong style={{ color: '#0f172a' }}>{actualSold}</strong> barang</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Kartu (Lokasi & Sisa Stok) */}
                  <div style={{
                    padding: '8px 14px 12px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      <span>Ponorogo</span>
                    </div>
                    <span style={{ color: item.stok > 0 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                      {item.stok > 0 ? `Sisa ${item.stok}` : 'Habis'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
