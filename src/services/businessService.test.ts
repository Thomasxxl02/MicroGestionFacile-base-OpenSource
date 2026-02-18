import { describe, it, expect } from 'vitest';
import {
  calculateUrssaf,
  checkVatThreshold,
  checkCaThreshold,
  calculateUrssafAdjustment,
  VAT_THRESHOLDS,
  CA_THRESHOLDS,
  URSSAF_RATES,
} from './businessService';
import { Invoice, UserProfile, InvoiceItem } from '../types';

describe('businessService', () => {
  const mockUserProfile: UserProfile = {
    companyName: 'Test Business',
    siret: '12345678901234',
    activityType: 'services',
    email: 'test@example.com',
    address: '123 Test Street',
    phone: '+33123456789',
    isVatExempt: false,
    hasAccre: false,
    hasVersementLiberatoire: false,
    contributionQuarter: 'monthly',
    isConfigured: false,
    backupFrequency: 'none',
    defaultCurrency: 'EUR',
  };

  const createInvoice = (config: Partial<Invoice> = {}): Invoice => ({
    id: 'inv1',
    number: 'INV-001',
    clientId: 'client1',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    subtotal: 1000,
    taxAmount: 200,
    total: 1200,
    status: 'paid',
    items: [],
    type: 'invoice',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...config,
  });

  const createItem = (config: Partial<InvoiceItem> = {}): InvoiceItem => ({
    id: '1',
    description: 'Test Service',
    quantity: 1,
    unit: 'h',
    unitPrice: 100,
    category: 'SERVICE_BIC',
    taxRate: 20,
    discount: 0,
    isSection: false,
    ...config,
  });

  describe('Constantes', () => {
    it('devrait définir les seuils TVA corrects', () => {
      expect(VAT_THRESHOLDS.SERVICES.BASE).toBe(36800);
      expect(VAT_THRESHOLDS.SALES.BASE).toBe(91900);
    });

    it('devrait définir les seuils CA corrects', () => {
      expect(CA_THRESHOLDS.SERVICES).toBe(77700);
      expect(CA_THRESHOLDS.SALES).toBe(188700);
    });

    it('devrait définir les taux URSSAF corrects', () => {
      expect(URSSAF_RATES.SERVICES).toBe(0.212);
      expect(URSSAF_RATES.SALES).toBe(0.123);
    });
  });

  describe('calculateUrssaf()', () => {
    it('devrait calculer les cotisations URSSAF pour un entrepreneur de services', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 1000, category: 'SERVICE_BIC' })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      expect(result).toHaveProperty('sales');
      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('turnover');
    });

    it('devrait retourner 0 pour les factures non payées', () => {
      const invoice = createInvoice({
        status: 'draft',
        items: [createItem({ unitPrice: 1000 })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      expect(result.total).toBe(0);
    });

    it('devrait séparer les ventes et services', () => {
      const invoices = [
        createInvoice({
          items: [createItem({ unitPrice: 500, category: 'MARCHANDISE' })],
        }),
        createInvoice({
          id: 'inv2',
          items: [createItem({ unitPrice: 500, category: 'SERVICE_BIC' })],
        }),
      ];

      const result = calculateUrssaf(invoices, mockUserProfile);

      expect(result.sales).toBeGreaterThan(0);
      expect(result.services).toBeGreaterThan(0);
    });

    it('devrait appliquer la réduction ACCRE', () => {
      const userWithAccre = { ...mockUserProfile, hasAccre: true };
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 1000, category: 'SERVICE_BIC' })],
      });

      const resultWithoutAccre = calculateUrssaf([invoice], mockUserProfile);
      const resultWithAccre = calculateUrssaf([invoice], userWithAccre);

      expect(resultWithAccre.services).toBeLessThan(resultWithoutAccre.services);
    });

    it('devrait inclure le versement libératoire', () => {
      const userWithVL = { ...mockUserProfile, hasVersementLiberatoire: true };
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 1000, category: 'SERVICE_BIC' })],
      });

      const result = calculateUrssaf([invoice], userWithVL);

      expect(result.breakdown.versementLiberatoire).toBeGreaterThan(0);
    });

    it('devrait inclure la CFP (Contribution Formation Professionnelle)', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 1000 })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      expect(result.breakdown.cfp).toBeGreaterThan(0);
    });

    it("devrait inclure le chiffre d'affaires dans le calcul", () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 500, quantity: 2 })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      expect(result.turnover.total).toBe(1000); // 2 * 500
    });

    it('devrait arrondir les cotisations à zéro décimal', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 100.55 })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      expect(Number.isInteger(result.total)).toBe(true);
      expect(Number.isInteger(result.sales)).toBe(true);
      expect(Number.isInteger(result.services)).toBe(true);
    });
  });

  describe('checkVatThreshold()', () => {
    it('devrait identifier quand on dépasse le seuil TVA', () => {
      const invoice = createInvoice({
        items: [
          createItem({
            unitPrice: 50000,
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkVatThreshold([invoice]);

      expect(result.services.isOverThreshold).toBe(true);
      expect(result.shouldPayVat).toBe(true);
    });

    it('devrait indiquer quand on est sous le seuil TVA', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 100, category: 'SERVICE_BIC' })],
      });

      const result = checkVatThreshold([invoice]);

      expect(result.services.isOverThreshold).toBe(false);
      expect(result.shouldPayVat).toBe(false);
    });

    it('devrait détecter le seuil limité (TVA obligatoire)', () => {
      const invoice = createInvoice({
        items: [
          createItem({
            unitPrice: 40000,
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkVatThreshold([invoice]);

      expect(result.services.isOverLimit).toBe(true);
    });

    it("devrait calculer le pourcentage d'utilisation du seuil", () => {
      const invoice = createInvoice({
        items: [
          createItem({
            unitPrice: 18400, // 50% of 36800
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkVatThreshold([invoice]);

      expect(result.services.percent).toBeCloseTo(50, 1);
    });

    it('devrait séparer les ventes et services', () => {
      const invoices = [
        createInvoice({
          id: 'inv-sales',
          number: 'INV-SALES-001',
          items: [
            createItem({
              unitPrice: 100000, // > 91900 (SALES BASE)
              category: 'MARCHANDISE',
            }),
          ],
        }),
        createInvoice({
          id: 'inv-services',
          number: 'INV-SVC-001',
          items: [
            createItem({
              unitPrice: 50000, // > 36800 (SERVICES BASE)
              category: 'SERVICE_BIC',
            }),
          ],
        }),
      ];

      const result = checkVatThreshold(invoices);

      expect(result.sales.isOverThreshold).toBe(true);
      expect(result.services.isOverThreshold).toBe(true);
    });

    it('devrait ignorer les factures non payées', () => {
      const invoices = [
        createInvoice({
          status: 'draft',
          items: [
            createItem({
              unitPrice: 50000,
              category: 'SERVICE_BIC',
            }),
          ],
        }),
      ];

      const result = checkVatThreshold(invoices);

      expect(result.services.isOverThreshold).toBe(false);
    });

    it('devrait filtrer par année en cours', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      const invoice = createInvoice({
        date: lastYear.toISOString().split('T')[0],
        items: [
          createItem({
            unitPrice: 50000,
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkVatThreshold([invoice]);

      expect(result.services.isOverThreshold).toBe(false);
    });
  });

  describe('checkCaThreshold()', () => {
    it('devrait identifier le dépassement du seuil CA micro-entrepreneur', () => {
      const invoice = createInvoice({
        items: [
          createItem({
            unitPrice: 100000,
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkCaThreshold([invoice]);

      expect(result.services.isOverLimit).toBe(true);
    });

    it('devrait indiquer quand on est sous le seuil CA', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 1000, category: 'SERVICE_BIC' })],
      });

      const result = checkCaThreshold([invoice]);

      expect(result.services.isOverLimit).toBe(false);
    });

    it("devrait calculer le pourcentage d'utilisation du seuil CA", () => {
      const invoice = createInvoice({
        items: [
          createItem({
            unitPrice: 38850, // 50% of 77700
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkCaThreshold([invoice]);

      expect(result.services.percent).toBeCloseTo(50, 1);
    });

    it('devrait séparer les ventes de marchandises et services', () => {
      const invoices = [
        createInvoice({
          id: 'inv-sales',
          number: 'INV-SALES-001',
          items: [
            createItem({
              unitPrice: 200000, // > 188700 (CA SALES threshold)
              category: 'MARCHANDISE',
            }),
          ],
        }),
        createInvoice({
          id: 'inv-services',
          number: 'INV-SVC-001',
          items: [
            createItem({
              unitPrice: 100000, // > 77700 (CA SERVICES threshold)
              category: 'SERVICE_BIC',
            }),
          ],
        }),
      ];

      const result = checkCaThreshold(invoices);

      expect(result.sales.isOverLimit).toBe(true);
      expect(result.services.isOverLimit).toBe(true);
    });

    it('devrait ignorer les factures non payées', () => {
      const invoice = createInvoice({
        status: 'draft',
        items: [
          createItem({
            unitPrice: 100000,
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkCaThreshold([invoice]);

      expect(result.services.isOverLimit).toBe(false);
    });

    it('devrait filtrer par année en cours', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      const invoice = createInvoice({
        date: lastYear.toISOString().split('T')[0],
        items: [
          createItem({
            unitPrice: 100000,
            category: 'SERVICE_BIC',
          }),
        ],
      });

      const result = checkCaThreshold([invoice]);

      expect(result.services.isOverLimit).toBe(false);
    });
  });

  describe('Précision monétaire', () => {
    it('devrait utiliser Decimal pour les calculs', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 100.5, quantity: 3 })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      // 3 * 100.50 = 301.50
      expect(result.turnover.total).toBe(301.5);
    });

    it('devrait gérer les montants décimaux correctement', () => {
      const invoices = [
        createInvoice({
          items: [
            createItem({
              unitPrice: 55.55,
              quantity: 2,
              category: 'SERVICE_BIC',
            }),
          ],
        }),
      ];

      const result = calculateUrssaf(invoices, mockUserProfile);

      expect(result.turnover.services).toBe(111.1);
    });
  });

  describe('Edge Cases - Remises Globales & Prorata', () => {
    it('devrait appliquer correctement une remise globale sur facture mixte', () => {
      const invoices = [
        createInvoice({
          items: [
            createItem({ unitPrice: 500, category: 'MARCHANDISE' }),
            createItem({ unitPrice: 500, category: 'SERVICE_BIC' }),
          ],
          discount: 10, // 10% global discount
        }),
      ];

      const resultNormal = calculateUrssaf(
        [
          createInvoice({
            items: [
              createItem({ unitPrice: 500, category: 'MARCHANDISE' }),
              createItem({ unitPrice: 500, category: 'SERVICE_BIC' }),
            ],
          }),
        ],
        mockUserProfile
      );

      const resultWithDiscount = calculateUrssaf(invoices, mockUserProfile);

      // Turnover should be 10% less
      expect(resultWithDiscount.turnover.total).toBeLessThan(resultNormal.turnover.total);
      expect(resultWithDiscount.turnover.total).toBeCloseTo(resultNormal.turnover.total * 0.9, 0);
    });

    it('devrait calculer correctement avec remises multiples (globale + ligne)', () => {
      const invoices = [
        createInvoice({
          items: [
            createItem({ unitPrice: 100, quantity: 10, discount: 5 }), // 5% on line
          ],
          discount: 10, // 10% global
        }),
      ];

      const result = calculateUrssaf(invoices, mockUserProfile);

      // 100 * 10 * (1 - 5%) * (1 - 10%) = 1000 * 0.95 * 0.90 = 855
      expect(result.turnover.total).toBeCloseTo(855, 0);
    });

    it('devrait gérer les quantités fractionnées correctement', () => {
      const invoices = [
        createInvoice({
          items: [
            createItem({
              unitPrice: 100,
              quantity: 0.5, // Demi unité
              category: 'SERVICE_BIC',
            }),
          ],
        }),
      ];

      const result = calculateUrssaf(invoices, mockUserProfile);

      expect(result.turnover.services).toBe(50);
    });

    it('devrait exclure les éléments de section des calculs', () => {
      const invoices = [
        createInvoice({
          items: [
            createItem({ unitPrice: 100, category: 'SERVICE_BIC' }),
            createItem({
              description: 'Section Title',
              unitPrice: 0,
              isSection: true,
              category: 'SERVICE_BIC',
            }),
          ],
        }),
      ];

      const result = calculateUrssaf(invoices, mockUserProfile);

      // Should only count the actual item, not the section
      expect(result.turnover.services).toBe(100);
    });
  });

  describe('Régularisation URSSAF', () => {
    it('devrait calculer une régularisation positive (acomptes insuffisants)', () => {
      const result = calculateUrssafAdjustment(50000, 40000, mockUserProfile);

      expect(result.adjustment).toBeGreaterThan(0);
      expect(result.final).toBeGreaterThan(result.original);
    });

    it('devrait calculer une régularisation négative (acomptes excessifs)', () => {
      const result = calculateUrssafAdjustment(40000, 50000, mockUserProfile);

      expect(result.adjustment).toBeLessThan(0);
      expect(result.final).toBeLessThan(result.original);
    });

    it('devrait retourner une régularisation nulle si CA stable', () => {
      const result = calculateUrssafAdjustment(50000, 50000, mockUserProfile);

      expect(result.adjustment).toBe(0);
      expect(result.final).toBe(result.original);
    });
  });

  describe('Situations Complexes (Cas Réel)', () => {
    it('Cas réel : Auto-entrepreneur mixte avec ACCRE et VL', () => {
      const complexUser: UserProfile = {
        ...mockUserProfile,
        activityType: 'mixed',
        hasAccre: true,
        hasVersementLiberatoire: true,
        isVatExempt: false,
      };

      const invoices = [
        // Ventes de marchandises
        createInvoice({
          id: 'inv-sales',
          items: [createItem({ unitPrice: 5000, category: 'MARCHANDISE' })],
        }),
        // Services BIC
        createInvoice({
          id: 'inv-services',
          items: [createItem({ unitPrice: 7000, category: 'SERVICE_BIC' })],
        }),
      ];

      const result = calculateUrssaf(invoices, complexUser);

      // Vérifier que les réductions ACCRE sont appliquées
      expect(result.sales).toBeGreaterThan(0);
      expect(result.services).toBeGreaterThan(0);

      // Vérifier que le Versement Libératoire est inclus
      expect(result.breakdown.versementLiberatoire).toBeGreaterThan(0);
    });

    it('Cas réel : Micro-entrepreneur franchisé TVA (isVatExempt)', () => {
      const userFranchised = { ...mockUserProfile, isVatExempt: true };

      const invoices = [
        createInvoice({
          items: [
            createItem({
              unitPrice: 30000,
              category: 'SERVICE_BIC',
              taxRate: 0, // Franchise = pas de TVA
            }),
          ],
        }),
      ];

      const result = calculateUrssaf(invoices, userFranchised);

      // Le calcul des cotisations ne doit pas dépendre de TVA
      expect(result.services).toBeGreaterThan(0);
      expect(result.turnover.services).toBe(30000);
    });

    it('Cas réel : Dépassement de seuil CA avec prorata', () => {
      // Simulation : Seuil CA Services = 77700€
      const invoices = [
        createInvoice({
          id: 'inv-1',
          date: '2026-01-15',
          items: [createItem({ unitPrice: 40000, category: 'SERVICE_BIC' })],
        }),
        createInvoice({
          id: 'inv-2',
          date: '2026-06-15',
          items: [createItem({ unitPrice: 40000, category: 'SERVICE_BIC' })],
        }),
      ];

      const caResult = checkCaThreshold(invoices);

      expect(caResult.services.isOverLimit).toBe(true);
      expect(caResult.services.percent).toBeGreaterThan(100);
    });

    it('Cas réel : Cotisations progressives mensuel → trimestre', () => {
      const userMonthly = { ...mockUserProfile, contributionQuarter: 'monthly' as const };
      const userQuarterly = { ...mockUserProfile, contributionQuarter: 'quarterly' as const };

      const invoice = createInvoice({
        items: [createItem({ unitPrice: 10000, category: 'SERVICE_BIC' })],
      });

      const resultMonthly = calculateUrssaf([invoice], userMonthly);
      const resultQuarterly = calculateUrssaf([invoice], userQuarterly);

      // Les montants de cotisations doivent être identiques (contributionQuarter n'affecte pas le montant)
      expect(resultMonthly.total).toBe(resultQuarterly.total);
    });
  });

  describe('Robustesse & Périmètres', () => {
    it('devrait gérer une liste vide de factures', () => {
      const result = calculateUrssaf([], mockUserProfile);

      expect(result.total).toBe(0);
      expect(result.turnover.total).toBe(0);
    });

    it('devrait gérer des factures avec items vides', () => {
      const invoice = createInvoice({
        items: [],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      expect(result.total).toBe(0);
    });

    it('devrait gérer les montants très petits (centimes)', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 0.01, quantity: 1 })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      // Should not throw and should handle small amounts
      expect(result.turnover.services).toBeCloseTo(0.01, 2);
    });

    it('devrait gérer les montants très grands (en millions)', () => {
      const invoice = createInvoice({
        items: [createItem({ unitPrice: 1000000, category: 'SERVICE_BIC' })],
      });

      const result = calculateUrssaf([invoice], mockUserProfile);

      expect(result.turnover.services).toBe(1000000);
      expect(result.services).toBeGreaterThan(0);
    });
  });
});
