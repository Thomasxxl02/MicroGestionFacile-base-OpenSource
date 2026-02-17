import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvoiceCalculations } from './useInvoiceCalculations';
import { InvoiceItem } from '../types';

describe('useInvoiceCalculations', () => {
  describe('Calculs de base', () => {
    it('devrait calculer correctement le sous-total HT', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation A',
          quantity: 2,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
        {
          id: '2',
          description: 'Prestation B',
          quantity: 1,
          unit: 'h',
          unitPrice: 50,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({ items, discount: 0, shipping: 0, deposit: 0, isTaxExempt: false })
      );

      expect(result.current.subtotal).toBe(250); // 2*100 + 1*50 = 250€
    });

    it('devrait appliquer les remises sur les lignes', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation avec remise',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 10, // 10% de remise
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({ items, discount: 0, shipping: 0, deposit: 0, isTaxExempt: false })
      );

      expect(result.current.subtotal).toBe(90); // 100 - 10% = 90€
    });

    it('devrait calculer correctement la TVA à 20%', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({ items, discount: 0, shipping: 0, deposit: 0, isTaxExempt: false })
      );

      expect(result.current.taxAmount).toBe(20); // 20% de 100€ = 20€
      expect(result.current.total).toBe(120); // 100€ + 20€ = 120€
    });

    it('devrait traiter la franchise de TVA (isTaxExempt)', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation sans TVA',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({ items, discount: 0, shipping: 0, deposit: 0, isTaxExempt: true })
      );

      expect(result.current.taxAmount).toBe(0); // Exonéré de TVA
      expect(result.current.total).toBe(100); // Pas de TVA appliquée
    });
  });

  describe('Calculs avancés', () => {
    it('devrait gérer plusieurs taux de TVA', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'TVA 20%',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
        {
          id: '2',
          description: 'TVA 5.5%',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 5.5,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({ items, discount: 0, shipping: 0, deposit: 0, isTaxExempt: false })
      );

      expect(result.current.subtotal).toBe(200);
      expect(result.current.taxAmount).toBe(25.5); // 20 + 5.5
      expect(result.current.total).toBe(225.5);
    });

    it('devrait appliquer la remise globale', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({
          items,
          discount: 10, // 10% de remise globale
          shipping: 0,
          deposit: 0,
          isTaxExempt: false,
        })
      );

      expect(result.current.finalHT).toBe(90); // 100 - 10% = 90€
      expect(result.current.discountAmount).toBe(10); // 10€ de remise
    });

    it('devrait ajouter les frais de port', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({
          items,
          discount: 0,
          shipping: 15, // 15€ de frais de port
          deposit: 0,
          isTaxExempt: false,
        })
      );

      expect(result.current.total).toBe(135); // 100€ HT + 20€ TVA + 15€ port = 135€
    });

    it('devrait déduire un acompte', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({
          items,
          discount: 0,
          shipping: 0,
          deposit: 30, // 30€ d'acompte
          isTaxExempt: false,
        })
      );

      expect(result.current.balanceDue).toBe(90); // 120€ TTC - 30€ = 90€
    });
  });

  describe('Précision des calculs (decimal.js)', () => {
    it('devrait utiliser la précision à 2 décimales', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: 'Prestation',
          quantity: 3,
          unit: 'h',
          unitPrice: 33.33,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({ items, discount: 0, shipping: 0, deposit: 0, isTaxExempt: false })
      );

      // 3 * 33.33 = 99.99 (pas 100.00)
      expect(result.current.subtotal).toBe(99.99);
    });
  });

  describe('Sections (lignes non facturables)', () => {
    it('ne devrait pas inclure les sections dans les calculs', () => {
      const items: InvoiceItem[] = [
        {
          id: '1',
          description: '=== SECTION 1 ===',
          quantity: 0,
          unit: 'h',
          unitPrice: 0,
          category: 'SERVICE_BIC',
          taxRate: 0,
          discount: 0,
          isSection: true, // Section
        },
        {
          id: '2',
          description: 'Prestation',
          quantity: 1,
          unit: 'h',
          unitPrice: 100,
          category: 'SERVICE_BIC',
          taxRate: 20,
          discount: 0,
          isSection: false,
        },
      ];

      const { result } = renderHook(() =>
        useInvoiceCalculations({ items, discount: 0, shipping: 0, deposit: 0, isTaxExempt: false })
      );

      expect(result.current.subtotal).toBe(100); // Seule la prestation compte
    });
  });
});
