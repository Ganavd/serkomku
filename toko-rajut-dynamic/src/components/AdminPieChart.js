'use client';

import React, { useState } from 'react';
import { PieChart as PieIcon, Layers, TrendingUp } from 'lucide-react';

const PALETTE = [
  '#2563eb', // Royal Blue
  '#0d9488', // Teal
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#84cc16', // Lime
  '#0ea5e9', // Sky
  '#e11d48', // Rose
  '#a855f7', // Purple
  '#14b8a6', // Dark Teal
  '#eab308', // Yellow
  '#3b82f6', // Bright Blue
  '#f43f5e', // Bright Rose
  '#22c55e', // Green
  '#a78bfa', // Lavender
  '#fb923c', // Warm Orange
  '#2dd4bf', // Mint
  '#64748b', // Slate
  '#94a3b8'  // Light Slate
];

function getCoordinatesForPercent(percent, radius) {
  const angle = percent * 2 * Math.PI - Math.PI / 2;
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  return [x, y];
}

function makeDonutSlicePath(startPercent, endPercent, innerRadius, outerRadius) {
  const delta = endPercent - startPercent;
  if (delta >= 0.9999) {
    return `M 0 -${outerRadius} A ${outerRadius} ${outerRadius} 0 1 1 0 ${outerRadius} A ${outerRadius} ${outerRadius} 0 1 1 0 -${outerRadius} M 0 -${innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 0 ${innerRadius} A ${innerRadius} ${innerRadius} 0 1 0 0 -${innerRadius} Z`;
  }

  const [startX, startY] = getCoordinatesForPercent(startPercent, outerRadius);
  const [endX, endY] = getCoordinatesForPercent(endPercent, outerRadius);
  const [startInnerX, startInnerY] = getCoordinatesForPercent(startPercent, innerRadius);
  const [endInnerX, endInnerY] = getCoordinatesForPercent(endPercent, innerRadius);

  const largeArcFlag = delta > 0.5 ? 1 : 0;

  return [
    `M ${startX} ${startY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    `L ${endInnerX} ${endInnerY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInnerX} ${startInnerY}`,
    'Z'
  ].join(' ');
}

export default function AdminPieChart({
  title = 'Diagram Penjualan',
  subtitle = 'Statistik distribusi penjualan',
  icon: Icon = PieIcon,
  data = [], // [{ label: string, value: number, subLabel?: string }]
  unitLabel = 'terjual',
  emptyMessage = 'Belum ada data penjualan tercatat'
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Hitung total seluruh item
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);

  // Tetapkan warna konsisten untuk tiap item
  const coloredData = data.map((item, originalIdx) => ({
    ...item,
    color: PALETTE[originalIdx % PALETTE.length]
  }));

  // Hitung slice angles untuk pie chart (hanya untuk item yang value > 0)
  let cumulativePercent = 0;
  const slices = [];

  coloredData.forEach((item, index) => {
    if (totalValue > 0 && item.value > 0) {
      const slicePercent = item.value / totalValue;
      const startPercent = cumulativePercent;
      const endPercent = cumulativePercent + slicePercent;
      cumulativePercent += slicePercent;

      slices.push({
        ...item,
        index,
        percentage: slicePercent * 100,
        startPercent,
        endPercent
      });
    }
  });

  const activeItem = hoveredIndex !== null ? coloredData[hoveredIndex] : null;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '22px 24px',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header Chart */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Total Summary Badge */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#334155'
        }}>
          Total: <span style={{ color: '#2563eb', fontWeight: 700 }}>{totalValue.toLocaleString('id-ID')}</span> {unitLabel}
        </div>
      </div>

      {/* Main Chart Graphic & Legends Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '190px 1fr',
        gap: '16px',
        alignItems: 'center',
        flex: 1
      }}>
        {/* Sisi Kiri: SVG Donut Pie */}
        <div style={{ position: 'relative', width: '190px', height: '190px', margin: '0 auto' }}>
          <svg
            viewBox="-100 -100 200 200"
            style={{ width: '100%', height: '100%', transform: 'rotate(-0.01deg)' }}
          >
            {totalValue === 0 ? (
              // Empty State Circle
              <circle
                cx="0"
                cy="0"
                r="70"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="24"
                strokeDasharray="4 4"
              />
            ) : (
              // Slices
              slices.map((slice) => {
                const isHovered = hoveredIndex === slice.index;
                const innerR = isHovered ? 45 : 48;
                const outerR = isHovered ? 86 : 80;
                const pathD = makeDonutSlicePath(slice.startPercent, slice.endPercent, innerR, outerR);

                return (
                  <path
                    key={slice.index}
                    d={pathD}
                    fill={slice.color}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                      opacity: hoveredIndex === null || isHovered ? 1 : 0.45
                    }}
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })
            )}

            {/* Inner Center Circle for Modern Look */}
            <circle cx="0" cy="0" r="44" fill="#ffffff" />
          </svg>

          {/* Center Info Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '10px'
          }}>
            {activeItem ? (
              <>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#64748b',
                  maxWidth: '80px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activeItem.label}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: activeItem.color }}>
                  {activeItem.value}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  {totalValue > 0 ? ((activeItem.value / totalValue) * 100).toFixed(1) : 0}%
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {totalValue}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                  {unitLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Legends List (Scrollable for All Items) */}
        <div style={{
          maxHeight: '230px',
          overflowY: 'auto',
          paddingRight: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {coloredData.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              {emptyMessage}
            </div>
          ) : (
            coloredData.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              const percent = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: isHovered ? '#f1f5f9' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: '1px solid',
                    borderColor: isHovered ? '#cbd5e1' : 'transparent'
                  }}
                >
                  {/* Left: Color bullet & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, marginRight: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '3px',
                      backgroundColor: item.color,
                      flexShrink: 0
                    }} />
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isHovered ? 700 : 500,
                      color: isHovered ? '#0f172a' : '#334155',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.label}
                    </span>
                  </div>

                  {/* Right: Quantity & Percentage */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                      {item.value} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>{unitLabel}</span>
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: item.value > 0 ? item.color : '#94a3b8',
                      backgroundColor: item.value > 0 ? `${item.color}15` : '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      minWidth: '42px',
                      textAlign: 'right'
                    }}>
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
