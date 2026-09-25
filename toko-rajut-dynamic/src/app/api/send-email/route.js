import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { to, nama, pdfBase64, kodeTransaksi } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Email penerima wajib diisi' }, { status: 400 });
    }

    const emailUser = process.env.GMAIL_USER || 'arganavd9@gmail.com';
    const emailPass = process.env.GMAIL_APP_PASSWORD;

    const emailBody = `Halo ${nama || 'Pelanggan'},

Terima kasih telah berbelanja di Toko Rajajutan Arkana.

Ini Lampiran PDF struk belanja transaksi anda.
Transaksi Belanja Anda.pdf

Salam hangat,
Toko Rajajutan Arkana`;

    // Jika GMAIL_APP_PASSWORD diset, kirim email secara nyata via SMTP Gmail
    if (emailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      const mailOptions = {
        from: `"Toko Rajajutan Arkana" <${emailUser}>`,
        to: to,
        subject: `Struk Transaksi Belanja - Toko Rajajutan Arkana (${kodeTransaksi || 'Pesanan'})`,
        text: emailBody,
        attachments: pdfBase64 ? [
          {
            filename: 'Transaksi Belanja Anda.pdf',
            content: pdfBase64,
            encoding: 'base64'
          }
        ] : []
      };

      await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, method: 'smtp', message: 'Email berhasil dikirim dari ' + emailUser });
    }

    // Jika belum diset app password, beri sinyal sukses simulasi dan instruksi
    return NextResponse.json({ 
      success: true, 
      method: 'direct', 
      message: 'Email diproses untuk dikirim ke ' + to,
      info: 'Untuk pengiriman otomatis latar belakang tanpa membuka Gmail, tambahkan GMAIL_APP_PASSWORD di .env.local'
    });

  } catch (err) {
    console.error('Error sending email:', err);
    return NextResponse.json({ error: err.message || 'Gagal mengirim email' }, { status: 500 });
  }
}
