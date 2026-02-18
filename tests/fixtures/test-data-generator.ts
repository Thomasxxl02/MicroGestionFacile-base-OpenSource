import { faker } from '@faker-js/faker';
import { UserProfile, Invoice, Client, Supplier, Product } from '../../src/types';

// Configure faker seed for reproducibility
faker.seed([Math.floor(Math.random() * 1000000)]);

// Simple UUID v4 generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Générateur de données de test conformes au domaine métier
 */

export const generateTestData = {
  /**
   * Profil utilisateur complet
   */
  userProfile(): UserProfile {
    return {
      companyName: faker.company.name(),
      legalForm: 'EURL',
      capital: 1000,
      siret: faker.string.numeric(14),
      registrationNumber: faker.string.numeric(9),
      registrationCity: faker.location.city(),
      address: faker.location.streetAddress(),
      email: faker.internet.email(),
      phone: '06' + faker.string.numeric(8),
      website: faker.internet.url(),
      bankAccount: 'FR' + faker.string.numeric(25),
      bic: faker.string.alphanumeric(8).toUpperCase(),
      tvaNumber: faker.string.alphanumeric(12).toUpperCase(),
      legalMentions: 'All rights reserved',
      defaultAI: 'gemini',
      defaultInvoiceNotes: faker.lorem.sentence(),
      logo: '',
      signature: '',
      themeColor: '#3B82F6',
      typography: 'sans',
      invoicePrefix: 'FAC',
      quotePrefix: 'DEV',
      invoiceStartNumber: 1,
      quoteStartNumber: 1,
      defaultLanguage: 'fr',
      defaultPaymentDeadline: 30,
      activityType: 'services',
      isVatExempt: false,
      hasAccre: false,
      hasVersementLiberatoire: false,
      contributionQuarter: 'monthly',
      isConfigured: true,
      backupFrequency: 'monthly',
      defaultCurrency: 'EUR',
    };
  },

  /**
   * Facture complète
   */
  invoice(clientId?: string): Invoice {
    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = parseFloat(faker.commerce.price({ min: 50, max: 1000 }));
    const subtotal = quantity * unitPrice;
    const taxAmount = subtotal * 0.2;
    const total = subtotal + taxAmount;

    return {
      id: generateUUID(),
      number: `FAC-2026-${faker.string.numeric(4)}`,
      clientId: clientId || generateUUID(),
      items: [
        {
          id: generateUUID(),
          description: faker.commerce.productName(),
          quantity: quantity,
          unit: 'pcs',
          unitPrice: unitPrice,
          taxRate: 20,
          category: 'SERVICE_BIC',
        },
      ],
      type: 'invoice',
      status: 'DRAFT',
      notes: faker.lorem.sentence(),
      internalNotes: '',
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total,
      language: 'fr',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      serviceDate: new Date().toISOString(),
      discount: 0,
      paymentTerms: 'Payable sous 30 jours',
    };
  },

  /**
   * Client
   */
  client(): Client {
    return {
      id: generateUUID(),
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: '06' + faker.string.numeric(8),
      address: faker.location.streetAddress(),
      country: 'FR',
      currency: 'EUR',
      language: 'fr',
      taxType: 'DOMESTIC',
      notes: faker.lorem.sentence(),
      archived: false,
      paymentTerms: 30,
    };
  },

  /**
   * Fournisseur
   */
  supplier(): Supplier {
    return {
      id: generateUUID(),
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: '06' + faker.string.numeric(8),
      address: faker.location.streetAddress(),
      siret: faker.string.numeric(14),
      notes: faker.lorem.sentence(),
      origin: 'FR',
      country: 'FR',
      currency: 'EUR',
      status: 'VALIDATED',
    };
  },

  /**
   * Produit/Service
   */
  product(): Product {
    return {
      id: generateUUID(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      shortDescription: faker.commerce.productAdjective(),
      sku: faker.string.alphanumeric(10),
      price: parseFloat(faker.commerce.price({ min: 50, max: 1000 })),
      taxRate: 20,
      legalWarranty: 'Garantie légale de conformité',
      origin: 'FR',
      unit: 'pcs',
      type: 'product',
      taxCategory: 'SERVICE_BIC',
      stock: faker.number.int({ min: 0, max: 100 }),
    };
  },

  /**
   * Lot de factures pour test de performance
   */
  invoiceBatch(count: number = 10, clientId?: string) {
    return Array.from({ length: count }, (_, i) => {
      const invoice = this.invoice(clientId);
      invoice.number = `FAC-${String(i + 1).padStart(6, '0')}`;
      return invoice;
    });
  },
};
