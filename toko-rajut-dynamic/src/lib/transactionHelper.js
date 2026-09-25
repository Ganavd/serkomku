/**
 * Helper untuk normalisasi dan ekstraksi data transaksi seperti Metode Pembayaran
 */

export function getPaymentMethod(trx) {
  if (!trx) return 'QRIS';
  
  if (trx.metode_pembayaran) {
    const m = trx.metode_pembayaran.toLowerCase();
    if (m.includes('transfer') || m.includes('bank')) return 'Transfer Bank';
    if (m.includes('qris')) return 'QRIS';
    return trx.metode_pembayaran;
  }

  if (trx.status) {
    const s = trx.status.toLowerCase();
    if (s.includes('transfer') || s.includes('bank')) return 'Transfer Bank';
    if (s.includes('qris')) return 'QRIS';
  }

  // Fallback default
  return 'QRIS';
}
