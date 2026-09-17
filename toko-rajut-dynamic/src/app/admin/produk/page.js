'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2, X, Check, Upload } from 'lucide-react';

export default function AdminProdukPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: catData } = await supabase.from('kategori').select('*');
    if (catData) setCategories(catData);

    const { data: prodData } = await supabase
      .from('produk')
      .select('*, kategori(nama)')
      .order('id', { ascending: false });

    if (prodData) setProducts(prodData);
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

    const payload = {
      nama: formData.nama,
      kategori_id: parseInt(formData.kategori_id || categories[0]?.id),
      harga: parseInt(formData.harga),
      stok: parseInt(formData.stok || 0),
      deskripsi: formData.deskripsi,
      gambar_url: formData.gambar_url
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('produk')
        .update(payload)
        .eq('id', editingProduct.id);

      if (!error) {
        setIsModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('produk')
        .insert([payload]);

      if (!error) {
        setIsModalOpen(false);
        fetchData();
      }
    }
  };

  // Delete modal target
  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('produk').delete().eq('id', deleteTarget.id);
    if (!error) {
      fetchData();
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Manajemen Produk (CRUD)</h1>
          <p style={{ color: '#64748b' }}>Tambah, ubah, dan hapus barang di katalog Toko Rajut</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={16} /> Tambah Produk Baru
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Memuat data produk...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Belum ada produk.</td></tr>
            ) : (
              products.map(prod => (
                <tr key={prod.id}>
                  <td>
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {prod.gambar_url ? <img src={prod.gambar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🧶'}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{prod.nama}</td>
                  <td>{prod.kategori?.nama || '-'}</td>
                  <td>Rp {prod.harga?.toLocaleString('id-ID')}</td>
                  <td>
                    <span style={{ color: prod.stok <= 5 ? '#b45309' : '#166534', fontWeight: 600 }}>
                      {prod.stok} unit
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openModal(prod)} className="btn btn-outline btn-sm">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget(prod)} className="btn btn-danger btn-sm">
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Pop-Up Konfirmasi Hapus Produk */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '28px', backgroundColor: '#ffffff', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
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

      {/* Modal Form CRUD */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '28px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>
                {editingProduct ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Produk *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori Produk</label>
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
                  <label>Harga (Rp) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Jumlah Stok *</label>
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
                <label>Deskripsi Produk</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Gambar Produk (Upload / URL)</label>
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
                <button type="submit" className="btn btn-primary">
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
