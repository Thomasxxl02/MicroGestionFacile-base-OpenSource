/**
 * useValidatedData.test.ts
 * 🧪 Suite de tests pour les hooks validés
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useValidatedInvoices,
  useValidatedExpenses,
  useValidatedUserProfile,
} from '../../src/hooks/useValidatedData';
import * as useDataModule from '../../src/hooks/useData';

// Mock des hooks useData
vi.mock('../../src/hooks/useData', () => ({
  useInvoices: vi.fn(),
  useExpenses: vi.fn(),
  useUserProfile: vi.fn(),
}));

// Mock du logger
vi.mock('../../src/services/loggerService', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('💎 useValidatedData hooks', () => {
  // ============================================================================
  // TESTS: useValidatedInvoices
  // ============================================================================

  describe('useValidatedInvoices', () => {
    it('doit retourner un tableau vide si aucune facture', () => {
      vi.mocked(useDataModule.useInvoices).mockReturnValue([]);

      const { result } = renderHook(() => useValidatedInvoices());

      expect(result.current.data).toEqual([]);
      expect(result.current.isValid).toBe(true);
      expect(result.current.validCount).toBe(0);
      expect(result.current.invalidCount).toBe(0);
      expect(result.current.errorSummary).toBeNull();
    });

    it('doit valider les factures valides', () => {
      const validInvoices = [
        {
          id: 'inv-001',
          clientId: 'client-001',
          total: 100,
          status: 'draft',
          date: '2026-02-17T00:00:00Z',
          dueDate: '2026-03-17T00:00:00Z',
          items: [],
        },
        {
          id: 'inv-002',
          clientId: 'client-002',
          total: 200,
          status: 'draft',
          date: '2026-02-17T00:00:00Z',
          dueDate: '2026-03-17T00:00:00Z',
          items: [],
        },
      ];

      vi.mocked(useDataModule.useInvoices).mockReturnValue(validInvoices as any);

      const { result } = renderHook(() => useValidatedInvoices());

      expect(result.current.data).toEqual(validInvoices);
      expect(result.current.isValid).toBe(true);
      expect(result.current.validCount).toBe(2);
      expect(result.current.invalidCount).toBe(0);
    });

    it('doit détecter les factures invalides (sans id)', () => {
      const mixedInvoices = [
        {
          id: 'inv-001',
          clientId: 'client-001',
          total: 100,
          status: 'draft',
          date: '2026-02-17T00:00:00Z',
          dueDate: '2026-03-17T00:00:00Z',
          items: [],
        },
        {
          // id manquant
          clientId: 'client-002',
          total: 200,
          status: 'draft',
          date: '2026-02-17T00:00:00Z',
          dueDate: '2026-03-17T00:00:00Z',
          items: [],
        },
      ];

      vi.mocked(useDataModule.useInvoices).mockReturnValue(mixedInvoices as any);

      const { result } = renderHook(() => useValidatedInvoices());

      expect(result.current.isValid).toBe(false);
      expect(result.current.validCount).toBe(1);
      expect(result.current.invalidCount).toBe(1);
      expect(result.current.errorSummary).toContain('invalide');
    });

    it('doit détecter les montants négatifs', () => {
      const invalidInvoices = [
        {
          id: 'inv-001',
          clientId: 'client-001',
          total: -100, // négatif
          status: 'draft',
          date: '2026-02-17T00:00:00Z',
          dueDate: '2026-03-17T00:00:00Z',
          items: [],
        },
      ];

      vi.mocked(useDataModule.useInvoices).mockReturnValue(invalidInvoices as any);

      const { result } = renderHook(() => useValidatedInvoices());

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
      expect(result.current.errors[0].message).toContain('négatif');
    });
  });

  // ============================================================================
  // TESTS: useValidatedExpenses
  // ============================================================================

  describe('useValidatedExpenses', () => {
    it('doit retourner un tableau vide si aucune dépense', () => {
      vi.mocked(useDataModule.useExpenses).mockReturnValue([]);

      const { result } = renderHook(() => useValidatedExpenses());

      expect(result.current.data).toEqual([]);
      expect(result.current.isValid).toBe(true);
      expect(result.current.validCount).toBe(0);
      expect(result.current.invalidCount).toBe(0);
    });

    it('doit valider les dépenses valides', () => {
      const validExpenses = [
        {
          id: 'exp-001',
          amount: 50,
          date: '2026-02-17T00:00:00Z',
          category: 'supplies',
        },
        {
          id: 'exp-002',
          amount: 75,
          date: '2026-02-17T00:00:00Z',
          category: 'transport',
        },
      ];

      vi.mocked(useDataModule.useExpenses).mockReturnValue(validExpenses as any);

      const { result } = renderHook(() => useValidatedExpenses());

      expect(result.current.data).toEqual(validExpenses);
      expect(result.current.isValid).toBe(true);
      expect(result.current.validCount).toBe(2);
      expect(result.current.invalidCount).toBe(0);
    });

    it('doit détecter les dépenses invalides', () => {
      const invalidExpenses = [
        {
          id: 'exp-001',
          amount: 50,
          date: '2026-02-17T00:00:00Z',
          category: 'supplies',
        },
        {
          // amount manquant
          id: 'exp-002',
          date: '2026-02-17T00:00:00Z',
          category: 'transport',
        },
      ];

      vi.mocked(useDataModule.useExpenses).mockReturnValue(invalidExpenses as any);

      const { result } = renderHook(() => useValidatedExpenses());

      expect(result.current.isValid).toBe(false);
      expect(result.current.invalidCount).toBe(1);
    });
  });

  // ============================================================================
  // TESTS: useValidatedUserProfile
  // ============================================================================

  describe('useValidatedUserProfile', () => {
    const validProfile = {
      companyName: 'Mon Entreprise',
      siret: '12345678901234',
      address: '123 Rue de Paris, 75001 Paris',
      email: 'contact@monentreprise.fr',
      phone: '01 23 45 67 89',
      activityType: 'services' as const,
      isVatExempt: true,
      hasAccre: false,
      hasVersementLiberatoire: false,
      contributionQuarter: 'monthly' as const,
      isConfigured: false,
      backupFrequency: 'none' as const,
      defaultCurrency: 'EUR',
    };

    it('doit valider un profil valide', () => {
      vi.mocked(useDataModule.useUserProfile).mockReturnValue({
        profile: validProfile,
        isLoading: false,
      });

      const { result } = renderHook(() => useValidatedUserProfile());

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.errorSummary).toBeNull();
    });

    it('doit détecter le companyName vide', () => {
      const invalidProfile = { ...validProfile, companyName: '' };

      vi.mocked(useDataModule.useUserProfile).mockReturnValue({
        profile: invalidProfile,
        isLoading: false,
      });

      const { result } = renderHook(() => useValidatedUserProfile());

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
      expect(result.current.errors[0].field).toBe('companyName');
    });

    it('doit détecter les emails invalides', () => {
      const invalidProfile = { ...validProfile, email: 'invalid-email' };

      vi.mocked(useDataModule.useUserProfile).mockReturnValue({
        profile: invalidProfile,
        isLoading: false,
      });

      const { result } = renderHook(() => useValidatedUserProfile());

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('doit détecter les SIRET invalides', () => {
      const invalidProfile = { ...validProfile, siret: '123' };

      vi.mocked(useDataModule.useUserProfile).mockReturnValue({
        profile: invalidProfile,
        isLoading: false,
      });

      const { result } = renderHook(() => useValidatedUserProfile());

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.some((e) => e.field === 'siret')).toBe(true);
    });

    it('doit inclure un errorSummary quand il y a des erreurs', () => {
      const invalidProfile = {
        ...validProfile,
        companyName: '',
        email: 'invalid',
      };

      vi.mocked(useDataModule.useUserProfile).mockReturnValue({
        profile: invalidProfile,
        isLoading: false,
      });

      const { result } = renderHook(() => useValidatedUserProfile());

      expect(result.current.errorSummary).toContain('erreur');
    });

    it('doit remonter isLoading depuis useUserProfile', () => {
      vi.mocked(useDataModule.useUserProfile).mockReturnValue({
        profile: validProfile,
        isLoading: true,
      });

      const { result } = renderHook(() => useValidatedUserProfile());

      expect(result.current.isLoading).toBe(true);
    });
  });
});
