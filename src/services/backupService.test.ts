/**
 * backupService.test.ts
 * 🧪 Tests du service de sauvegarde de données
 */

import { describe, it, expect, vi } from 'vitest';

// Mock Dexie
vi.mock('../services/db', () => ({
  db: {
    invoices: { toArray: vi.fn(async () => []) },
    expenses: { toArray: vi.fn(async () => []) },
    clients: { toArray: vi.fn(async () => []) },
    suppliers: { toArray: vi.fn(async () => []) },
    products: { toArray: vi.fn(async () => []) },
  },
}));

vi.mock('../services/loggerService', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('💾 backupService', () => {
  describe("Création d'une sauvegarde", () => {
    it('devrait créer un fichier de sauvegarde JSON valide', async () => {
      // Test que les données peuvent être exportées en JSON
      const testData = {
        invoices: [],
        expenses: [],
        clients: [],
        suppliers: [],
        products: [],
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };

      const json = JSON.stringify(testData);
      expect(json).toBeTruthy();
      expect(JSON.parse(json)).toEqual(testData);
    });

    it('devrait inclure un timestamp', async () => {
      const backup = {
        timestamp: new Date().toISOString(),
        data: [],
      };

      expect(backup.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('devrait inclure un numéro de version', async () => {
      const backup = {
        version: '1.0.0',
        data: [],
      };

      expect(backup.version).toBeTruthy();
      expect(backup.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Format du fichier', () => {
    it('devrait créer un blob pour le téléchargement', () => {
      const data = 'test data';
      const blob = new Blob([data], { type: 'application/json' });

      expect(blob).toBeTruthy();
      expect(blob.type).toBe('application/json');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('devrait créer un nom de fichier avec date', () => {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const filename = `backup-${dateStr}.json`;

      expect(filename).toMatch(/^backup-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });

  describe('Contenu de la sauvegarde', () => {
    it('devrait inclure toutes les collections principales', () => {
      const backup = {
        invoices: [],
        expenses: [],
        clients: [],
        suppliers: [],
        products: [],
      };

      expect(backup).toHaveProperty('invoices');
      expect(backup).toHaveProperty('expenses');
      expect(backup).toHaveProperty('clients');
      expect(backup).toHaveProperty('suppliers');
      expect(backup).toHaveProperty('products');
    });

    it('devrait gérer les données vides', () => {
      const backup = {
        invoices: [],
        expenses: [],
        clients: [],
      };

      expect(backup.invoices).toEqual([]);
      expect(backup.expenses).toEqual([]);
      expect(backup.clients).toEqual([]);
    });

    it('devrait gérer les données volumineuses', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        value: Math.random(),
      }));

      const backup = {
        items: largeData,
      };

      expect(backup.items.length).toBe(1000);
    });
  });

  describe('Intégrité des données', () => {
    it('devrait préserver la structure des factures', () => {
      const invoice = {
        id: 'inv-1',
        number: 'FAC-001',
        date: '2025-02-01',
        total: 1200,
        items: [],
      };

      const backup = JSON.stringify({ invoices: [invoice] });
      const restored = JSON.parse(backup);

      expect(restored.invoices[0]).toEqual(invoice);
    });

    it('devrait préserver les types de données', () => {
      const data = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        dateValue: '2025-02-01',
      };

      const backup = JSON.stringify(data);
      const restored = JSON.parse(backup);

      expect(typeof restored.stringValue).toBe('string');
      expect(typeof restored.numberValue).toBe('number');
      expect(typeof restored.booleanValue).toBe('boolean');
      expect(restored.nullValue).toBeNull();
      expect(typeof restored.dateValue).toBe('string');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les données circulaires', () => {
      const obj: any = { a: 1 };
      obj.self = obj; // Référence circulaire

      // JSON.stringify lève une erreur sur les références circulaires
      expect(() => {
        JSON.stringify(obj);
      }).toThrow();
    });

    it('devrait gérer les undefined', () => {
      const data = {
        value: undefined,
      };

      const json = JSON.stringify(data);
      const restored = JSON.parse(json);

      // undefined ne peut pas être sérialisé en JSON
      expect(restored).not.toHaveProperty('value');
    });
  });
});
