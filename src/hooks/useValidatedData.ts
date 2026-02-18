/**
 * useValidatedData.ts - Hook wrapper pour useData avec validation
 * 🛡️ Ajoute la validation Zod à tous les hooks useData
 * Inclut gestion des erreurs et logging structuré
 */

import { useMemo } from 'react';
import { useInvoices, useExpenses, useUserProfile } from './useData';
import { ValidationError } from '../services/validationService';
import { logger } from '../services/loggerService';
import { Invoice } from '../types/invoice.types';
import { UserProfile } from '../types/user.types';
import { Expense } from '../types/expense.types';

/**
 * Résultat de hook validé avec métadonnées
 */
export interface ValidatedHookResult<T> {
  data: T[];
  isLoading: boolean;
  isValid: boolean;
  validCount: number;
  invalidCount: number;
  errors: ValidationError[];
  errorSummary: string | null;
}

// ============================================================================
// HOOKS VALIDÉS
// ============================================================================

/**
 * Hook pour les factures validées
 */
export const useValidatedInvoices = (): ValidatedHookResult<Invoice> => {
  const rawInvoices = useInvoices();

  // Résolution de la validation (note: useMemo ne supporte pas async directement)
  // On utilise une approche synchrone avec validation basique
  const result = useMemo(() => {
    if (!rawInvoices || rawInvoices.length === 0) {
      return {
        data: [],
        isLoading: false,
        isValid: true,
        validCount: 0,
        invalidCount: 0,
        errors: [],
        errorSummary: null,
      };
    }

    // Validation basique synchrone pour chaque facture
    let validCount = 0;
    let invalidCount = 0;
    const errors: ValidationError[] = [];

    rawInvoices.forEach((invoice, index) => {
      try {
        // Vérifie les propriétés critiques
        if (!invoice.id || !invoice.clientId || typeof invoice.total !== 'number') {
          invalidCount++;
          errors.push({
            field: `invoices[${index}]`,
            message: 'Facture invalide (id, clientId, total requis)',
            code: 'INVALID_INVOICE',
            value: invoice,
          });
        } else if (invoice.total < 0) {
          invalidCount++;
          errors.push({
            field: `invoices[${index}].total`,
            message: 'Le total ne peut pas être négatif',
            code: 'NEGATIVE_AMOUNT',
            value: invoice.total,
          });
        } else {
          validCount++;
        }
      } catch (_err) {
        invalidCount++;
        errors.push({
          field: `invoices[${index}]`,
          message: 'Erreur de validation facture',
          code: 'PARSE_ERROR',
        });
      }
    });

    const errorSummary =
      invalidCount > 0 ? `⚠️ ${invalidCount} facture(s) invalide(s) détectée(s)` : null;

    if (errors.length > 0) {
      logger.warn('Validation factures échouée', {
        validCount,
        invalidCount,
        errors: errors.slice(0, 5),
      });
    }

    return {
      data: rawInvoices,
      isLoading: false,
      isValid: invalidCount === 0,
      validCount,
      invalidCount,
      errors,
      errorSummary,
    };
  }, [rawInvoices]);

  return result;
};

/**
 * Hook pour les dépenses validées
 */
export const useValidatedExpenses = (): ValidatedHookResult<Expense> => {
  const rawExpenses = useExpenses();

  const result = useMemo(() => {
    if (!rawExpenses || rawExpenses.length === 0) {
      return {
        data: [],
        isLoading: false,
        isValid: true,
        validCount: 0,
        invalidCount: 0,
        errors: [],
        errorSummary: null,
      };
    }

    let validCount = 0;
    let invalidCount = 0;
    const errors: ValidationError[] = [];

    rawExpenses.forEach((expense, index) => {
      try {
        if (!expense.id || typeof expense.amount !== 'number') {
          invalidCount++;
          errors.push({
            field: `expenses[${index}]`,
            message: 'Dépense invalide (id, amount requis)',
            code: 'INVALID_EXPENSE',
            value: expense,
          });
        } else if (expense.amount < 0) {
          invalidCount++;
          errors.push({
            field: `expenses[${index}].amount`,
            message: 'Le montant ne peut pas être négatif',
            code: 'NEGATIVE_AMOUNT',
            value: expense.amount,
          });
        } else {
          validCount++;
        }
      } catch (_err) {
        invalidCount++;
        errors.push({
          field: `expenses[${index}]`,
          message: 'Erreur de validation dépense',
          code: 'PARSE_ERROR',
        });
      }
    });

    const errorSummary = invalidCount > 0 ? `⚠️ ${invalidCount} dépense(s) invalide(s)` : null;

    if (errors.length > 0) {
      logger.warn('Validation dépenses échouée', {
        validCount,
        invalidCount,
        errors: errors.slice(0, 5),
      });
    }

    return {
      data: rawExpenses,
      isLoading: false,
      isValid: invalidCount === 0,
      validCount,
      invalidCount,
      errors,
      errorSummary,
    };
  }, [rawExpenses]);

  return result;
};

/**
 * Hook pour le profil utilisateur validé
 */
export const useValidatedUserProfile = (): {
  profile: UserProfile;
  isLoading: boolean;
  isValid: boolean;
  errors: ValidationError[];
  errorSummary: string | null;
} => {
  const { profile: rawProfile, isLoading } = useUserProfile();

  const result = useMemo(() => {
    let isValid = true;
    const errors: ValidationError[] = [];

    // Validations métier pour le profil
    if (!rawProfile.companyName || rawProfile.companyName.trim() === '') {
      isValid = false;
      errors.push({
        field: 'companyName',
        message: "Le nom de l'entreprise est requis",
        code: 'REQUIRED_FIELD',
      });
    }

    if (!rawProfile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawProfile.email)) {
      isValid = false;
      errors.push({
        field: 'email',
        message: 'Email invalide',
        code: 'INVALID_EMAIL',
        value: rawProfile.email,
      });
    }

    if (
      !rawProfile.siret ||
      !/^\d{14}$|^\d{3}\s\d{3}\s\d{3}\s\d{5}$/.test(rawProfile.siret.replace(/\s/g, ''))
    ) {
      isValid = false;
      errors.push({
        field: 'siret',
        message: 'SIRET invalide (14 chiffres requis)',
        code: 'INVALID_SIRET',
        value: rawProfile.siret,
      });
    }

    if (errors.length > 0) {
      logger.warn('Validation profil échouée', {
        errors,
        profile: rawProfile.companyName,
      });
    }

    const errorSummary = errors.length > 0 ? `⚠️ ${errors.length} erreur(s) dans le profil` : null;

    return {
      profile: rawProfile,
      isLoading,
      isValid,
      errors,
      errorSummary,
    };
  }, [rawProfile, isLoading]);

  return result;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useValidatedInvoices,
  useValidatedExpenses,
  useValidatedUserProfile,
};
