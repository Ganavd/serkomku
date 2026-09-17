'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="footer" style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#64748b' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <p>&copy; 2026 Rajajutan Arkana. Platform Kerajinan Tangan Berkualitas Tinggi.</p>
        <p style={{ marginTop: '6px', fontSize: '0.8rem' }}>
          Terhubung dengan <a href="https://bagusargana-portofolio.vercel.app" style={{ color: '#2563eb', textDecoration: 'underline' }}>Portofolio Pengembang (Bagus Argana)</a>
        </p>
      </div>
    </footer>
  );
}
