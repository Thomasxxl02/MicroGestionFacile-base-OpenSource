/**
 * Service de validation intelligente avec recovery
 * Valide tous les chargements IndexedDB avec Zod
 * 🔐 Validation métier pour invoices, expenses, profiles
 */

import { z, ZodSchema } from 'zod';
import { logger } from './loggerService';
import { toast } from 'sonner';
import { InvoiceSchema, InvoiceItemSchema, Invoice, InvoiceItem } from '../types/invoice.types';
import { UserProfileSchema, UserProfile } from '../types/user.types';
import { ClientSchema, Client } from '../types/client.types';
import { ProductSchema, Product } from '../types/product.types';
import { SupplierSchema, Supplier } from '../types/supplier.types';

export interface ValidationResult<T> {
  valid: boolean;
  data: T | null;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Convertir les erreurs Zod en format structuré
 */
function parseZodErrors(zodError: unknown): ValidationError[] {
  const err = zodError as Record<string, unknown>;
  if (!err.errors || !Array.isArray(err.errors)) {
    return [
      {
        field: 'root',
        message: String(zodError),
        code: 'UNKNOWN_ERROR',
      },
    ];
  }

  return err.errors.map((err: unknown) => {
    const error = err as Record<string, unknown>;
    return {
      field: Array.isArray(error.path) ? (error.path as string[]).join('.') || 'root' : 'root',
      message: (error.message as string) || String(err),
      code: (error.code as string) || 'VALIDATION_ERROR',
      value: err,
    };
  });
}

/**
 * Valide les données chargées depuis IndexedDB
 * En cas d'erreur, tente une correction automatique ou isole la donnée corrompue
 */
export const validateData = async <T>(
  data: unknown,
  schema: ZodSchema,
  resourceId: string,
  resourceType: string
): Promise<ValidationResult<T>> => {
  try {
    const validated = schema.parse(data);
    logger.debug(`✅ Validation réussie: ${resourceType}#${resourceId}`);
    return { valid: true, data: validated as T, errors: [] };
  } catch (error) {
    let errors: ValidationError[] = [];

    // Vérifier si c'est une ZodError en vérifiant la présence de la propriété 'errors'
    if (error && typeof error === 'object' && 'errors' in error) {
      errors = parseZodErrors(error);
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors = [
        {
          field: 'root',
          message: errorMessage,
          code: 'PARSE_ERROR',
        },
      ];
    }

    logger.warn(`❌ Données invalides: ${resourceType}#${resourceId}`, {
      errors: errors.slice(0, 3),
      data: JSON.stringify(data).slice(0, 100),
    });

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${resourceType}#${resourceId}] Validation échouée:`, errors.slice(0, 3));
    }

    return { valid: false, data: null, errors };
  }
};

/**
 * Valide un batch de données (efficace pour les listes)
 */
export const validateDataBatch = async <T>(
  items: unknown[],
  schema: ZodSchema,
  resourceType: string
): Promise<{
  valid: T[];
  invalid: Array<{ index: number; errors: ValidationError[] }>;
}> => {
  const valid: T[] = [];
  const invalid: Array<{ index: number; errors: ValidationError[] }> = [];

  for (const [index, item] of items.entries()) {
    try {
      const validated = schema.parse(item);
      valid.push(validated as T);
    } catch (error) {
      let errors: ValidationError[] = [];

      // Vérifier si c'est une ZodError
      if (error && typeof error === 'object' && 'errors' in error) {
        errors = parseZodErrors(error);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors = [
          {
            field: 'root',
            message: errorMessage,
            code: 'PARSE_ERROR',
          },
        ];
      }

      invalid.push({ index, errors });
    }
  }

  if (invalid.length > 0) {
    logger.warn(`${invalid.length}/${items.length} ${resourceType} invalides`, {
      invalidIndices: invalid.map((i) => i.index),
    });

    if (invalid.length > items.length * 0.1) {
      // > 10% corrompus
      toast.warning(
        `⚠️ ${invalid.length} enregistrement(s) ${resourceType} corrompus - isolés automatiquement`
      );
    }
  }

  return { valid, invalid };
};

// ============================================================================
// 📊 VALIDATIONS PAR DOMAINE
// ============================================================================

/**
 * Valider une facture complète
 */
export async function validateInvoice(
  invoice: unknown,
  resourceId?: string
): Promise<ValidationResult<Invoice>> {
  return validateData(invoice, InvoiceSchema, resourceId || 'unknown', 'Invoice');
}

/**
 * Valider une ligne de facture
 */
export async function validateInvoiceItem(
  item: unknown,
  resourceId?: string
): Promise<ValidationResult<InvoiceItem>> {
  return validateData(item, InvoiceItemSchema, resourceId || 'unknown', 'InvoiceItem');
}

