export function parseProduct(prod) {
  if (!prod) return prod;
  const rawDesc = prod.deskripsi || '';
  const isInactiveFromDesc = rawDesc.includes('<!--STATUS:NONAKTIF-->') || rawDesc.includes('[NONAKTIF]');
  const cleanDesc = rawDesc
    .replace('<!--STATUS:NONAKTIF-->', '')
    .replace('[NONAKTIF]', '')
    .trim();

  // Prioritaskan kolom is_active jika ada di DB, fallback ke tag deskripsi
  const isActive = (prod.is_active !== undefined && prod.is_active !== null) 
    ? Boolean(prod.is_active) 
    : !isInactiveFromDesc;

  return {
    ...prod,
    is_active: isActive,
    deskripsi: cleanDesc,
    deskripsi_raw: rawDesc
  };
}

export function formatProductDescription(deskripsi, isActive) {
  const cleanDesc = (deskripsi || '')
    .replace('<!--STATUS:NONAKTIF-->', '')
    .replace('[NONAKTIF]', '')
    .trim();

  if (isActive === false) {
    return cleanDesc ? `${cleanDesc}\n<!--STATUS:NONAKTIF-->` : '<!--STATUS:NONAKTIF-->';
  }
  return cleanDesc;
}
