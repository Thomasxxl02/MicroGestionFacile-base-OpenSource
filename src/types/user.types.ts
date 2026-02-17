import { z } from 'zod';

export const UserProfileSchema = z.object({
  companyName: z.string(),
  legalForm: z.string().optional(), // ex: EURL, SASU
  capital: z.number().optional(),
  siret: z
    .string()
    .length(14)
    .or(z.string().regex(/^\d{3} \d{3} \d{3} \d{5}$/)), // Validation stricte SIRET
  registrationNumber: z.string().optional(), // Numéro RCS
  registrationCity: z.string().optional(), // Ville RCS
  address: z.string(),
  email: z.string().email(),
  phone: z.string(),
  website: z.string().optional(),
  bankAccount: z.string().optional(), // IBAN
  bic: z.string().optional(),
  tvaNumber: z.string().optional(), // Numéro de TVA intracommunautaire
  legalMentions: z.string().optional(),
  // IA & Assistance
  defaultAI: z.enum(['gemini', 'chatgpt', 'claude', 'mistral']).default('gemini').optional(),
  geminiKey: z.string().optional(),
  chatgptKey: z.string().optional(),
  claudeKey: z.string().optional(),
  mistralKey: z.string().optional(),
  defaultInvoiceNotes: z.string().optional(),
  logo: z.string().optional(),
  signature: z.string().optional(), // Image de signature (Data URL)
  themeColor: z.string().optional(),
  typography: z.enum(['sans', 'serif']).optional(),
  invoicePrefix: z.string().optional(),
  quotePrefix: z.string().optional(),
  invoiceStartNumber: z.number().optional(),
  quoteStartNumber: z.number().optional(),
  defaultLanguage: z.enum(['fr', 'en']).optional(),
  defaultPaymentDeadline: z.number().optional(),
  activityType: z.enum(['sales', 'services', 'mixed']).default('services'),
  isVatExempt: z.boolean().default(true),
  hasAccre: z.boolean().default(false),
  hasVersementLiberatoire: z.boolean().default(false),
  contributionQuarter: z.enum(['monthly', 'quarterly']).default('monthly'),
  isConfigured: z.boolean().default(false),
  backupFrequency: z.enum(['none', 'weekly', 'monthly']).default('none'),
  lastAutoBackupDate: z.string().optional(),
  defaultCurrency: z.string().default('EUR'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
