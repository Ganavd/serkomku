'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MiniDatePicker({
  value, // string 'YYYY-MM-DD' or null
  onChange,
  onSelectAndNext, // callback when date is picked to auto open next input
  placeholder = 'Pilih Tanggal',
  isOpen: controlledIsOpen,
  onToggleOpen
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const containerRef = useRef(null);

  // Parse initial year & month from value or current date
  const initialDate = value ? new Date(value) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear() || 2026);
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth() || 8); // default Sep (8)

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  const setIsOpen = (openState) => {
    if (isControlled && onToggleOpen) {
      onToggleOpen(openState);
    } else {
      setInternalIsOpen(openState);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format date display: e.g. "01 Sep 2026"
  const formatDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = MONTH_NAMES_SHORT[parseInt(parts[1], 10) - 1] || parts[1];
      const d = parts[2].padStart(2, '0');
      return `${d} ${m} ${y}`;
    }
    return dateStr;
  };

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDate = (year, monthIndex, day) => {
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    onChange(dateStr);
    setIsOpen(false);

    if (onSelectAndNext) {
      onSelectAndNext(dateStr);
    }
  };

  // Today's Date String for Highlighting
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Generate Prev Month trailing days
  const prevMonthDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  // Generate Next Month leading days to fill 35 or 42 slots
  const totalRendered = firstDayIndex + daysInMonth;
  const remainingSlots = (totalRendered % 7 === 0) ? 0 : 7 - (totalRendered % 7);
  const nextMonthDays = [];
  for (let i = 1; i <= remainingSlots; i++) {
    nextMonthDays.push(i);
  }

  // Range Tahun (Bisa langsung lompat ke masa lalu atau masa depan tanpa klik < berulang kali)
  const years = [];
  for (let y = 2018; y <= 2035; y++) {
    years.push(y);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Input Display Button - Sipkesmas Style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          minHeight: '40px',
          backgroundColor: '#ffffff',
          border: isOpen ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
          borderRadius: '8px',
          fontSize: '0.88rem',
          fontWeight: value ? 600 : 500,
          color: value ? '#0f172a' : '#64748b',
          cursor: 'pointer',
          minWidth: '160px',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none'
        }}
      >
        <CalendarIcon size={16} color="#64748b" />
        <span>{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {/* Mini Calendar Popup - Sipkesmas Reference with Month & Year Selectors */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 200,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15), 0 6px 12px -3px rgba(15, 23, 42, 0.08)',
            padding: '16px',
            width: '280px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header Kalender: Chevron Kiri, Dropdown Cepat Bulan & Tahun, Chevron Kanan */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            padding: '0 2px'
          }}>
            {/* Tombol Bulan Sebelumnya */}
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Bulan sebelumnya"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                transition: 'background-color 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Pilihan Cepat Bulan & Tahun (Langsung Pilih Tanpa Manual Klik < Berulang-ulang) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {/* Dropdown Bulan */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                style={{
                  padding: '3px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              {/* Dropdown Tahun */}
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                style={{
                  padding: '3px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Tombol Bulan Berikutnya */}
            <button
              type="button"
              onClick={handleNextMonth}
              title="Bulan berikutnya"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                transition: 'background-color 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Grid Nama Hari (Su Mo Tu We Th Fr Sa - Netral Tanpa Merah) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            {DAY_NAMES.map((dn) => (
              <span
                key={dn}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#64748b',
                  userSelect: 'none'
                }}
              >
                {dn}
              </span>
            ))}
          </div>

          {/* Grid Tanggal Sipkesmas (Icon Kotak / Rounded Rectangle) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '3px',
            textAlign: 'center'
          }}>
            {/* Hari-hari sisa bulan sebelumnya (Muted Grey) */}
            {prevMonthDays.map((d) => {
              const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
              const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
              return (
                <button
                  key={`prev-${d}`}
                  type="button"
                  onClick={() => handleSelectDate(prevYear, prevMonthIdx, d)}
                  style={{
                    height: '32px',
                    width: '32px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.1s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {d}
                </button>
              );
            })}

            {/* Hari-hari dalam bulan aktif */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const mm = String(currentMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateStr = `${currentYear}-${mm}-${dd}`;
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr && !isSelected;

              return (
                <button
                  key={`cur-${day}`}
                  type="button"
                  onClick={() => handleSelectDate(currentYear, currentMonth, day)}
                  style={{
                    height: '32px',
                    width: '32px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSelected
                      ? '#0284c7'
                      : isToday
                        ? '#e0f2fe'
                        : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : isToday
                        ? '#0369a1'
                        : '#1e293b',
                    fontWeight: isSelected ? 700 : (isToday ? 700 : 500),
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isToday) e.target.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isToday) e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  {day}
                </button>
              );
            })}

            {/* Hari-hari awal bulan berikutnya (Muted Grey) */}
            {nextMonthDays.map((d) => {
              const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
              const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
              return (
                <button
                  key={`next-${d}`}
                  type="button"
                  onClick={() => handleSelectDate(nextYear, nextMonthIdx, d)}
                  style={{
                    height: '32px',
                    width: '32px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.1s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
