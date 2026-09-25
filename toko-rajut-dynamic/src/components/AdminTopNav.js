'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminTopNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    router.push('/');
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      height: '76px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 32px',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
      boxSizing: 'border-box'
    }}>
      {/* Icon User Lebih Besar (Tanpa Panah v) & Dropdown Menu */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Profil Admin & Akses"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            transition: 'transform 0.15s'
          }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #bfdbfe',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.12)'
          }}>
            <User size={24} />
          </div>
        </button>

        {/* Dropdown Popup */}
        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '180px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            padding: '8px',
            zIndex: 100,
            animation: 'fadeIn 0.15s ease-out'
          }}>
            {/* Role Info Header */}
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Admin
              </span>
            </div>

            {/* Tombol Keluar (Logout) */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#ef4444',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
