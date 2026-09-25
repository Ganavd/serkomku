'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Printer, Eye, Receipt, ArrowLeft, Share2, RotateCcw } from 'lucide-react';
import ReceiptView from '@/components/ReceiptView';
import ShareReceiptModal from '@/components/ShareReceiptModal';
import MiniDatePicker from '@/components/MiniDatePicker';
import Pagination from '@/components/Pagination';
import { getPaymentMethod } from '@/lib/transactionHelper';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function AdminLaporanPage() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter Rentang Tanggal
  const [startDate, setStartDate] = useState(null); // 'YYYY-MM-DD'
  const [endDate, setEndDate] = useState(null); // 'YYYY-MM-DD'
  const [appliedFilter, setAppliedFilter] = useState(null); // { start, end }
  const [openPicker, setOpenPicker] = useState(null); // 'start' | 'end' | null

  // State Jumlah Tampil & Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk alur modal
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [details, setDetails] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  const handleViewDetail = async (trx) => {
    setSelectedTrx(trx);
    setShowReceiptModal(false);
    setShowShareModal(false);

    const { data } = await supabase
      .from('detail_transaksi')
      .select('*, produk(nama)')
      .eq('transaksi_id', trx.id);

    if (data) setDetails(data);
  };

  // Format tanggal Indonesia lengkap dengan nama bulan
  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const d = parseInt(parts[2]);
      return `${d} ${MONTH_NAMES[m]} ${y}`;
    }
    return dateStr;
  };

  // Format tanggal & waktu lengkap dengan nama bulan penuh
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  // Terapkan filter tanggal saat tombol "Tampilkan" diklik
  const handleApplyFilter = () => {
    if (startDate || endDate) {
      setAppliedFilter({
        start: startDate,
        end: endDate
      });
    } else {
      setAppliedFilter(null);
    }
    setCurrentPage(1);
  };

  // Bersihkan semua filter rentang tanggal
  const handleClearAllFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setAppliedFilter(null);
    setOpenPicker(null);
    setCurrentPage(1);
  };

  // Filter list transaksi berdasarkan rentang tanggal
  const filteredTransaksiList = transaksiList.filter(trx => {
    if (!appliedFilter || (!appliedFilter.start && !appliedFilter.end)) return true;

    const trxDate = new Date(trx.dibuat_pada);

    if (appliedFilter.start) {
      const start = new Date(`${appliedFilter.start}T00:00:00`);
      if (trxDate < start) return false;
    }

    if (appliedFilter.end) {
      const end = new Date(`${appliedFilter.end}T23:59:59`);
      if (trxDate > end) return false;
    }

    return true;
  });

  // Perhitungan Pagination (View Per Halaman, bukan memotong data)
  const totalItems = filteredTransaksiList.length;
  const itemsPerPage = pageSize === 'all' ? totalItems : parseInt(pageSize, 10);
  const totalPages = pageSize === 'all' || itemsPerPage === 0 ? 1 : Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === 'all' ? 0 : (safePage - 1) * itemsPerPage;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(startIndex + itemsPerPage, totalItems);
  const displayedTransaksiList = filteredTransaksiList.slice(startIndex, endIndex);

  // Perhitungan Rekapitulasi
  const totalSales = filteredTransaksiList.reduce((sum, item) => sum + (item.total_harga || 0), 0);
  const totalOrders = filteredTransaksiList.length;

  // Judul Dinamis Laporan (Menyesuaikan Filter Rentang Tanggal)
  const getHeaderTitle = () => {
    if (appliedFilter?.start && appliedFilter?.end) {
      return `Laporan Penjualan (${formatDateIndo(appliedFilter.start)} - ${formatDateIndo(appliedFilter.end)})`;
    }
    if (appliedFilter?.start) {
      return `Laporan Penjualan (Mulai ${formatDateIndo(appliedFilter.start)})`;
    }
    if (appliedFilter?.end) {
      return `Laporan Penjualan (Sampai ${formatDateIndo(appliedFilter.end)})`;
    }
    return 'Laporan Penjualan';
  };

  // Teks Tanggal Periode untuk Cetak
  const getPeriodeDateRangeText = () => {
    if (appliedFilter?.start && appliedFilter?.end) {
      return `${formatDateIndo(appliedFilter.start)} - ${formatDateIndo(appliedFilter.end)}`;
    }
    if (appliedFilter?.start) {
      return `${formatDateIndo(appliedFilter.start)} - Seterusnya`;
    }
    if (appliedFilter?.end) {
      return `Sampai ${formatDateIndo(appliedFilter.end)}`;
    }
    return 'Semua Periode Transaksi';
  };

  return (
    <div>
      {/* Styles Khusus Print & Screen */}
      <style jsx global>{`
        @page {
          size: portrait;
          margin: 0; /* Menghilangkan URL dan header/footer default browser */
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            padding: 12mm 15mm !important; /* Padding dokumen cetak yang rapi */
          }
          .admin-sidebar, .no-print, nav, header, footer, .btn, select, input {
            display: none !important;
          }
          .admin-content, main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-only {
            display: block !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
            table-layout: fixed !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #334155 !important;
            padding: 6px 8px !important;
            font-size: 9.5pt !important;
            color: #000000 !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
          }
        }
      `}</style>

      {/* =========================================================================
          1. HEADER CETAK RESMI (Hanya Muncul Saat Print / KOP SURAT BERSIH)
          ========================================================================= */}
      <div className="print-only" style={{ marginBottom: '16px', position: 'relative' }}>
        {/* Logo Toko di Pojok KIRI */}
        <div style={{ position: 'absolute', left: 0, top: '2px', textAlign: 'left' }}>
          <img 
            src="/Logo-Rajajutan.png" 
            alt="Logo Toko" 
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Kop Surat Tengah */}
        <div style={{ textAlign: 'center', paddingRight: '60px', paddingLeft: '60px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 2px', color: '#0f172a', letterSpacing: '0.5px' }}>
            RAJAJUTAN ARKANA
          </h2>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 2px', color: '#0f172a' }}>
            Laporan Penjualan
          </h3>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
            {getPeriodeDateRangeText()}
          </div>

          {/* Info Alamat & Kontak Toko (Dapat diaktifkan kembali jika alamat resmi sudah ada)
          <p style={{ fontSize: '0.82rem', color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
            Pusat Kerajinan Rajut Berkualitas &mdash; Jl. Raya Kerajinan No. 45, Ponorogo, Jawa Timur
          </p>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
            Telp / WA: +62 812-3456-7890 | Email: cs@rajajutanarkana.com
          </p>
          */}
        </div>

        {/* Garis Pembatas Kop Surat */}
        <div style={{ borderBottom: '2px solid #0f172a', marginTop: '12px', marginBottom: '14px' }} />

        {/* Rekapitulasi Cetak (Total Omset & Total Transaksi Saja) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #cbd5e1',
          padding: '8px 16px',
          backgroundColor: '#f8fafc',
          marginBottom: '14px',
          fontSize: '0.88rem'
        }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>REKAPITULASI TOTAL PENJUALAN</span>
            <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>Rp {totalSales.toLocaleString('id-ID')}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Total Transaksi:</span>
            <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{totalOrders} Pesanan</strong>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. HEADER SCREEN VIEW (Judul Dinamis Laporan Sesuai Filter)
          ========================================================================= */}
      <div className="no-print" style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>
          {getHeaderTitle()}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
          Rekapitulasi dan riwayat transaksi penjualan toko
        </p>
      </div>

      {/* =========================================================================
          3. REKAPITULASI DI ATAS (Single Box Rekapitulasi Sesuai Format)
          ========================================================================= */}
      <div className="card no-print" style={{
        padding: '20px 24px',
        marginBottom: '20px',
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>REKAPITULASI TOTAL PENJUALAN</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
              Rp {totalSales.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ fontSize: '0.92rem', color: '#1e40af' }}>
            Total Transaksi: <strong style={{ fontSize: '1.1rem', color: '#1e3a8a' }}>{totalOrders} Pesanan</strong>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. GARIS PEMBATAS (-----)
          ========================================================================= */}
      <hr className="no-print" style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '22px 0 24px' }} />

      {/* =========================================================================
          5. FILTER TANGGAL TANPA BOX & TOMBOL CETAK DI SEBELAH TAMPIL (Sipkesmas Style)
          ========================================================================= */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '28px'
      }}>
        {/* Kiri: Filter Tanggal + Tombol Tampilkan jika 2 Filter Terpenuhi */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Mulai Tanggal */}
          <MiniDatePicker
            value={startDate}
            onChange={(val) => setStartDate(val)}
            onSelectAndNext={() => setOpenPicker('end')}
            isOpen={openPicker === 'start'}
            onToggleOpen={(isOpen) => setOpenPicker(isOpen ? 'start' : null)}
            placeholder="Mulai Tanggal"
          />

          <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>-</span>

          {/* Sampai Tanggal */}
          <MiniDatePicker
            value={endDate}
            onChange={(val) => setEndDate(val)}
            onSelectAndNext={() => setOpenPicker(null)}
            isOpen={openPicker === 'end'}
            onToggleOpen={(isOpen) => setOpenPicker(isOpen ? 'end' : null)}
            placeholder="Sampai Tanggal"
          />

          {/* Tombol Tampilkan HANYA MUNCUL JIKA 2 FILTER TERPENUHI (Mulai Tanggal & Sampai Tanggal) */}
          {startDate && endDate && (
            <button
              type="button"
              onClick={handleApplyFilter}
              className="btn btn-outline"
              style={{
                padding: '10px 20px',
                minHeight: '40px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                border: '1.5px solid #2563eb',
                color: '#2563eb',
                animation: 'fadeIn 0.15s ease-out',
                cursor: 'pointer'
              }}
            >
              Tampilkan
            </button>
          )}

          {/* Tombol Reset Filter jika aktif atau tanggal terisi */}
          {(startDate || endDate || appliedFilter) && (
            <button
              type="button"
              onClick={handleClearAllFilter}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 10px',
                minHeight: '42px'
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>

        {/* Kanan: Tombol Cetak diposisikan di dekat Tampil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Tombol Cetak Laporan */}
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              minHeight: '42px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> Cetak
          </button>

          {/* Dropdown Tampil (3, 5, 10, 25, 50, Semua) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Tampil:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '10px 14px',
                minHeight: '42px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.88rem',
                color: '#0f172a',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. TABEL SIPKESMAS (Border Grid Tipis, Sederhana & Icon Aksi Minimalis)
          ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
        width: '100%'
      }}>
        <table className="print-table" style={{
          width: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          fontSize: '0.88rem',
          color: '#334155',
          textAlign: 'center'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '14px 6px', textAlign: 'center', fontWeight: 600, width: '6%', borderRight: '1px solid #e2e8f0' }}>No</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '18%', borderRight: '1px solid #e2e8f0' }}>Kode Transaksi</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '18%', borderRight: '1px solid #e2e8f0' }}>Tanggal</th>
              <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 600, width: '22%', borderRight: '1px solid #e2e8f0' }}>Nama Pelanggan</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '14%', borderRight: '1px solid #e2e8f0' }}>Metode</th>
              <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 600, width: '14%', borderRight: '1px solid #e2e8f0' }}>Total Harga</th>
              <th className="no-print" style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '8%' }}>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Memuat laporan transaksi...
                </td>
              </tr>
            ) : displayedTransaksiList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Tidak ada data transaksi pada rentang yang dipilih.
                </td>
              </tr>
            ) : (
              displayedTransaksiList.map((trx, index) => {
                const noUrut = startIndex + index + 1;
                const method = getPaymentMethod(trx);
                const cleanKodeNumber = trx.kode_transaksi ? trx.kode_transaksi.replace(/^TRX-?/i, '') : '-';

                return (
                  <tr
                    key={trx.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    {/* No (Center) */}
                    <td style={{ padding: '12px 4px', textAlign: 'center', color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                      {noUrut}
                    </td>

                    {/* Kode Transaksi (Center: TRX - di atas, angka di bawah) */}
                    <td style={{ padding: '10px 6px', textAlign: 'center', color: '#0f172a', fontWeight: 600, borderRight: '1px solid #e2e8f0', lineHeight: 1.25 }}>
                      <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>TRX-</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                        {cleanKodeNumber}
                      </div>
                    </td>

                    {/* Tanggal (Center) */}
                    <td style={{ padding: '12px 6px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem', borderRight: '1px solid #e2e8f0' }}>
                      {formatDateTime(trx.dibuat_pada)}
                    </td>

                    {/* Nama Pelanggan (Center) */}
                    <td style={{ padding: '12px 8px', textAlign: 'center', color: '#0f172a', borderRight: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                      <div style={{ fontWeight: 500 }}>{trx.nama_pelanggan || '-'}</div>
                      {trx.telepon_pelanggan && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{trx.telepon_pelanggan}</div>
                      )}
                    </td>

                    {/* Metode Bayar (Center - Teks Biasa Tanpa Box Styles) */}
                    <td style={{ padding: '12px 6px', textAlign: 'center', color: '#0f172a', fontWeight: 500, fontSize: '0.85rem', borderRight: '1px solid #e2e8f0' }}>
                      {method}
                    </td>

                    {/* Total Harga (Center) */}
                    <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                      Rp {trx.total_harga?.toLocaleString('id-ID')}
                    </td>

                    {/* Aksi: Icon Mata Simple Sesuai Sipkesmas */}
                    <td className="no-print" style={{ padding: '12px 6px', textAlign: 'center' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }} className="has-tooltip">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(trx)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#475569',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'color 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                        >
                          <Eye size={18} />
                        </button>
                        <span className="tooltip-top">Lihat Detail</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          PAGINATION CONTROLS (Halaman 1..N, View Per Kelipatan Tanpa Memotong Data)
          ========================================================================= */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* =========================================================================
          8. MODAL DETAIL TRANSAKSI (Sipkesmas Popup Style - Bersih Tanpa Tombol Tutup Atas)
          ========================================================================= */}
      {selectedTrx && !showReceiptModal && (
        <div 
          onClick={() => setSelectedTrx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card" 
            style={{ width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}
          >
            {/* Header Modal Bersih Tanpa Icon Tutup Atas */}
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Detail Transaksi
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Kode: <strong>{selectedTrx.kode_transaksi}</strong> &bull; {formatDateTime(selectedTrx.dibuat_pada)}
              </div>
            </div>

            {/* Rincian Pelanggan */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              fontSize: '0.88rem',
              color: '#334155'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Nama</span>
                <span style={{ color: '#1e293b' }}>: {selectedTrx.nama_pelanggan || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Email</span>
                <span style={{ color: '#1e293b' }}>: {selectedTrx.email_pelanggan || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Telepon</span>
                <span style={{ color: '#1e293b' }}>: {selectedTrx.telepon_pelanggan || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Alamat</span>
                <span style={{ color: '#1e293b' }}>: {selectedTrx.alamat_pengiriman || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Metode Bayar</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>: {getPaymentMethod(selectedTrx)}</span>
              </div>
            </div>

            {/* Header Item Pembelian */}
            <div style={{ textAlign: 'center', margin: '16px 0 14px' }}>
              <div style={{ borderTop: '1.5px dashed #cbd5e1', marginBottom: '8px' }} />
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}>
                Item Pembelian
              </div>
              <div style={{ borderBottom: '1.5px dashed #cbd5e1', marginTop: '8px' }} />
            </div>

            {/* List Item Pembelian */}
            <div style={{ marginBottom: '20px' }}>
              {details.map((d, idx) => {
                const isMultiple = (d.jumlah || 1) > 1;
                const hargaSatuan = d.harga_satuan || (d.subtotal / (d.jumlah || 1)) || 0;

                return (
                  <div
                    key={d.id || idx}
                    style={{
                      marginBottom: isMultiple ? '12px' : '8px',
                      paddingBottom: isMultiple ? '4px' : '0'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'baseline',
                      gap: '8px',
                      fontSize: '0.86rem',
                      color: '#0f172a'
                    }}>
                      <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>
                        {d.produk?.nama || 'Produk'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', padding: '0 4px' }}>
                        x{d.jumlah}
                      </span>
                      <span style={{ fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>
                        Rp {d.subtotal?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isMultiple && (
                      <div style={{
                        fontSize: '0.76rem',
                        color: '#64748b',
                        marginTop: '2px',
                        paddingLeft: '2px'
                      }}>
                        x{d.jumlah} Rp {hargaSatuan?.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{
                borderTop: '1.5px solid #0f172a',
                paddingTop: '10px',
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 800,
                fontSize: '0.98rem',
                color: '#0f172a'
              }}>
                <span>Total:</span>
                <span style={{ color: '#2563eb', fontSize: '1.15rem' }}>
                  Rp {selectedTrx.total_harga?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Tombol Aksi Bawah: Tutup & Lihat Struk */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="btn btn-outline"
                style={{ padding: '10px 20px', minWidth: '110px' }}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <Receipt size={16} /> Lihat Struk Transaksi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          9. MODAL STRUK TRANSAKSI
          ========================================================================= */}
      {selectedTrx && showReceiptModal && (
        <div 
          onClick={() => setShowReceiptModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', maxHeight: '95vh', overflowY: 'auto' }}
          >
            
            {/* Tampilan Struk */}
            <ReceiptView 
              transaksi={selectedTrx} 
              details={details} 
              receiptId="admin-receipt-print"
            />

            {/* Tombol Bawah Struk: Kembali & Bagikan */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '16px'
            }}>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="btn btn-outline"
                style={{
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
              >
                <ArrowLeft size={16} /> Kembali
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}
              >
                <Share2 size={16} /> Bagikan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          10. MODAL BAGIKAN STRUK DARI ADMIN LAPORAN
          ========================================================================= */}
      {selectedTrx && showShareModal && (
        <ShareReceiptModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          transaksi={selectedTrx}
          receiptElementId="admin-receipt-print"
          onSuccessRedirect={() => {
            setShowShareModal(false);
            setShowReceiptModal(false);
          }}
        />
      )}

    </div>
  );
}
