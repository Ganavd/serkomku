'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
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
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <footer style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
          <p>© 2026 Rajajutan Arkana. Panel Pengelola Sistem.</p>
          <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>
            Terhubung dengan <a href="http://localhost:8000" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Portofolio Pengembang (Bagus Argana)</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