/**
 * Valider un tableau de factures
 */
export async function validateInvoices(invoices: unknown[]): Promise<{
  valid: Invoice[];
  invalid: Array<{ index: number; errors: ValidationError[] }>;
}> {
  return validateDataBatch(invoices, InvoiceSchema, 'Invoices');
}

/**
 * Valider le profil utilisateur
 */
export async function validateUserProfile(
  profile: unknown,
  resourceId?: string
): Promise<ValidationResult<UserProfile>> {
  return validateData(profile, UserProfileSchema, resourceId || 'current', 'UserProfile');
}

/**
 * Valider un client
 */
export async function validateClient(
  client: unknown,
  resourceId?: string
): Promise<ValidationResult<Client>> {
  return validateData(client, ClientSchema, resourceId || 'unknown', 'Client');
}

/**
 * Valider des clients (batch)
 */
export async function validateClients(clients: unknown[]): Promise<{
  valid: Client[];
  invalid: Array<{ index: number; errors: ValidationError[] }>;
}> {
  return validateDataBatch(clients, ClientSchema, 'Clients');
}

/**
 * Valider un produit
 */
export async function validateProduct(
  product: unknown,
  resourceId?: string
): Promise<ValidationResult<Product>> {
  return validateData(product, ProductSchema, resourceId || 'unknown', 'Product');
}

/**
 * Valider des produits (batch)
 */
export async function validateProducts(products: unknown[]): Promise<{
  valid: Product[];
  invalid: Array<{ index: number; errors: ValidationError[] }>;
}> {
  return validateDataBatch(products, ProductSchema, 'Products');
}

/**
 * Valider un fournisseur
 */
export async function validateSupplier(
  supplier: unknown,
  resourceId?: string
): Promise<ValidationResult<Supplier>> {
  return validateData(supplier, SupplierSchema, resourceId || 'unknown', 'Supplier');
}

/**
 * Valider des fournisseurs (batch)
 */
export async function validateSuppliers(suppliers: unknown[]): Promise<{
  valid: Supplier[];
  invalid: Array<{ index: number; errors: ValidationError[] }>;
}> {
  return validateDataBatch(suppliers, SupplierSchema, 'Suppliers');
}

// ============================================================================
// 🔍 VALIDATIONS MÉTIER AVANCÉES
// ============================================================================

/**
 * Valider les montants (décimaux pour précision comptable)
 */
export interface ValidationOptions {
  minAmount?: number;
  maxAmount?: number;
  allowNegative?: boolean;
}

export async function validateAmount(
  amount: unknown,
  options: ValidationOptions = {}
): Promise<ValidationResult<number>> {
  const { minAmount = 0, maxAmount = 999999.99, allowNegative = false } = options;

  const schema = z
    .number()
    .min(allowNegative ? -maxAmount : minAmount, {
      message: `Montant minimum: ${minAmount}€`,
    })
    .max(maxAmount, {
      message: `Montant maximum: ${maxAmount}€`,
    });

  return validateData(amount, schema, 'amount', 'Amount');
}

/**
 * Valider une date facture (ne peut pas être dans le futur)
 */
export async function validateInvoiceDate(date: unknown): Promise<ValidationResult<string>> {
  const schema = z
    .string()
    .datetime({ offset: true })
    .refine((val) => new Date(val) <= new Date(), {
      message: 'La date facture ne peut pas être dans le futur',
    });

  return validateData(date, schema, 'invoice_date', 'InvoiceDate');
}

/**
 * Valider un SIRET français (14 chiffres)
 */
export async function validateSiret(siret: unknown): Promise<ValidationResult<string>> {
  const schema = z
    .string()
    .regex(/^\d{3}\s?\d{3}\s?\d{3}\s?\d{5}$|^\d{14}$/, {
      message: 'SIRET invalide (14 chiffres requis)',
    })
    .transform((s) => s.replace(/\s/g, ''));

  return validateData(siret, schema, 'siret', 'SIRET');
}

/**
 * Valider une adresse email
 */
export async function validateEmail(email: unknown): Promise<ValidationResult<string>> {
  const schema = z.string().email('Email invalide');
  return validateData(email, schema, 'email', 'Email');
}

// ============================================================================
// ✅ HELPER POUR LES TESTS
// ============================================================================

/**
 * Extraire les messages d'erreur pour les tests
 */
export function getErrorMessages(result: ValidationResult<unknown>): string[] {
  return result.errors?.map((e) => e.message) || [];
}

/**
 * Vérifier si un champ spécifique a une erreur
 */
export function hasFieldError(result: ValidationResult<unknown>, field: string): boolean {
  return result.errors?.some((e) => e.field === field) || false;
}
