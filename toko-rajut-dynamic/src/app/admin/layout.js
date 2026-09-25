'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopNav from '@/components/AdminTopNav';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token'))
      : null;

    if (!token || token !== 'logged_in') {
      setAuthorized(false);
      router.push('/admin/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  // If on login page, render login form without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading skeleton until auth check passes
  if (!authorized) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', minHeight: '80vh', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
        <p>Memeriksa otentikasi admin...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar Samping Kiri (Fixed Height 100vh) */}
      <AdminSidebar />

      {/* Main Right Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header Bar Navigation Atas (Sticky Top 0, Teks Polos 'Admin' di kanan) */}
        <AdminTopNav />

        {/* Konten Halaman Admin */}
        <main style={{ flex: 1, padding: '32px 36px 48px' }}>
          {children}
        </main>

        {/* Footer Admin */}
        <footer style={{
          padding: '20px 36px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          color: '#64748b',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          <p>© 2026 Rajajutan Arkana. Panel Pengelola Sistem.</p>
        </footer>
      </div>
    </div>
  );
}
