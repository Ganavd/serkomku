import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { to, nama, kodeTransaksi, totalHarga, pdfBase64 } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Nomor WhatsApp penerima wajib diisi' }, { status: 400 });
    }

    let cleanPhone = to.trim().replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const ownerPhone = '085134776987';
    const waText = `Halo *${nama || 'Pelanggan'}*,\n\nTerima kasih telah berbelanja di *Toko Rajajutan Arkana*.\n\nBerikut bukti transaksi belanja Anda:\n• *Owner / Pengelola:* Bagus Argana (${ownerPhone})\n• *Kode Transaksi:* ${kodeTransaksi || '-'}\n• *Total Pembayaran:* Rp ${totalHarga?.toLocaleString('id-ID') || '0'}\n\nLampiran dokumen: *Transaksi Belanja Anda.pdf*\n\nSalam hangat,\n*Toko Rajajutan Arkana*`;

    // Jika pengguna mengonfigurasi Fonnte / WhatsApp Gateway API
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (fonnteToken) {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: waText,
          // Jika gateway mendukung attachment file
        })
      });
      const fonnteData = await response.json();
      return NextResponse.json({ success: true, method: 'gateway', data: fonnteData });
    }

    const waDirectUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waText)}`;

    return NextResponse.json({
      success: true,
      method: 'direct',
      waUrl: waDirectUrl,
      cleanPhone,
      message: 'WhatsApp disiapkan untuk dikirim ke ' + cleanPhone
    });

  } catch (err) {
    console.error('Error in send-whatsapp:', err);
    return NextResponse.json({ error: err.message || 'Gagal memproses pengiriman WhatsApp' }, { status: 500 });
  }
}
