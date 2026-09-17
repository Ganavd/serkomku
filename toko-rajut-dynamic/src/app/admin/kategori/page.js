'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminKategoriPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data } = await supabase.from('kategori').select('*').order('id', { ascending: true });
    if (data) setCategories(data);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama) return;

    const generatedSlug = slug || nama.toLowerCase().replace(/\s+/g, '-');

    if (editingId) {
      const { error } = await supabase
        .from('kategori')
        .update({ nama, slug: generatedSlug })
        .eq('id', editingId);

      if (!error) {
        setNama('');
        setSlug('');
        setEditingId(null);
        fetchCategories();
      }
    } else {
      const { error } = await supabase
        .from('kategori')
        .insert([{ nama, slug: generatedSlug }]);

      if (!error) {
        setNama('');
        setSlug('');
        fetchCategories();
      }
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setNama(cat.nama);
    setSlug(cat.slug);
  };

  // Delete modal state
  const [deleteTargetCat, setDeleteTargetCat] = useState(null);

  const requestDeleteCategory = async (cat) => {
    // 1. Validasi apakah ada produk yang sedang menggunakan kategori ini
    const { data: prods } = await supabase
      .from('produk')
      .select('id, nama')
      .eq('kategori_id', cat.id);

    if (prods && prods.length > 0) {
      alert(`🚫 Kategori tidak dapat dihapus!\n\nKategori "${cat.nama}" masih digunakan oleh ${prods.length} produk. Silakan hapus atau ubah kategori produk terkait terlebih dahulu.`);
      return;
    }

    setDeleteTargetCat(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTargetCat) return;
    const { error } = await supabase.from('kategori').delete().eq('id', deleteTargetCat.id);
    if (!error) {
      fetchCategories();
      setDeleteTargetCat(null);
    } else {
      alert('Gagal menghapus kategori!');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Kelola Kategori Produk</h1>
        <p style={{ color: '#64748b' }}>Tambah dan edit pengelompokkan jenis produk rajutan</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
        {/* Form Insert/Edit */}
        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
            {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Nama Kategori *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: baju, sweater, tas"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', display: 'block' }}>Slug (Opsional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: baju-rajut"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary btn-block">
                {editingId ? 'Update' : 'Simpan'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setNama(''); setSlug(''); }}
                  className="btn btn-outline"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table List */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Kategori</th>
                <th>Slug</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Memuat kategori...</td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td style={{ fontWeight: 600 }}>{cat.nama}</td>
                  <td style={{ color: '#64748b' }}>{cat.slug}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(cat)} className="btn btn-outline btn-sm">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => requestDeleteCategory(cat)} className="btn btn-danger btn-sm">
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pop-Up Konfirmasi Hapus Kategori */}
      {deleteTargetCat && (
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
