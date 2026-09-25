'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit3, Trash2, AlertCircle, RotateCcw, X, ArrowLeft } from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function AdminKategoriPage() {
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal Form State (Tambah / Edit Kategori)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    slug: ''
  });

  // Filter & Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterNama, setFilterNama] = useState('');
  const [filterSlug, setFilterSlug] = useState('');
  const [filterJumlah, setFilterJumlah] = useState('');

  // Modal Pop-Up Delete & Warning States
  const [deleteTargetCat, setDeleteTargetCat] = useState(null);
  const [warningModal, setWarningModal] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const [catRes, prodRes] = await Promise.all([
      supabase.from('kategori').select('*').order('id', { ascending: true }),
      supabase.from('produk').select('id, kategori_id')
    ]);

    if (catRes.data) setCategories(catRes.data);

    // Hitung jumlah produk per kategori
    const counts = {};
    if (prodRes.data) {
      prodRes.data.forEach(p => {
        if (p.kategori_id) {
          counts[p.kategori_id] = (counts[p.kategori_id] || 0) + 1;
        }
      });
      setProductCounts(counts);
    }

    setLoading(false);
  }

  const openModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        nama: cat.nama,
        slug: cat.slug || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        nama: '',
        slug: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleNameChange = (val) => {
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({
      ...prev,
      nama: val,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) || !editingCategory ? autoSlug : prev.slug
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Nama kategori wajib diisi!');
      return;
    }

    const generatedSlug = formData.slug.trim() || formData.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (editingCategory) {
      const { error } = await supabase
        .from('kategori')
        .update({ nama: formData.nama.trim(), slug: generatedSlug })
        .eq('id', editingCategory.id);

      if (!error) {
        setIsModalOpen(false);
        sessionStorage.removeItem('rajajutan_katalog_cache');
        fetchCategories();
      } else {
        alert('Gagal memperbarui kategori: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('kategori')
        .insert([{ nama: formData.nama.trim(), slug: generatedSlug }]);

      if (!error) {
        setIsModalOpen(false);
        sessionStorage.removeItem('rajajutan_katalog_cache');
        fetchCategories();
      } else {
        alert('Gagal menambahkan kategori: ' + error.message);
      }
    }
  };

  const requestDeleteCategory = async (cat) => {
    // 1. Cek dari state counts lokal
    const count = productCounts[cat.id] || 0;
    if (count > 0) {
      setWarningModal({
        title: 'Kategori Tidak Dapat Dihapus',
        message: `Kategori "${cat.nama}" tidak bisa dihapus karena masih memiliki ${count} produk terkait. Silakan hapus atau ubah kategori produk terkait terlebih dahulu.`
      });
      return;
    }

    // 2. Double check ke database Supabase
    const { data: prods } = await supabase
      .from('produk')
      .select('id')
      .eq('kategori_id', cat.id)
      .limit(1);

    if (prods && prods.length > 0) {
      setWarningModal({
        title: 'Kategori Tidak Dapat Dihapus',
        message: `Kategori "${cat.nama}" tidak bisa dihapus karena masih memiliki produk terkait. Silakan hapus atau ubah kategori produk terkait terlebih dahulu.`
      });
      return;
    }

    setDeleteTargetCat(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTargetCat) return;
    const { error } = await supabase.from('kategori').delete().eq('id', deleteTargetCat.id);
    if (!error) {
      sessionStorage.removeItem('rajajutan_katalog_cache');
      fetchCategories();
      setDeleteTargetCat(null);
    } else {
      setWarningModal({
        title: 'Gagal Menghapus Kategori',
        message: 'Kategori ini tidak dapat dihapus karena masih berelasi dengan data produk lain.'
      });
      setDeleteTargetCat(null);
    }
  };

  const resetFilters = () => {
    setFilterNama('');
    setFilterSlug('');
    setFilterJumlah('');
    setCurrentPage(1);
  };

  const isFilterActive = filterNama || filterSlug || filterJumlah;

  const filteredCategories = categories.filter(cat => {
    const totalProd = productCounts[cat.id] || 0;
    if (filterNama && !cat.nama.toLowerCase().includes(filterNama.toLowerCase())) {
      return false;
    }
    if (filterSlug && !cat.slug?.toLowerCase().includes(filterSlug.toLowerCase())) {
      return false;
    }
    if (filterJumlah && !String(totalProd).includes(filterJumlah.trim())) {
      return false;
    }
    return true;
  });

  // Perhitungan Pagination (View Per Halaman Tanpa Memotong Data)
  const totalItems = filteredCategories.length;
  const itemsPerPage = pageSize === 'all' ? totalItems : parseInt(pageSize, 10);
  const totalPages = pageSize === 'all' || itemsPerPage === 0 ? 1 : Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === 'all' ? 0 : (safePage - 1) * itemsPerPage;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(startIndex + itemsPerPage, totalItems);
  const displayedCategories = filteredCategories.slice(startIndex, endIndex);

  return (
    <div>
      {/* Header Halaman & Tombol Tambah Kategori */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>
            Kelola Kategori Produk
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Kelola daftar kategori dan pengelompokkan jenis produk rajutan
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
          <Plus size={16} /> Tambah Kategori Baru
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
              {/* Baris 1: Header Nama Kolom */}
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '14px 6px', textAlign: 'center', fontWeight: 600, width: '8%', borderRight: '1px solid #e2e8f0' }}>No</th>
                <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 600, width: '35%', borderRight: '1px solid #e2e8f0' }}>Nama Kategori</th>
                <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 600, width: '27%', borderRight: '1px solid #e2e8f0' }}>Slug</th>
                <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 600, width: '18%', borderRight: '1px solid #e2e8f0' }}>Jumlah Produk</th>
                <th style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 600, width: '12%' }}>Aksi</th>
              </tr>

              {/* Baris 2: Filter Per Kolom (Sipkesmas Filter Input Center Aligned) */}
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                {/* No: Kosong */}
                <th style={{ padding: '8px 4px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}></th>

                {/* Nama Kategori: Filter Manual */}
                <th style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
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
                      padding: '6px 10px',
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

                {/* Slug: Filter Manual */}
                <th style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={filterSlug}
                    onChange={(e) => {
                      setFilterSlug(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 10px',
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

                {/* Jumlah Produk: Filter Manual */}
                <th style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    value={filterJumlah}
                    onChange={(e) => {
                      setFilterJumlah(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder=""
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 10px',
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

                {/* Aksi: Reset Filter */}
                <th style={{ padding: '8px 6px', textAlign: 'center' }}>
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
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Memuat data kategori...
                  </td>
                </tr>
              ) : displayedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Tidak ada data kategori yang sesuai.
                  </td>
                </tr>
              ) : (
                displayedCategories.map((cat, index) => {
                  const noUrut = startIndex + index + 1; // Nomor berlanjut sesuai halaman
                  const totalProd = productCounts[cat.id] || 0;

                  return (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      {/* No (Center) */}
                      <td style={{ padding: '14px 6px', textAlign: 'center', color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                        {noUrut}
                      </td>

                      {/* Nama Kategori (Center) */}
                      <td style={{ padding: '14px 12px', textAlign: 'center', color: '#0f172a', fontWeight: 500, borderRight: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                        {cat.nama}
                      </td>

                      {/* Slug (Center) */}
                      <td style={{ padding: '14px 12px', textAlign: 'center', color: '#64748b', borderRight: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                        {cat.slug || '-'}
                      </td>

                      {/* Jumlah Produk (Center - Angka Saja Tanpa Box) */}
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: '#0f172a', fontWeight: 600, borderRight: '1px solid #e2e8f0' }}>
                        {totalProd}
                      </td>

                      {/* Aksi: Icon Edit & Hapus dengan Top Tooltip */}
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          
                          {/* Tombol Edit (Icon Pensil) */}
                          <div style={{ position: 'relative', display: 'inline-block' }} className="has-tooltip">
                            <button
                              type="button"
                              onClick={() => openModal(cat)}
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
                            <span className="tooltip-top">Edit Kategori</span>
                          </div>

                          {/* Tombol Hapus (Icon Sampah) */}
                          <div style={{ position: 'relative', display: 'inline-block' }} className="has-tooltip">
                            <button
                              type="button"
                              onClick={() => requestDeleteCategory(cat)}
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
                            <span className="tooltip-top">Hapus Kategori</span>
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

      {/* MODAL POPUP FORM TAMBAH / EDIT KATEGORI */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '28px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Baru'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  {editingCategory ? 'Perbarui informasi kategori produk' : 'Masukkan rincian kategori baru'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block', color: '#334155' }}>
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Baju, Tas, Topi, Aksesoris"
                  value={formData.nama}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block', color: '#334155' }}>
                  Slug URL (Otomatis / Kustom)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: baju, tas-rajut"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Digunakan untuk identifikasi unik dan filter kategori produk
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '10px', borderRadius: '8px', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px', borderRadius: '8px', fontWeight: 700 }}
                >
                  {editingCategory ? 'Update Kategori' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POPUP PERINGATAN (JIKA KATEGORI MASIH PUNYA PRODUK) */}
      {warningModal && (
        <div 
          onClick={() => setWarningModal(null)}
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
              {warningModal.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
              {warningModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setWarningModal(null)}
                className="btn btn-primary"
                style={{ minWidth: '120px', padding: '10px 24px', fontWeight: 700, borderRadius: '8px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP KONFIRMASI HAPUS (KATEGORI KOSONG TANPA PRODUK) */}
      {deleteTargetCat && (
        <div 
          onClick={() => setDeleteTargetCat(null)}
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
            style={{ width: '100%', maxWidth: '420px', padding: '28px', backgroundColor: '#ffffff', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #fecaca' }}>
              <Trash2 size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Konfirmasi Hapus Kategori</h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus kategori <strong>&quot;{deleteTargetCat.nama}&quot;</strong>?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="button" onClick={() => setDeleteTargetCat(null)} className="btn btn-outline" style={{ padding: '10px', borderRadius: '8px' }}>
                Batal
              </button>
              <button type="button" onClick={confirmDeleteCategory} className="btn btn-danger" style={{ padding: '10px', borderRadius: '8px', fontWeight: 700 }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

