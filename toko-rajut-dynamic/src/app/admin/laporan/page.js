'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Printer, Download, Eye } from 'lucide-react';

export default function AdminLaporanPage() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [details, setDetails] = useState([]);

  useEffect(() => {
    fetchLaporan();
  }, []);

  async function fetchLaporan() {
    setLoading(true);
    const { data } = await supabase
      .from('transaksi')
      .select('*')
      .order('dibuat_pada', { ascending: false });

    if (data) setTransaksiList(data);
    setLoading(false);
  }

  const handleUpdateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('transaksi')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) fetchLaporan();
  };

  const handleViewDetail = async (trx) => {
    setSelectedTrx(trx);
    const { data } = await supabase
      .from('detail_transaksi')
      .select('*, produk(nama)')
      .eq('transaksi_id', trx.id);

    if (data) setDetails(data);
  };

  const totalSales = transaksiList.reduce((sum, item) => sum + item.total_harga, 0);

  return (
    <div>
      {/* Styles khusus untuk Cetak Laporan (Hanya cetak data laporan, sembunyikan sidebar & tombol) */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .admin-sidebar, .no-print, nav, header {
            display: none !important;
          }
          .admin-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
          }
          .data-table th, .data-table td {
            padding: 8px 12px !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Laporan Penjualan</h1>
          <p style={{ color: '#64748b' }}>Dokumentasi histori transaksi dan rekapitulasi omset toko</p>
        </div>
        <button onClick={() => window.print()} className="btn btn-outline no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={16} /> Cetak Laporan
        </button>
      </div>

      {/* Summary Box */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>REKAPITULASI TOTAL PENJUALAN</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e3a8a' }}>
              Rp {totalSales.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>
            Total Transaksi: <strong>{transaksiList.length} Pesanan</strong>
          </div>
        </div>
      </div>

      {/* Table Laporan Penjualan (Tanpa Kolom Status) */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal &amp; Waktu</th>
              <th>Kode Transaksi</th>
              <th>Nama Pelanggan</th>
              <th>Total Harga</th>
              <th className="no-print">Aksi &amp; Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Memuat laporan transaksi...</td></tr>
            ) : transaksiList.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Belum ada data transaksi.</td></tr>
            ) : (
              transaksiList.map(trx => (
                <tr key={trx.id}>
                  <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(trx.dibuat_pada).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{trx.kode_transaksi}</td>
                  <td>
                    <div>{trx.nama_pelanggan}</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{trx.telepon_pelanggan}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Rp {trx.total_harga?.toLocaleString('id-ID')}</td>
                  <td className="no-print">
                    <button onClick={() => handleViewDetail(trx)} className="btn btn-outline btn-sm">
                      <Eye size={14} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Transaksi */}
      {selectedTrx && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Detail Transaksi: {selectedTrx.kode_transaksi}</h3>
            
            <div style={{ fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.6 }}>
              <p><strong>Nama:</strong> {selectedTrx.nama_pelanggan}</p>
              <p><strong>Email:</strong> {selectedTrx.email_pelanggan}</p>
              <p><strong>Telepon:</strong> {selectedTrx.telepon_pelanggan}</p>
              <p><strong>Alamat:</strong> {selectedTrx.alamat_pengiriman}</p>
            </div>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Item Pembelian:</h4>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
              {details.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span>{d.produk?.nama || 'Produk'} x{d.jumlah}</span>
                  <span>Rp {d.subtotal?.toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total:</span>
                <span style={{ color: '#2563eb' }}>Rp {selectedTrx.total_harga?.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button onClick={() => setSelectedTrx(null)} className="btn btn-primary btn-block">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
