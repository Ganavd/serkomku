'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit3, Trash2, X, Upload, AlertCircle, Package, RotateCcw, ArrowLeft } from 'lucide-react';
import { parseProduct, formatProductDescription } from '@/lib/productHelper';
import Pagination from '@/components/Pagination';

export default function AdminProdukPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesMap, setSalesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // State Filter Per Kolom (Sipkesmas Style)
  const [filterNama, setFilterNama] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterHarga, setFilterHarga] = useState('');
  const [filterTerjual, setFilterTerjual] = useState('');
  const [filterStok, setFilterStok] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'aktif' | 'nonaktif'
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    kategori_id: '',
    harga: '',
    stok: '',
    deskripsi: '',
    gambar_url: ''
  });

  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Modal Delete & Warning states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [catRes, prodRes, salesRes] = await Promise.all([
      supabase.from('kategori').select('*').order('id', { ascending: true }),
      supabase.from('produk').select('*, kategori(nama)').order('id', { ascending: false }),
      supabase.from('detail_transaksi').select('produk_id, jumlah')
    ]);

    if (catRes.data) setCategories(catRes.data);

    const sales = {};
    if (salesRes.data) {
      salesRes.data.forEach(item => {
        sales[item.produk_id] = (sales[item.produk_id] || 0) + item.jumlah;
      });
      setSalesMap(sales);
    }

    if (prodRes.data) {
      const parsedList = prodRes.data.map(parseProduct);
      setProducts(parsedList);

      // Cek parameter URL ?edit=ID untuk membuka modal edit secara otomatis
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
          const targetProd = parsedList.find(p => String(p.id) === String(editId));
          if (targetProd) {
            openModal(targetProd);
          }
        }
      }
    }

    setLoading(false);
  }

  const openModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        nama: prod.nama,
        kategori_id: prod.kategori_id,
        harga: prod.harga,
        stok: prod.stok,
        deskripsi: prod.deskripsi || '',
        gambar_url: prod.gambar_url || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nama: '',
        kategori_id: categories[0]?.id || '',
        harga: '',
        stok: '10',
        deskripsi: '',
        gambar_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `produk/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produk-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('produk-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, gambar_url: urlData.publicUrl }));
      setStatusMsg('Gambar berhasil diunggah!');
    } catch (err) {
      console.error(err);
      setStatusMsg('Gagal unggah gambar. Menggunakan URL manual.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.harga) {
      alert('Nama dan Harga wajib diisi!');
      return;
    }

    const currentStatus = editingProduct ? (editingProduct.is_active !== false) : true;
    const formattedDesc = formatProductDescription(formData.deskripsi, currentStatus);

    const payload = {
      nama: formData.nama,
      kategori_id: parseInt(formData.kategori_id || categories[0]?.id),
      harga: parseInt(formData.harga),
      stok: parseInt(formData.stok || 0),
      deskripsi: formattedDesc,
      gambar_url: formData.gambar_url,
      is_active: currentStatus
    };

    if (editingProduct) {
      let { error } = await supabase
        .from('produk')
        .update(payload)
        .eq('id', editingProduct.id);

      if (error) {
        // Fallback jika kolom is_active belum ditambahkan di Supabase
        const { is_active, ...fallbackPayload } = payload;
        const resFallback = await supabase
          .from('produk')
          .update(fallbackPayload)
          .eq('id', editingProduct.id);
        error = resFallback.error;
      }

      if (!error) {
        setIsModalOpen(false);
        sessionStorage.removeItem('rajajutan_katalog_cache');
        sessionStorage.removeItem('rajajutan_featured_cache');
        fetchData();
      }
    } else {
      let { error } = await supabase
        .from('produk')
        .insert([payload]);

      if (error) {
        // Fallback jika kolom is_active belum ditambahkan di Supabase
        const { is_active, ...fallbackPayload } = payload;
        const resFallback = await supabase
          .from('produk')
          .insert([fallbackPayload]);
        error = resFallback.error;
      }

      if (!error) {
        setIsModalOpen(false);
        sessionStorage.removeItem('rajajutan_katalog_cache');
        sessionStorage.removeItem('rajajutan_featured_cache');
        fetchData();
      }
    }
  };

  // Toggle status aktif/nonaktif dari tombol aksi
  const handleToggleStatus = async (prod) => {
    const newStatus = !prod.is_active;
    const newDesc = formatProductDescription(prod.deskripsi, newStatus);

    let { error } = await supabase
      .from('produk')
      .update({ is_active: newStatus, deskripsi: newDesc })
      .eq('id', prod.id);

    if (error) {
      // Fallback jika kolom is_active belum ada
      const resFallback = await supabase
        .from('produk')
        .update({ deskripsi: newDesc })
        .eq('id', prod.id);
      error = resFallback.error;
    }

    if (!error) {
      sessionStorage.removeItem('rajajutan_katalog_cache');
      sessionStorage.removeItem('rajajutan_featured_cache');
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, is_active: newStatus } : p));
    }
  };

  // Request Hapus Produk dengan Validasi Relasi
  const requestDelete = async (prod) => {
    const soldQty = salesMap[prod.id] || 0;
    if (soldQty > 0) {
      setWarningMessage({
        title: 'Produk Tidak Dapat Dihapus',
        message: `Produk "${prod.nama}" tidak bisa dihapus karena sudah memiliki riwayat pembelian (${soldQty} terjual). Silakan nonaktifkan produk jika tidak ingin ditampilkan di katalog.`
      });
      return;
    }

    const { data: trxHistory } = await supabase
      .from('detail_transaksi')
      .select('id')
      .eq('produk_id', prod.id)
      .limit(1);

    if (trxHistory && trxHistory.length > 0) {
      setWarningMessage({
        title: 'Produk Tidak Dapat Dihapus',
        message: `Produk "${prod.nama}" tidak bisa dihapus karena sudah memiliki riwayat pembelian. Silakan nonaktifkan produk jika tidak ingin ditampilkan di katalog.`
      });
      return;
    }

    setDeleteTarget(prod);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('produk').delete().eq('id', deleteTarget.id);
    if (!error) {
      sessionStorage.removeItem('rajajutan_katalog_cache');
      sessionStorage.removeItem('rajajutan_featured_cache');
      fetchData();
      setDeleteTarget(null);
    } else {
      setWarningMessage({
        title: 'Gagal Menghapus Produk',
        message: 'Produk ini tidak dapat dihapus karena berelasi dengan data transaksi lain. Silakan nonaktifkan produk sebagai gantinya.'
      });
      setDeleteTarget(null);
    }
  };

  // Reset semua filter kolom
  const resetFilters = () => {
    setFilterNama('');
    setFilterKategori('');
    setFilterHarga('');
    setFilterTerjual('');
    setFilterStok('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const isFilterActive = filterNama || filterKategori || filterHarga || filterTerjual || filterStok || filterStatus !== 'all';

  // Filter list produk berdasarkan filter masing-masing kolom
  const filteredProducts = products.filter(prod => {
    const terjual = salesMap[prod.id] || 0;
    const isActive = prod.is_active !== false;

    // 1. Filter Nama
    if (filterNama && !prod.nama.toLowerCase().includes(filterNama.toLowerCase())) {
      return false;
    }

    // 2. Filter Kategori
    const katName = prod.kategori?.nama || '';
    if (filterKategori && !katName.toLowerCase().includes(filterKategori.toLowerCase())) {
      return false;
    }

    // 3. Filter Harga
    if (filterHarga) {
      const hargaStr = String(prod.harga || 0);
      if (!hargaStr.includes(filterHarga.replace(/\D/g, ''))) {
        return false;
      }
    }

    // 4. Filter Terjual
    if (filterTerjual) {
      const terjualStr = String(terjual);
      if (!terjualStr.includes(filterTerjual.replace(/\D/g, ''))) {
        return false;
      }
    }

    // 5. Filter Stok
    if (filterStok) {
      const stokStr = String(prod.stok || 0);
      if (!stokStr.includes(filterStok.replace(/\D/g, ''))) {
        return false;
      }
    }

    // 6. Filter Status
    if (filterStatus === 'aktif' && !isActive) return false;
    if (filterStatus === 'nonaktif' && isActive) return false;

    return true;
  });

  // Perhitungan Pagination (View Per Halaman Tanpa Memotong Data)
  const totalItems = filteredProducts.length;
  const itemsPerPage = pageSize === 'all' ? totalItems : parseInt(pageSize, 10);
  const totalPages = pageSize === 'all' || itemsPerPage === 0 ? 1 : Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === 'all' ? 0 : (safePage - 1) * itemsPerPage;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(startIndex + itemsPerPage, totalItems);
  const displayedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div>
      {/* Header Halaman (Sipkesmas Title Bar) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>
            Manajemen Produk
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Kelola daftar produk, stok, status aktif/nonaktif, dan histori penjualan
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '0.9rem',
            fontWeight: 700,
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)'
          }}
        >
          <Plus size={16} /> Tambah Produk Baru
        </button>
      </div>

      {/* Baris Kontrol: Jumlah Tampil (Sipkesmas Right Dropdown) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tampil:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            fontSize: '0.85rem',
            color: '#0f172a',
            fontWeight: 500,
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

      {/* Tabel Sipkesmas Bersih (Border Grid Tipis & Jelas, Fixed Layout, Tanpa Geser Horizontal) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
        width: '100%'
      }}>
        <div style={{ width: '100%', overflowX: 'hidden' }}>
          <table style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            fontSize: '0.88rem',
            color: '#334155',
            textAlign: 'center'
          }}>
            <thead>
              {/* Baris 1: Header Nama Kolom (Fixed Proportional Widths) */}
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '14px 6px', textAlign: 'center', fontWeight: 600, width: '5%', borderRight: '1px solid #e2e8f0' }}>No</th>
                <th style={{ padding: '14px 6px', textAlign: 'center', fontWeight: 600, width: '7%', borderRight: '1px solid #e2e8f0' }}>Gambar</th>
                <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 600, width: '25%', borderRight: '1px solid #e2e8f0' }}>Nama Produk</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '13%', borderRight: '1px solid #e2e8f0' }}>Kategori</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '13%', borderRight: '1px solid #e2e8f0' }}>Harga</th>
                <th style={{ padding: '14px 6px', textAlign: 'center', fontWeight: 600, width: '8%', borderRight: '1px solid #e2e8f0' }}>Terjual</th>
                <th style={{ padding: '14px 6px', textAlign: 'center', fontWeight: 600, width: '8%', borderRight: '1px solid #e2e8f0' }}>Stok</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '10%', borderRight: '1px solid #e2e8f0' }}>Status</th>
                <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600, width: '11%' }}>Aksi</th>
              </tr>

              {/* Baris 2: Filter Per Kolom (Sipkesmas Filter Input Center Aligned) */}
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                {/* No: Kosong */}
                <th style={{ padding: '8px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}></th>

                {/* Gambar: Kosong */}
                <th style={{ padding: '8px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}></th>

                {/* Nama Produk: Filter Manual */}
                <th style={{ padding: '8px 6px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={filterNama}
                    onChange={(e) => {
                      setFilterNama(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                      fontWeight: 'normal',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      textAlign: 'center',
                      height: '34px',
                      outline: 'none'
                    }}
                  />
                </th>

                {/* Kategori: Filter Manual */}
                <th style={{ padding: '8px 6px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={filterKategori}
                    onChange={(e) => {
                      setFilterKategori(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 6px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                      fontWeight: 'normal',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      textAlign: 'center',
                      height: '34px',
                      outline: 'none'
                    }}
                  />
                </th>

                {/* Harga: Filter Manual */}
                <th style={{ padding: '8px 6px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={filterHarga}
                    onChange={(e) => {
                      setFilterHarga(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 6px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                      fontWeight: 'normal',
                      backgroundColor: '#ffffff',
                      textAlign: 'center',
                      color: '#0f172a',
                      height: '34px',
                      outline: 'none'
                    }}
                  />
                </th>

                {/* Terjual: Filter Manual */}
                <th style={{ padding: '8px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={filterTerjual}
                    onChange={(e) => {
                      setFilterTerjual(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                      fontWeight: 'normal',
                      backgroundColor: '#ffffff',
                      textAlign: 'center',
                      color: '#0f172a',
                      height: '34px',
                      outline: 'none'
                    }}
                  />
                </th>

                {/* Stok: Filter Manual */}
                <th style={{ padding: '8px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={filterStok}
                    onChange={(e) => {
                      setFilterStok(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                      fontWeight: 'normal',
                      backgroundColor: '#ffffff',
                      textAlign: 'center',
                      color: '#0f172a',
                      height: '34px',
                      outline: 'none'
                    }}
                  />
                </th>

                {/* Status: Filter Dropdown (Semua / Aktif / Nonaktif) */}
                <th style={{ padding: '8px 4px', borderRight: '1px solid #e2e8f0' }}>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                      fontWeight: 'normal',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      cursor: 'pointer',
                      textAlign: 'center',
                      height: '34px',
                      outline: 'none'
                    }}
                  >
                    <option value="all">Semua</option>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </th>

                {/* Aksi: Reset Filter */}
                <th style={{ padding: '8px 4px', textAlign: 'center' }}>
                  {isFilterActive ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      title="Reset semua filter"
                      style={{
                        padding: '5px 8px',
                        fontSize: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: '#f8fafc',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  ) : null}
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Memuat data produk...
                  </td>
                </tr>
              ) : displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Tidak ada data produk yang sesuai.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((prod, index) => {
                  const noUrut = startIndex + index + 1; // Nomor berlanjut sesuai halaman
                  const terjual = salesMap[prod.id] || 0;
                  const isActive = prod.is_active !== false;

                  return (
                    <tr
                      key={prod.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      {/* No (Center) */}
                      <td style={{ padding: '14px 4px', textAlign: 'center', color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                        {noUrut}
                      </td>

                      {/* Gambar (Center) */}
                      <td style={{ padding: '10px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          border: '1px solid #e2e8f0'
                        }}>
                          {prod.gambar_url ? (
                            <img src={prod.gambar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            '🧶'
                          )}
                        </div>
                      </td>

                      {/* Nama Produk (Center) */}
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: '#0f172a', fontWeight: 500, borderRight: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                        {prod.nama}
                      </td>

                      {/* Kategori (Center) */}
                      <td style={{ padding: '14px 8px', color: '#475569', textAlign: 'center', borderRight: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                        {prod.kategori?.nama || '-'}
                      </td>

                      {/* Harga (Center) */}
                      <td style={{ padding: '14px 8px', textAlign: 'center', color: '#0f172a', fontWeight: 500, borderRight: '1px solid #e2e8f0' }}>
                        Rp {prod.harga?.toLocaleString('id-ID')}
                      </td>

                      {/* Terjual (Center) */}
                      <td style={{ padding: '14px 6px', textAlign: 'center', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                        {terjual}
                      </td>

                      {/* Stok (Center) */}
                      <td style={{ padding: '14px 6px', textAlign: 'center', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                        {prod.stok}
                      </td>

                      {/* Status (Center) */}
                      <td style={{ padding: '14px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                          color: isActive ? '#15803d' : '#64748b'
                        }}>
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Aksi: Icon Bersih Minimalis dengan Top Tooltip */}
                      <td style={{ padding: '14px 6px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          
                          {/* Tombol Toggle Status (Icon Kardus) */}
                          <div style={{ position: 'relative', display: 'inline-block' }} className="has-tooltip">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(prod)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: isActive ? '#475569' : '#94a3b8',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'color 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                              onMouseLeave={(e) => e.currentTarget.style.color = isActive ? '#475569' : '#94a3b8'}
                            >
                              <Package size={18} />
                            </button>
                            <span className="tooltip-top">
                              {isActive ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
                            </span>
                          </div>

                          {/* Tombol Edit (Icon Pensil/Edit) */}
                          <div style={{ position: 'relative', display: 'inline-block' }} className="has-tooltip">
                            <button
                              type="button"
                              onClick={() => openModal(prod)}
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
                              <Edit3 size={18} />
                            </button>
                            <span className="tooltip-top">Edit Produk</span>
                          </div>

                          {/* Tombol Hapus (Icon Sampah) */}
                          <div style={{ position: 'relative', display: 'inline-block' }} className="has-tooltip">
                            <button
                              type="button"
                              onClick={() => requestDelete(prod)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#dc2626',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'opacity 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                              <Trash2 size={18} />
                            </button>
                            <span className="tooltip-top">Hapus Produk</span>
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* MODAL POPUP PERINGATAN (JIKA PRODUK SUDAH ADA RIWAYAT PEMBELIAN) */}
      {warningMessage && (
        <div 
          onClick={() => setWarningMessage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card" 
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fde68a'
            }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              {warningMessage.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
              {warningMessage.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setWarningMessage(null)}
                className="btn btn-primary"
                style={{ minWidth: '120px', padding: '10px 24px', fontWeight: 700, borderRadius: '8px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP KONFIRMASI HAPUS (HANYA PRODUK TANPA RIWAYAT TRANSAKSI) */}
      {deleteTarget && (
        <div 
          onClick={() => setDeleteTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card" 
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #fecaca' }}>
              <Trash2 size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Konfirmasi Hapus Produk</h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus produk <strong>&quot;{deleteTarget.nama}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-outline" style={{ padding: '10px', borderRadius: '8px' }}>
                Batal
              </button>
              <button type="button" onClick={confirmDelete} className="btn btn-danger" style={{ padding: '10px', borderRadius: '8px', fontWeight: 700 }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM CRUD PRODUK (TANPA FIELD STATUS) */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
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
            style={{ width: '100%', maxWidth: '520px', padding: '28px', backgroundColor: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                {editingProduct ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Nama Produk *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Kategori Produk</label>
                <select
                  className="form-input"
                  value={formData.kategori_id}
                  onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nama}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Harga (Rp) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Jumlah Stok *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Deskripsi Produk</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Gambar Produk (Upload / URL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ marginBottom: '8px', fontSize: '0.85rem' }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Atau tempel URL Gambar langsung..."
                  value={formData.gambar_url}
                  onChange={(e) => setFormData({ ...formData, gambar_url: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
