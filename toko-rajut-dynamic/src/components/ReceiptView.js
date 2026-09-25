'use client';

import React from 'react';
import Barcode from './Barcode';
import { getPaymentMethod } from '@/lib/transactionHelper';

export default function ReceiptView({ transaksi, details = [], receiptId = 'receipt-print-area' }) {
  if (!transaksi) return null;

  const tanggalFormatted = transaksi.dibuat_pada 
    ? new Date(transaksi.dibuat_pada).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  return (
    <div
      id={receiptId}
      style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
        padding: '24px 20px 28px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        minHeight: '560px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: "'Courier New', Courier, monospace, system-ui",
        color: '#0f172a',
        position: 'relative'
      }}
    >
      {/* Header Struk */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 8px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px'
          }}>
            <img 
              src="/Logo-Rajajutan.png" 
              alt="Logo Rajajutan" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h2 style={{
            fontSize: '1.18rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 3px',
            letterSpacing: '0.5px'
          }}>
            ! Transaksi Belanja !
          </h2>
          <p style={{
            fontSize: '0.78rem',
            color: '#64748b',
            margin: 0,
            lineHeight: 1.35,
            padding: '0 6px'
          }}>
            Terima kasih telah berbelanja di Toko Rajajutan Arkana.
          </p>
        </div>

        {/* Nama Pelanggan dengan garis atas dan bawah */}
        <div style={{ margin: '14px 0 16px', textAlign: 'center' }}>
          <div style={{ borderTop: '1.5px dashed #cbd5e1', marginBottom: '6px' }} />
          <div style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#1e293b',
            letterSpacing: '0.5px'
          }}>
            {transaksi.nama_pelanggan || 'Pelanggan'}
          </div>
          <div style={{ borderBottom: '1.5px dashed #cbd5e1', marginTop: '6px' }} />
        </div>

        {/* Daftar Item (Pemanfaatan lebar optimal dengan grid rapi) */}
        <div style={{ width: '100%', margin: '0 auto 16px' }}>
          <div style={{
            fontSize: '0.72rem',
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 600
          }}>
            Daftar Item
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {details && details.length > 0 ? (
              details.map((item, idx) => {
                const isMultiple = (item.jumlah || 1) > 1;
                const hargaSatuan = item.harga_satuan || (item.subtotal / (item.jumlah || 1)) || 0;
                
                return (
                  <div 
                    key={item.id || idx} 
                    style={{ 
                      marginBottom: isMultiple ? '10px' : '6px',
                      paddingBottom: isMultiple ? '2px' : '0'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'baseline',
                      gap: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}>
                      {/* Nama Produk */}
                      <span style={{ 
                        wordBreak: 'break-word',
                        lineHeight: 1.3
                      }}>
                        {item.produk?.nama || item.nama_produk || 'Produk Rajut'}
                      </span>

                      {/* Jumlah Item (Kuantitas Selalu Sebaris & Tidak Jatuh ke Bawah) */}
                      <span style={{ 
                        fontSize: '0.8rem',
                        color: '#475569',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        padding: '0 4px'
                      }}>
                        x{item.jumlah}
                      </span>

                      {/* Subtotal Harga */}
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        textAlign: 'right',
                        fontWeight: 700
                      }}>
                        Rp {item.subtotal?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Jika kuantitas > 1, tampilkan rincian harga satuan di bawahnya */}
                    {isMultiple && (
                      <div style={{
                        fontSize: '0.72rem',
                        color: '#64748b',
                        marginTop: '1px'
                      }}>
                        @{hargaSatuan?.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
                Tidak ada item
              </div>
            )}
          </div>

          {/* Metode Pembayaran */}
          <div style={{
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '8px',
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#475569'
          }}>
            <span>Metode Bayar</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {getPaymentMethod(transaksi)}
            </span>
          </div>

          {/* Total Keseluruhan */}
          <div style={{
            borderTop: '1.5px solid #0f172a',
            paddingTop: '8px',
            marginTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.92rem',
            fontWeight: 800,
            color: '#0f172a'
          }}>
            <span>Total Keseluruhan</span>
            <span style={{ color: '#0f172a', fontSize: '1rem' }}>
              Rp {transaksi.total_harga?.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Barcode Vertikal Saja */}
      <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1.5px dashed #cbd5e1' }}>
        <div style={{ margin: '0 auto 6px', display: 'inline-block' }}>
          <Barcode 
            value={transaksi.kode_transaksi || `TRX-${Date.now()}`} 
            width={1.5} 
            height={44} 
            displayValue={false} 
          />
        </div>
        
        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
          {tanggalFormatted}
        </div>
        
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px' }}>
          Simpan struk ini sebagai bukti belanja yang sah
        </div>
      </div>
    </div>
  );
}
