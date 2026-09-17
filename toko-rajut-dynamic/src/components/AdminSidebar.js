'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Tag, FileText, LogOut } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/produk', label: 'Kelola Produk', icon: Package },
    { href: '/admin/kategori', label: 'Kelola Kategori', icon: Tag },
    { href: '/admin/laporan', label: 'Laporan Penjualan', icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    router.push('/');
  };

  return (
    <aside className="admin-sidebar">
      <div style={{ padding: '0 12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
          Administrasi
        </h3>
        <span style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 700, letterSpacing: '0.5px' }}>
          Rajajutan Arkana
        </span>
      </div>

      <div className="sidebar-title">Menu Utama</div>

      {links.map(item => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'left' }}
        >
          <LogOut size={18} />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  );
}

