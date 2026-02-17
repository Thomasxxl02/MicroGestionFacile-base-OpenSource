import { z } from 'zod';

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  address: z.string(),
  country: z.string().default('FR'),
  currency: z.string().default('EUR'),
  language: z.string().default('fr'),
  taxType: z.enum(['DOMESTIC', 'EU_B2B', 'EXPORT']).default('DOMESTIC'),
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),
  taxId: z.string().optional(), // For Non-EU clients (EIN, etc.)
  phone: z.string().optional(),
  notes: z.string().optional(),
  archived: z.boolean().optional(),
  paymentTerms: z.number().default(30),
});

export type Client = z.infer<typeof ClientSchema>;
