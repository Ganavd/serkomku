'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

export default function KeranjangPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState([]);

  // Default all cart item IDs to checked
  useEffect(() => {
    if (cart.length > 0) {
      setSelectedIds(prev => {
        // Keep existing selections that still exist in cart, plus add any new item IDs
        const cartIds = cart.map(item => item.id);
        if (prev.length === 0) return cartIds;
        const validPrev = prev.filter(id => cartIds.includes(id));
        const newIds = cartIds.filter(id => !prev.includes(id));
        return [...validPrev, ...newIds];
      });
    } else {
      setSelectedIds([]);
    }
  }, [cart]);

  const allSelected = cart.length > 0 && selectedIds.length === cart.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cart.map(item => item.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedItems = cart.filter(item => selectedIds.includes(item.id));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + (item.harga * item.quantity), 0);

  const handleProceedCheckout = () => {
    if (selectedItems.length === 0) return;

    // Clear any leftover Buy Now session data
    sessionStorage.removeItem('rajajutan_buy_now');
    // Save only selected items to checkout session
    sessionStorage.setItem('rajajutan_checkout_items', JSON.stringify(selectedItems));

    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <main style={{ padding: '60px 0', minHeight: '75vh' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <ShoppingBag size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Keranjang Belanja Kosong</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Anda belum menambahkan produk rajutan ke dalam keranjang.
          </p>
          <Link href="/katalog" className="btn btn-primary">
            Jelajahi Katalog Produk &rarr;
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px 0', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>Keranjang Belanja</h1>
            <p style={{ color: '#64748b' }}>Pilih item yang ingin Anda bayar ({selectedItems.length} dari {cart.length} dipilih)</p>
          </div>
          <button onClick={clearCart} className="btn btn-outline btn-sm">
            Kosongkan Keranjang
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          {/* Item Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      title="Pilih Semua"
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th>Produk</th>
                  <th>Harga Satuan</th>
                  <th>Jumlah</th>
                  <th>Subtotal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} style={{ opacity: isChecked ? 1 : 0.6, backgroundColor: isChecked ? 'transparent' : '#f8fafc' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectItem(item.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {item.gambar_url ? (
                              <img src={item.gambar_url} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span>🧶</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.nama}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.kategori?.nama || 'Rajut'}</div>
                          </div>
                        </div>
                      </td>
                      <td>Rp {item.harga?.toLocaleString('id-ID')}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', width: 'fit-content', overflow: 'hidden' }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              style={{ padding: '4px 12px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.stok !== undefined ? item.stok : 999}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  updateQuantity(item.id, val);
                                }
                              }}
                              style={{ width: '44px', textAlign: 'center', border: 'none', fontSize: '0.9rem', fontWeight: 700, outline: 'none', MozAppearance: 'textfield' }}
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.stok !== undefined && item.quantity >= item.stok}
                              style={{
                                padding: '4px 12px',
                                background: '#f1f5f9',
                                border: 'none',
                                cursor: item.stok !== undefined && item.quantity >= item.stok ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                color: item.stok !== undefined && item.quantity >= item.stok ? '#94a3b8' : 'inherit'
                              }}
                            >
                              +
                            </button>
                          </div>
                          {item.stok !== undefined && (
                            <span style={{ fontSize: '0.72rem', color: item.quantity >= item.stok ? '#eab308' : '#64748b' }}>
                              {item.quantity >= item.stok ? `Mencapai batas stok (${item.stok})` : `Sisa stok: ${item.stok}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Hapus produk"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cart Summary */}
          <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              Ringkasan Pesanan
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
              <span style={{ color: '#64748b' }}>Produk Dipilih</span>
              <span style={{ fontWeight: 600 }}>{selectedItems.length} Item</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
              <span style={{ color: '#64748b' }}>Total Harga Produk</span>
              <span>Rp {selectedTotal.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
              <span style={{ color: '#64748b' }}>Biaya Pengiriman</span>
              <span style={{ color: '#166534', fontWeight: 600 }}>GRATIS</span>
            </div>
            <div style={{
              display: 'flex',
              justify: 'space-between',
              margin: '20px 0',
              paddingTop: '14px',
              borderTop: '2px solid #e2e8f0',
              fontSize: '1.2rem',
              fontWeight: 700
            }}>
              <span>Total Akhir</span>
              <span style={{ color: '#2563eb' }}>Rp {selectedTotal.toLocaleString('id-ID')}</span>
            </div>

            <button
              type="button"
              onClick={handleProceedCheckout}
              disabled={selectedItems.length === 0}
              className="btn btn-primary btn-block"
              style={{ padding: '12px', opacity: selectedItems.length === 0 ? 0.6 : 1, cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              Lanjut ke Checkout ({selectedItems.length}) <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
