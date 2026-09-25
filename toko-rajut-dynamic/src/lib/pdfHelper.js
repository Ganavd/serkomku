import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateReceiptPDF(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element struk tidak ditemukan');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 80; // 80mm standard receipt width in pdf
  const pageHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [imgWidth + 10, pageHeight + 10]
  });

  pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, pageHeight);
  return pdf;
}

export async function downloadReceiptPDF(elementId, filename = 'Transaksi Belanja Anda.pdf') {
  const pdf = await generateReceiptPDF(elementId);
  pdf.save(filename);
}

export async function generateReceiptPDFBase64(elementId) {
  const pdf = await generateReceiptPDF(elementId);
  // Ambil base64 data URI
  const dataUri = pdf.output('datauristring');
  // Ambil raw base64 string tanpa header data:...;base64,
  const base64 = dataUri.split(',')[1];
  return { dataUri, base64 };
}
