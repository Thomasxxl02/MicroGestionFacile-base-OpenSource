import { z } from 'zod';

export const DocumentTypeSchema = z.enum(['invoice', 'quote', 'order', 'credit_note']);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const TaxCategorySchema = z.enum([
  'MARCHANDISE', // Vente de marchandises / Fourniture de logement
  'SERVICE_BIC', // Prestations de services BIC
  'SERVICE_BNC', // Prestations de services BNC
]);

export type TaxCategory = z.infer<typeof TaxCategorySchema>;

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export const InvoiceStatusSchema = z.nativeEnum(InvoiceStatus);
