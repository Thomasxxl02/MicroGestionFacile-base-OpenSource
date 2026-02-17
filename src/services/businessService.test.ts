import { describe, it, expect } from 'vitest';
import {
  calculateUrssaf,
  checkVatThreshold,
  checkCaThreshold,
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
});
