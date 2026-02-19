/**
 * Lazy imports pour optimiser le bundle size
 * Ces modules volumineux sont chargés dynamiquement au besoin
 */

export const lazyLoadJsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
};

export const lazyLoadHtml2Canvas = async () => {
  const html2canvas = await import('html2canvas');
  return html2canvas.default;
};

export const lazyLoadPdfLib = async () => {
  const pdfLib = await import('pdf-lib');
  return pdfLib;
};

export const lazyLoadRecharts = async () => {
  const recharts = await import('recharts');
  return recharts;
};
