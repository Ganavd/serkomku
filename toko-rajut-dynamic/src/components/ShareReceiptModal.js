'use client';

import React, { useState } from 'react';
import { Mail, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { downloadReceiptPDF } from '@/lib/pdfHelper';

export default function ShareReceiptModal({
  isOpen,
  onClose,
  transaksi,
  receiptElementId = 'receipt-print-area',
  onSuccessRedirect // callback function called after 3 seconds success popup
}) {
  const [emailInput, setEmailInput] = useState(transaksi?.email_pelanggan || '');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setErrorMsg('');
      await downloadReceiptPDF(receiptElementId, 'Transaksi Belanja Anda.pdf');
    } catch (err) {
      console.error('PDF download error:', err);
      setErrorMsg('Gagal mengunduh struk PDF. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput.trim()) {
      setErrorMsg('Silakan masukkan alamat email tujuan.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setErrorMsg('Format alamat email tidak valid.');
      return;
    }

    const namaLengkap = transaksi?.nama_pelanggan || 'Pelanggan';

    // Buka akun Gmail aktif di browser saat ini dengan format pesan resmi
    const emailSubject = `Struk Transaksi Belanja - Toko Rajajutan Arkana (${transaksi?.kode_transaksi || ''})`;
    const emailBody = `Halo ${namaLengkap},

Terima kasih telah berbelanja di Toko Rajajutan Arkana.

Ini Lampiran PDF struk belanja transaksi anda.
Transaksi Belanja Anda.pdf

Salam hangat,
Toko Rajajutan Arkana`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailInput.trim())}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank');

    // Tampilkan pop-up sukses 3 detik dan jalankan callback redirect
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      if (onSuccessRedirect) {
        onSuccessRedirect();
      }
    }, 3000);
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {isSuccess ? (
          /* Pop up Berhasil Dikirim Tanpa Tombol Bawah (Selama 3 Detik) */
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '2px solid #a7f3d0'
            }}>
              <CheckCircle2 size={44} style={{ color: '#059669' }} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065f46', marginBottom: '8px' }}>
              Struk Berhasil Dikirim!
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Format struk transaksi belanja telah disiapkan dan dikirimkan ke <strong>{emailInput}</strong>.
            </p>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Mengalihkan halaman dalam 3 detik...
            </div>
          </div>
        ) : (
          /* Form Bagikan */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                Bagikan Struk Transaksi
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                Kirim melalui Gmail atau simpan sebagai file PDF
              </p>
            </div>

            {errorMsg && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                border: '1px solid #fecaca'
              }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {/* Opsi Save as PDF (Hanya judul & tombol tanpa teks tambahan bawahnya) */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                Save as PDF
              </span>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="btn btn-outline"
                style={{
                  fontSize: '0.85rem',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff'
                }}
              >
                <Download size={15} />
                {isDownloading ? 'Mengunduh...' : 'Unduh PDF'}
              </button>
            </div>

            {/* Form Pengiriman Gmail */}
            <form onSubmit={handleSend}>
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                marginBottom: '20px'
              }}>
                <label 
                  htmlFor="inputEmailTarget"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    marginBottom: '10px'
                  }}
                >
                  <Mail size={16} color="#2563eb" /> Kirim ke Gmail
                </label>
                <input
                  id="inputEmailTarget"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Masukkan alamat email (contoh: nama@gmail.com)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #94a3b8',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Tombol Aksi Bawah */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                  style={{ padding: '10px', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    padding: '10px', 
                    fontWeight: 700, 
                    fontSize: '0.9rem'
                  }}
                >
                  Kirim
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
