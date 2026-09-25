'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  onPageChange
}) {
  if (totalItems === 0) return null;

  // Generate page numbers to show (e.g. windowed if totalPages > 7)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '16px',
        padding: '6px 2px',
        fontSize: '0.85rem',
        color: '#64748b'
      }}
    >
      {/* Keterangan Data */}
      <div>
        Menampilkan <strong>{startIndex + 1}</strong> &mdash; <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> data
      </div>

      {/* Kontrol Navigasi Halaman */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Tombol Sebelumnya */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              backgroundColor: currentPage <= 1 ? '#f8fafc' : '#ffffff',
              color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            <ChevronLeft size={14} /> Sebelumnya
          </button>

          {/* Daftar Nomor Halaman */}
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: '0 4px',
                    color: '#94a3b8',
                    fontWeight: 600,
                    userSelect: 'none'
                  }}
                >
                  &hellip;
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  padding: '0 8px',
                  borderRadius: '7px',
                  border: isActive ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: isActive ? '#2563eb' : '#ffffff',
                  color: isActive ? '#ffffff' : '#0f172a',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
              >
                {p}
              </button>
            );
          })}

          {/* Tombol Berikutnya */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              backgroundColor: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
              color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            Berikutnya <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
