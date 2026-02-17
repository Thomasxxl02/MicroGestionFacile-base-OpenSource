import { z } from 'zod';
import { DocumentTypeSchema, InvoiceStatus, TaxCategorySchema } from './common.types';

export const InvoiceItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  description: z.string(),
  quantity: z.number().positive(),
  unit: z.string(), // Unité de vente (obligatoire sur les factures)
  unitPrice: z.number(),
  unitPriceCents: z.number().int().optional(), // Monetary Standard
  taxRate: z.number().optional(),
  discount: z.number().optional(),
  isSection: z.boolean().optional(),
  category: TaxCategorySchema.default('SERVICE_BIC'),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string(), // uuid recommended
  type: DocumentTypeSchema,
  number: z
    .string()
    .regex(/^[A-Z]{2,3}-\d{4}-\d{3,4}$/)
    .or(z.string()), // FAC-2026-001
  linkedDocumentId: z.string().optional(),
  clientId: z.string(),
  items: z.array(InvoiceItemSchema),
  status: z.nativeEnum(InvoiceStatus).or(z.string()),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  subtotal: z.number().optional(),
  taxAmount: z.number().optional(),
  total: z.number(),
  language: z.enum(['fr', 'en']).optional(),
  date: z.string(), // issueDate
  dueDate: z.string(),
  serviceDate: z.string().optional(),
  reminderDate: z.string().optional(),
  discount: z.number().optional(),
  shipping: z.number().optional(),
  deposit: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentTerms: z.string().optional(),
  reference: z.string().optional(),
  stockUpdated: z.boolean().optional(),
  integrityHash: z.string().optional(), // SHA-256 for audit trail
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
