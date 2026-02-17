import { z } from 'zod';

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  siret: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(), // ex: 651 - Logiciels/SaaS
  notes: z.string().optional(),
  // Nouveaux champs fiscaux et bancaires
  iban: z.string().optional(),
  bic: z.string().optional(),
  vatNumber: z.string().optional(),
  origin: z.enum(['FR', 'EU', 'NON_EU']).default('FR'),
  country: z.string().default('FR'),
  accountingCode: z.string().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string().default('EUR'),
  status: z.enum(['PENDING', 'VALIDATED', 'REJECTED']).default('PENDING'),
});

export type Supplier = z.infer<typeof SupplierSchema>;
