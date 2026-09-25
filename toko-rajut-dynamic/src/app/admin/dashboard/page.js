'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { CreditCard, ShoppingBag, AlertTriangle, TrendingUp, Package, ArrowUpRight, Layers, Tag, PieChart as PieIcon } from 'lucide-react';
import AdminPieChart from '@/components/AdminPieChart';
import { getPaymentMethod } from '@/lib/transactionHelper';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    mostPaymentMethod: '-',
    mostPaymentCount: 0,
    qrisCount: 0,
    transferCount: 0
  });

  const [recentTrx, setRecentTrx] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [categorySalesData, setCategorySalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    try {
      // Fetch produk, kategori, transaksi, dan detail_transaksi secara paralel
      const [prodRes, catRes, trxRes, detailRes] = await Promise.all([
        supabase.from('produk').select('*').order('id', { ascending: true }),
        supabase.from('kategori').select('*').order('id', { ascending: true }),
        supabase.from('transaksi').select('*').order('dibuat_pada', { ascending: false }),
        supabase.from('detail_transaksi').select('produk_id, jumlah, subtotal')
      ]);

      const prodData = prodRes.data || [];
      const catData = catRes.data || [];
      const trxData = trxRes.data || [];
      const detailData = detailRes.data || [];

      // 1. Stats & Low Stock
      const lowStock = prodData.filter(p => p.stok <= 5);
      const totalOmset = trxData.reduce((sum, item) => sum + (item.total_harga || 0), 0);

      // Hitung Metode Pembayaran Terbanyak (QRIS vs Transfer Bank)
      let qris = 0;
      let transfer = 0;
      trxData.forEach(item => {
        const m = getPaymentMethod(item);
        if (m === 'QRIS') qris++;
        else transfer++;
      });

      let mostMethod = '-';
      let mostCount = 0;
      if (qris > transfer) {
        mostMethod = 'QRIS';
        mostCount = qris;
      } else if (transfer > qris) {
        mostMethod = 'Transfer Bank';
        mostCount = transfer;
      } else if (trxData.length > 0) {
        mostMethod = 'QRIS / Transfer';
        mostCount = qris;
      }

      setLowStockProducts(lowStock);
      setRecentTrx(trxData.slice(0, 5));
      setStats({
        totalSales: totalOmset,
        totalOrders: trxData.length,
        totalProducts: prodData.length,
        lowStockCount: lowStock.length,
        mostPaymentMethod: mostMethod,
        mostPaymentCount: mostCount,
        qrisCount: qris,
        transferCount: transfer
      });

      // 2. Map Penjualan Per Produk
      const productSalesMap = {};
      detailData.forEach(item => {
        if (item.produk_id) {
          productSalesMap[item.produk_id] = (productSalesMap[item.produk_id] || 0) + (item.jumlah || 0);
        }
      });

      // Format Data Produk Terlaris (Tampilkan SEMUA produk yang terdaftar di database)
      const formattedProdSales = prodData.map(prod => ({
        id: prod.id,
        label: prod.nama,
        value: productSalesMap[prod.id] || 0,
        stok: prod.stok
      })).sort((a, b) => b.value - a.value);

      setProductSalesData(formattedProdSales);

      // 3. Map Penjualan Per Kategori
      // Hubungkan tiap kategori dengan total penjualan produk di dalamnya
      const formattedCatSales = catData.map(cat => {
        const prodIdsInCat = prodData.filter(p => p.kategori_id === cat.id).map(p => p.id);
        const catTotalSold = prodIdsInCat.reduce((sum, prodId) => {
          return sum + (productSalesMap[prodId] || 0);
        }, 0);

        return {
          id: cat.id,
          label: cat.nama,
          value: catTotalSold
        };
      }).sort((a, b) => b.value - a.value);

      setCategorySalesData(formattedCatSales);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>
          Dashboard Overview
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
          Ringkasan performa penjualan, monitoring stok, dan statistik distribusi katalog Toko Rajut
        </p>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Pembayaran Terbanyak (QRIS / Transfer Bank) */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.3px' }}>PEMBAYARAN TERBANYAK</span>
            <div style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '6px' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            {stats.mostPaymentMethod}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
            {stats.mostPaymentCount} pesanan ({stats.qrisCount} QRIS &bull; {stats.transferCount} Transfer)
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TOTAL TRANSAKSI</span>
            <div style={{ padding: '8px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '6px' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{stats.totalOrders}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'block' }}>Pesanan Masuk</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>JUMLAH PRODUK</span>
            <div style={{ padding: '8px', backgroundColor: '#f8fafc', color: '#475569', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{stats.totalProducts}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'block' }}>Katalog Terdaftar</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>PERINGATAN STOK</span>
            <div style={{ padding: '8px', backgroundColor: '#fffbe6', color: '#b45309', borderRadius: '6px' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.lowStockCount > 0 ? '#b45309' : '#0f172a' }}>
            {stats.lowStockCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '6px', display: 'block' }}>Stok ≤ 5 unit perlu ditambah</span>
        </div>
      </div>

      {/* Middle Section: Transaksi Terbaru & Perlu Tambah Stok */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', marginBottom: '36px' }}>
        {/* Recent Transactions */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Transaksi Terbaru</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>5 riwayat transaksi terakhir yang masuk</p>
            </div>
            <Link href="/admin/laporan" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Lihat Laporan <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kode</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Metode Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {recentTrx.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                      Belum ada transaksi recorded.
                    </td>
                  </tr>
                ) : (
                  recentTrx.map(trx => {
                    const method = getPaymentMethod(trx);
                    return (
                      <tr key={trx.id}>
                        <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {trx.dibuat_pada ? new Date(trx.dibuat_pada).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{trx.kode_transaksi}</td>
                        <td>{trx.nama_pelanggan}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>Rp {trx.total_harga?.toLocaleString('id-ID')}</td>
                        <td style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.88rem' }}>
                          {method}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert List */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Perlu Tambah Stok</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Stok produk yang menipis</p>
          {lowStockProducts.length === 0 ? (
            <p style={{ color: '#166534', fontSize: '0.9rem', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              ✓ Semua stok produk berada di batas aman.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {lowStockProducts.map(prod => (
                <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#fffbe6', borderRadius: '8px', border: '1px solid #fef08a' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{prod.nama}</div>
                    <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>Sisa stok: {prod.stok} unit</span>
                  </div>
                  <Link href={`/admin/produk?edit=${prod.id}`} className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: 2 Kolom Diagram Pie (Produk Terlaris & Kategori Terlaris) */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <PieIcon size={20} style={{ color: '#2563eb' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Distribusi & Analisis Penjualan
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px'
        }}>
          {/* Pie Chart Kiri: Produk Terlaris */}
          <AdminPieChart
            title="Produk Terlaris"
            subtitle="Distribusi volume penjualan per produk katalog"
            icon={Package}
            data={productSalesData}
            unitLabel="terjual"
            emptyMessage="Belum ada riwayat penjualan produk"
          />

          {/* Pie Chart Kanan: Kategori Terlaris */}
          <AdminPieChart
            title="Kategori Terlaris"
            subtitle="Distribusi volume penjualan per kategori rajutan"
            icon={Layers}
            data={categorySalesData}
            unitLabel="terjual"
            emptyMessage="Belum ada riwayat penjualan kategori"
          />
        </div>
      </div>
    </div>
  );
}

