'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function Barcode({ value, width = 1.6, height = 50, displayValue = false }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 12,
          font: 'monospace',
          textMargin: 4,
          margin: 6,
          background: '#ffffff',
          lineColor: '#0f172a'
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [value, width, height, displayValue]);

  return <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto', margin: '0 auto', display: 'block' }} />;
}
