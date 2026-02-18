import { toast } from 'sonner';
import { logger } from './loggerService';
import { InvoiceItem } from '../types';

const BACKEND_URL = 'http://localhost:4000';

interface InvoicePayload {
  number: string;
  date: string;
  clientName: string;
  items: InvoiceItem[];
  total: number;
  taxAmount: number;
  integrityHash: string;
  facturX_XML?: string;
  [key: string]: string | number | boolean | InvoiceItem[] | undefined;
}

export const generateImmutablePDF_Server = async (data: InvoicePayload) => {
  const toastId = toast.loading('Génération du PDF immuable (Serveur)...');
  try {
    const response = await fetch(`${BACKEND_URL}/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Erreur serveur');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture-${data.number}.pdf`;
    link.click();
    toast.success('PDF immuable généré avec succès', { id: toastId });
  } catch (error) {
    logger.error(
      'PDF Server generation failed',
      error instanceof Error ? error : new Error(String(error))
    );
    toast.error('Le service backend est indisponible. Utilisation de la génération locale.', {
      id: toastId,
    });
    return false;
  }
  return true;
};

export const generatePDF = async (elementId: string, filename: string, facturX_XML?: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const toastId = toast.loading('Génération du PDF en cours...');

  try {
    // Dynamic imports to reduce initial bundle size
    const [{ default: jsPDF }, { default: html2canvas }, { PDFDocument }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
      import('pdf-lib'),
    ]);

    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced from 2 for better balance between quality and file size
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Optimize cloned element for PDF capture if needed
        const el = clonedDoc.getElementById(elementId);
        if (el) el.style.boxShadow = 'none';
      },
    });

    const imgData = canvas.toDataURL('image/png');

    // Calculate PDF dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    let finalPdfBytes: Uint8Array;

    // Factur-X embedding if XML is provided
    if (facturX_XML) {
      const pdfBytes = pdf.output('arraybuffer');
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Attach the XML file (Requirement for Factur-X / PDF/A-3)
      await pdfDoc.attach(facturX_XML, 'factur-x.xml', {
        mimeType: 'application/xml',
        description: 'Factur-X Structured Data',
        creationDate: new Date(),
        modificationDate: new Date(),
      });

      finalPdfBytes = await pdfDoc.save();
      logger.info('Factur-X XML successfully embedded');
    } else {
      finalPdfBytes = new Uint8Array(pdf.output('arraybuffer'));
    }

    // Download the final hybrid PDF
    const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.pdf`;
    link.click();

    toast.success('Le PDF hybride (Factur-X) a été exporté avec succès', { id: toastId });
  } catch (error) {
    logger.error(
      'PDF generation failed',
      error instanceof Error ? error : new Error(String(error))
    );
    toast.error('Une erreur est survenue lors de la génération du PDF.', { id: toastId });
  }
};
