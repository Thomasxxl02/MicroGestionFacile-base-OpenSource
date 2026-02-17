import { describe, it, expect } from 'vitest';
import { generateJournalEntries } from './accountingService';
import { Decimal } from 'decimal.js';
import { Invoice, Expense, UserProfile, Client, Supplier } from '../types';

describe('accountingService', () => {
  const mockUserProfile: UserProfile = {
    companyName: 'Test Business',
    siret: '12345678901234',
    address: '123 Test Street',
    email: 'test@example.com',
    phone: '+33123456789',
    activityType: 'services',
    isVatExempt: false,
    hasAccre: false,
    hasVersementLiberatoire: false,
    contributionQuarter: 'monthly',
    isConfigured: false,
    backupFrequency: 'none',
    defaultCurrency: 'EUR',
  };

  const mockClients: Client[] = [
    {
      id: 'client1',
      name: 'Client Test',
      email: 'client@example.com',
      address: '123 Rue Test',
      country: 'FR',
      currency: 'EUR',
      language: 'fr',
      taxType: 'DOMESTIC',
      tvaNumber: 'FR12345678901',
      phone: '0612345678',
      paymentTerms: 30,
    },
  ];

  const mockSuppliers: Supplier[] = [
    {
      id: 'supplier1',
      name: 'Supplier Test',
      email: 'supplier@example.com',
      phone: '0612345678',
      address: '456 Rue Fournisseur',
      origin: 'FR',
      country: 'FR',
      currency: 'EUR',
      status: 'VALIDATED',
      vatNumber: 'FR98765432109',
    },
  ];

  describe('generateJournalEntries - Factures', () => {
    it('devrait générer des écritures pour une facture simple', () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries(
        [invoice],
        [],
        mockUserProfile,
        mockClients,
        mockSuppliers
      );

      expect(entries.length).toBeGreaterThan(0);
      // Vérifier la présence des lignes clés: Client, Revenu, TVA
      expect(entries.some((e) => e.compteNum === '411000')).toBe(true); // Client
      expect(entries.some((e) => e.compteNum === '706000')).toBe(true); // Prestations
      expect(entries.some((e) => e.compteNum === '445710')).toBe(true); // TVA Collectée
    });

    it('devrait générer des écritures correctes pour une facture non exonérée de TVA', () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([invoice], [], mockUserProfile, mockClients);

      // Vérifier les montants de la TVA
      const tvaEntry = entries.find((e) => e.id === 'inv1-4457');
      expect(tvaEntry).toBeDefined();
      expect(tvaEntry?.credit.toNumber()).toBe(200);
    });

    it('ne devrait pas générer de TVA pour un profil exonéré', () => {
      const userVatExempt = { ...mockUserProfile, isVatExempt: true };
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([invoice], [], userVatExempt, mockClients);

      // Ne pas avoir d'entrée TVA
      expect(entries.some((e) => e.compteNum === '445710')).toBe(false);
    });

    it('devrait générer des écritures pour une facture payée', () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'paid',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([invoice], [], mockUserProfile, mockClients);

      // Vérifier les écritures de banque
      expect(entries.some((e) => e.compteNum === '512000' && e.journal === 'BQ')).toBe(true);
    });

    it('devrait gérer les notes de crédit correctement', () => {
      const creditNote: Invoice = {
        id: 'inv1',
        number: 'CREDIT-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 100,
        taxAmount: 20,
        total: 120,
        status: 'draft',
        items: [],
        type: 'credit_note',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([creditNote], [], mockUserProfile, mockClients);

      // Vérifier que les débits/crédits sont inversés pour une note de crédit
      const clientEntry = entries.find((e) => e.id === 'inv1-411');
      expect(clientEntry?.debit.toNumber()).toBe(0);
      expect(clientEntry?.credit.toNumber()).toBe(120);
    });

    it('devrait utiliser le compte 707000 pour la vente de marchandises', () => {
      const userSales: UserProfile = { ...mockUserProfile, activityType: 'sales' };
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([invoice], [], userSales, mockClients);

      expect(entries.some((e) => e.compteNum === '707000')).toBe(true); // Ventes
    });

    it('devrait ignorer les factures qui ne sont pas du type invoice ou credit_note', () => {
      const devis: Invoice = {
        id: 'inv1',
        number: 'DEV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'quote',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([devis], [], mockUserProfile, mockClients);

      // Pas d'écritures pour un devis
      expect(entries.length).toBe(0);
    });
  });

  describe('generateJournalEntries - Dépenses', () => {
    it('devrait générer des écritures pour une dépense simple', () => {
      const expense: Expense = {
        id: 'exp1',
        date: '2025-02-01',
        description: 'Service Cloud',
        amount: 100,
        vatAmount: 0,
        category: 'Services',
        status: 'validated',
        supplierId: 'supplier1',
        createdAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([], [expense], mockUserProfile, [], mockSuppliers);

      expect(entries.length).toBeGreaterThan(0);
      // Vérifier les comptes clés
      expect(entries.some((e) => e.compteNum === '651000')).toBe(true); // Services
      expect(entries.some((e) => e.compteNum === '401000')).toBe(true); // Fournisseurs
      expect(entries.some((e) => e.compteNum === '512000')).toBe(true); // Banque
    });

    it('devrait mapper correctement les catégories de dépenses', () => {
      const categories = [
        { text: 'Services', compte: '651000' },
        { text: 'Restaurant', compte: '625700' },
        { text: 'Deplacements', compte: '625100' },
        { text: 'Loyer', compte: '613000' },
      ];

      categories.forEach(({ text, compte }) => {
        const expense: Expense = {
          id: `exp-${text}`,
          date: '2025-02-01',
          description: `Dépense ${text}`,
          amount: 100,
          vatAmount: 20,
          category: text,
          status: 'validated',
          supplierId: 'supplier1',
          createdAt: new Date().toISOString(),
        };

        const entries = generateJournalEntries([], [expense], mockUserProfile, [], mockSuppliers);
        expect(entries.some((e) => e.compteNum === compte)).toBe(true);
      });
    });

    it('devrait gérer les TVA sur les dépenses', () => {
      const expense: Expense = {
        id: 'exp1',
        date: '2025-02-01',
        description: 'Achat marchandise',
        amount: 120,
        vatAmount: 20,
        category: 'Services',
        status: 'validated',
        supplierId: 'supplier1',
        createdAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([], [expense], mockUserProfile, [], mockSuppliers);

      // Vérifier la TVA déductible
      const vatEntry = entries.find((e) => e.id === 'exp1-4456');
      expect(vatEntry).toBeDefined();
      expect(vatEntry?.debit.toNumber()).toBe(20);
    });

    it('devrait annuler correctement une dépense', () => {
      const expense: Expense = {
        id: 'exp1',
        date: '2025-02-01',
        description: 'Dépense annulée',
        amount: 100,
        vatAmount: 20,
        category: 'Services',
        status: 'cancelled',
        supplierId: 'supplier1',
        createdAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([], [expense], mockUserProfile, [], mockSuppliers);

      // Vérifier que les montants sont inversés pour l'annulation
      const chargeEntry = entries.find((e) => e.id === 'exp1-6x');
      expect(chargeEntry?.credit.toNumber()).toBe(100 - 20); // HT
      expect(chargeEntry?.debit.toNumber()).toBe(0);

      // Ne pas avoir d'entrée de banque pour les dépenses annulées
      expect(entries.some((e) => e.id === 'exp1-512-out')).toBe(false);
    });

    it("ne devrait pas générer d'écritures de banque pour les dépenses annulées", () => {
      const expense: Expense = {
        id: 'exp1',
        date: '2025-02-01',
        description: 'Dépense annulée',
        amount: 100,
        vatAmount: 20,
        category: 'Services',
        status: 'cancelled',
        supplierId: 'supplier1',
        createdAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([], [expense], mockUserProfile, [], mockSuppliers);

      // Pas d'écritures de banque pour les dépenses annulées
      expect(entries.some((e) => e.id === 'exp1-512-out')).toBe(false);
    });
  });

  describe('générage mixte - factures et dépenses', () => {
    it('devrait générer des écritures pour des factures et des dépenses ensemble', () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const expense: Expense = {
        id: 'exp1',
        date: '2025-02-01',
        description: 'Service Cloud',
        amount: 100,
        vatAmount: 0,
        category: 'Services',
        status: 'validated',
        supplierId: 'supplier1',
        createdAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries(
        [invoice],
        [expense],
        mockUserProfile,
        mockClients,
        mockSuppliers
      );

      // Vérifier qu'on a des écritures de ventes ET d'achats
      expect(entries.some((e) => e.journal === 'VT')).toBe(true);
      expect(entries.some((e) => e.journal === 'AC')).toBe(true);
    });

    it('devrait trier les écritures par date', () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-15',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const expense: Expense = {
        id: 'exp1',
        date: '2025-02-01',
        description: 'Service Cloud',
        amount: 100,
        vatAmount: 0,
        category: 'Services',
        status: 'validated',
        supplierId: 'supplier1',
        createdAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries(
        [invoice],
        [expense],
        mockUserProfile,
        mockClients,
        mockSuppliers
      );

      // Vérifier que la dépense (02-01) vient avant la facture (02-15)
      const firstEntry = entries[0];
      expect(firstEntry.date).toBe('2025-02-01');
    });
  });

  describe('Intégrité des écritures comptables', () => {
    it("devrait maintenir l'équilibre débit/crédit pour une facture simple", () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([invoice], [], mockUserProfile, mockClients);

      // Calculer les totaux
      const totalDebit = entries.reduce((sum, e) => sum.plus(e.debit), new Decimal(0));
      const totalCredit = entries.reduce((sum, e) => sum.plus(e.credit), new Decimal(0));

      // Les débits et crédits doivent être égaux
      expect(totalDebit.equals(totalCredit)).toBe(true);
    });

    it('devrait utiliser Decimal pour la précision monétaire', () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'client1',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 100.5,
        taxAmount: 20.1,
        total: 120.6,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([invoice], [], mockUserProfile, mockClients);

      // Vérifier que les montants sont des instances de Decimal
      entries.forEach((entry) => {
        expect(entry.debit instanceof Decimal).toBe(true);
        expect(entry.credit instanceof Decimal).toBe(true);
      });
    });
  });

  describe('Cas spéciaux', () => {
    it('devrait gérer les factures sans client (Client Divers)', () => {
      const invoice: Invoice = {
        id: 'inv1',
        number: 'INV-001',
        clientId: 'unknown-client',
        date: '2025-02-01',
        dueDate: '2025-03-01',
        subtotal: 1000,
        taxAmount: 200,
        total: 1200,
        status: 'draft',
        items: [],
        type: 'invoice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([invoice], [], mockUserProfile, mockClients);

      const clientEntry = entries.find((e) => e.id === 'inv1-411');
      expect(clientEntry?.compteAuxLib).toBe('Client Divers');
    });

    it('devrait gérer les dépenses sans fournisseur (Fournisseur Divers)', () => {
      const expense: Expense = {
        id: 'exp1',
        date: '2025-02-01',
        description: 'Dépense anonyme',
        amount: 100,
        vatAmount: 20,
        category: 'Services',
        status: 'validated',
        supplierId: 'unknown-supplier',
        createdAt: new Date().toISOString(),
      };

      const entries = generateJournalEntries([], [expense], mockUserProfile, [], mockSuppliers);

      const supplierEntry = entries.find((e) => e.id === 'exp1-401');
      expect(supplierEntry?.compteAuxLib).toBe('Fournisseur Divers');
    });
  });
});
