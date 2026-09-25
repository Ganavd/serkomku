import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Rajajutan Arkana | Katalog Produk Kerajinan Tangan',
  description: 'Jual produk rajutan buatan tangan: baju, sweater, tas, dan mainan rajut berkualitas tinggi dari Rajajutan Arkana.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/Logo-Rajajutan.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/Logo-Rajajutan.png" />
      </head>
      <body>
        <CartProvider>
          <Navbar />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
