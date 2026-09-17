'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Package, ArrowUpRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0
  });

  const [recentTrx, setRecentTrx] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    // 1. Fetch Produk Count & Low Stock
    const { data: prodData } = await supabase.from('produk').select('*');
    if (prodData) {
      const lowStock = prodData.filter(p => p.stok <= 5);
      setLowStockProducts(lowStock);
      setStats(prev => ({
        ...prev,
        totalProducts: prodData.length,
        lowStockCount: lowStock.length
      }));
    }

    // 2. Fetch Transaksi & Sales
    const { data: trxData } = await supabase
      .from('transaksi')
      .select('*')
      .order('dibuat_pada', { ascending: false });

    if (trxData) {
      const totalOmset = trxData.reduce((sum, item) => sum + item.total_harga, 0);
      setRecentTrx(trxData.slice(0, 5));
      setStats(prev => ({
        ...prev,
        totalSales: totalOmset,
        totalOrders: trxData.length
      }));
    }

    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem' }}>Dashboard Overview</h1>
        <p style={{ color: '#64748b' }}>Ringkasan performa penjualan dan stok barang Toko Rajut</p>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TOTAL OMSET</span>
            <div style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '6px' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Rp {stats.totalSales.toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <TrendingUp size={12} /> Terhubung Supabase
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TOTAL TRANSAKSI</span>
            <div style={{ padding: '8px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '6px' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalOrders}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'block' }}>Pesanan masuk</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>JUMLAH PRODUK</span>
            <div style={{ padding: '8px', backgroundColor: '#f8fafc', color: '#475569', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalProducts}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'block' }}>Katalog aktif</span>
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
          <span style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '6px', display: 'block' }}>Stok ≤ 5 unit</span>
        </div>
      </div>

      {/* Main Dashboard Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
        {/* Recent Transactions */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Transaksi Terbaru</h3>
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
                  <th>Status</th>
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
                  recentTrx.map(trx => (
                    <tr key={trx.id}>
                      <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {trx.dibuat_pada ? new Date(trx.dibuat_pada).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{trx.kode_transaksi}</td>
                      <td>{trx.nama_pelanggan}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>Rp {trx.total_harga?.toLocaleString('id-ID')}</td>
                      <td>
                        <span className="badge-status badge-success">Berhasil Bayar</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert List */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Perlu Tambah Stok</h3>
          {lowStockProducts.length === 0 ? (
            <p style={{ color: '#166534', fontSize: '0.9rem', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '6px' }}>
              ✓ Semua stok produk berada di batas aman.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lowStockProducts.map(prod => (
                <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#fffbe6', borderRadius: '6px', border: '1px solid #fef08a' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{prod.nama}</div>
                    <span style={{ fontSize: '0.8rem', color: '#b45309' }}>Sisa stok: {prod.stok}</span>
                  </div>
                  <Link href="/admin/produk" className="btn btn-outline btn-sm">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
