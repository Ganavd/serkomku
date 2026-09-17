'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, UserCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { cartItemCount } = useCart();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img 
            src="/Favicon.io" 
            alt="Logo Rajajutan Arkana" 
            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain' }} 
          />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', letterSpacing: '0.8px' }}>
            RAJAJUTAN <span style={{ color: '#2563eb' }}>ARKANA</span>
          </span>
        </Link>
        
        <nav className="nav-links">
          <Link href="/" className="nav-link">Beranda</Link>
          <Link href="/katalog" className="nav-link">Katalog Produk</Link>
          
          {/* Cart Icon dengan Bubble Angka Kecil (Tanpa Blok Biru) */}
          <Link href="/keranjang" className="cart-btn" aria-label="Keranjang Belanja" title="Keranjang Belanja">
            <ShoppingCart size={22} />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </Link>

          {/* Tombol Access Login Admin */}
          <Link href="/admin/login" className="nav-link" title="Login Admin / Pengelola" style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: '8px', color: '#475569' }}>
            <UserCheck size={20} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
