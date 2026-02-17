import { z } from 'zod';
import { TaxCategorySchema } from './common.types';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().optional(), // Référence / SKU
  brand: z.string().optional(), // Marque
  shortDescription: z.string().optional(), // Accroche
  description: z.string(), // Description détaillée (Markdown)
  price: z.number(), // Prix HT
  taxRate: z.number().default(20), // TVA %
  ecoParticipation: z.number().optional(), // Éco-participation TTC
  repairabilityIndex: z.number().min(0).max(10).optional(), // Indice de réparabilité 0-10
  legalWarranty: z.string().default('2 ans'), // Garantie légale
  origin: z.string().default('France'), // Origine / Fabriqué en
  unit: z.string(), // Unité de vente (obligatoire sur les factures)
  type: z.enum(['service', 'product']),
  taxCategory: TaxCategorySchema, // Lien direct avec les types de revenus micro-entrepreneur
  stock: z.number().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
