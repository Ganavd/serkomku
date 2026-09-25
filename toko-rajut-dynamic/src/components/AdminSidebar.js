'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Tag, FileText } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/produk', label: 'Kelola Produk', icon: Package },
    { href: '/admin/kategori', label: 'Kelola Kategori', icon: Tag },
    { href: '/admin/laporan', label: 'Laporan Penjualan', icon: FileText },
  ];

  return (
    <aside className="admin-sidebar" style={{
      width: '260px',
      minWidth: '260px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 50
    }}>
      {/* Header Sidebar Kiri (Tinggi 76px sejajar dengan TopNav, Icon Besar 54px + Teks RAJAJUTAN ARKANA Atas-Bawah) */}
      <div style={{
        height: '76px',
        padding: '0 16px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxSizing: 'border-box'
      }}>
        {/* Icon Besar Memenuhi Box Kiri */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          border: '1.5px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
          flexShrink: 0
        }}>
          <img 
            src="/Favicon.io" 
            alt="Icon Rajajutan" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              e.target.src = '/Logo-Rajajutan.png';
            }}
          />
        </div>

        {/* Teks RAJAJUTAN (Atas) & ARKANA (Bawah) Simetris dengan Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{
            fontSize: '1.15rem',
            color: '#0f172a',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '0.4px',
            textTransform: 'uppercase'
          }}>
            RAJAJUTAN
          </span>
          <span style={{
            fontSize: '1.05rem',
            color: '#2563eb',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginTop: '2px'
          }}>
            ARKANA
          </span>
        </div>
      </div>

      {/* Body Menu Navigation */}
      <div style={{ padding: '18px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="sidebar-title" style={{ margin: '4px 8px 8px' }}>MENU UTAMA</div>

        {links.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#2563eb' : '#475569',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={18} color={isActive ? '#2563eb' : '#64748b'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Minimalis */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
        Panel Pengelola Sistem
      </div>
    </aside>
  );
}
