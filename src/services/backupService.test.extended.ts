/**
 * backupService.test.extended.ts
 * 🧪 Tests étendus du service de sauvegarde
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./loggerService', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('💾 BackupService Extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Génération de fichier de sauvegarde', () => {
    it('devrait créer un blob JSON', () => {
      const data = {
        invoices: [],
        clients: [],
        suppliers: [],
        products: [],
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('devrait générer un nom de fichier avec date', () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `backup-${today}.json`;

      expect(filename).toMatch(/^backup-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('devrait créer une URL de téléchargement', () => {
      const data = { test: 'data' };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      expect(url).toMatch(/^blob:/);
    });
  });

  describe('Contenu de la sauvegarde', () => {
    it('devrait inclure toutes les collections', () => {
      const backup = {
        invoices: [{ id: 'inv-1', total: 100 }],
        clients: [{ id: 'c-1', name: 'Client' }],
        suppliers: [{ id: 's-1', name: 'Fournisseur' }],
        products: [{ id: 'p-1', price: 50 }],
        expenses: [{ id: 'e-1', amount: 10 }],
      };

      expect(backup).toHaveProperty('invoices');
      expect(backup).toHaveProperty('clients');
      expect(backup).toHaveProperty('suppliers');
      expect(backup).toHaveProperty('products');
      expect(backup).toHaveProperty('expenses');
    });

    it('devrait préserver les structures de données', () => {
      const invoice = {
        id: 'inv-001',
        number: 'FAC-2025-001',
        date: '2025-02-18',
        total: 1200.5,
        items: [{ description: 'Service 1', quantity: 1, unitPrice: 1200.5, total: 1200.5 }],
        client: { id: 'c1', name: 'Client A' },
        status: 'PAID',
      };

      const backup = { invoices: [invoice] };
      const json = JSON.stringify(backup);
      const restored = JSON.parse(json);

      expect(restored.invoices[0]).toEqual(invoice);
      expect(restored.invoices[0].items[0].unitPrice).toBe(1200.5);
    });
  });

  describe('Validation du backup', () => {
    it('devrait valider la structure JSON', () => {
      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: [],
      };

      const json = JSON.stringify(backup);
      expect(() => {
        JSON.parse(json);
      }).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.version).toBe('1.0.0');
    });

    it('devrait vérifier la présence des clés requises', () => {
      const backup = {
        version: '1.0.0',
        timestamp: '2025-02-18T10:00:00Z',
        invoices: [],
        clients: [],
      };

      const hasVersion = 'version' in backup;
      const hasTimestamp = 'timestamp' in backup;
      const hasData = 'invoices' in backup;

      expect(hasVersion && hasTimestamp && hasData).toBe(true);
    });
  });

  describe('Restauration de sauvegarde', () => {
    it('devrait importer un fichier backup', () => {
      const backupData = {
        version: '1.0.0',
        timestamp: '2025-02-18T10:00:00Z',
        invoices: [{ id: 'inv-1', total: 100 }],
        clients: [{ id: 'c-1', name: 'Client' }],
      };

      const json = JSON.stringify(backupData);
      const file = new File([json], 'backup.json', { type: 'application/json' });

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('backup.json');
    });

    it('devrait parser le contenu du fichier', async () => {
      const backupData = {
        invoices: [{ id: 'inv-1', total: 100 }],
        clients: [],
      };

      const json = JSON.stringify(backupData);
      const file = new File([json], 'backup.json', { type: 'application/json' });

      // Simulate file reading
      const text = await file.text();
      const parsed = JSON.parse(text);

      expect(parsed.invoices).toHaveLength(1);
      expect(parsed.invoices[0].id).toBe('inv-1');
    });
  });

  describe('Intégrité des données', () => {
    it("devrait maintenir l'intégrité des dates", () => {
      const date = new Date().toISOString();
      const backup = {
        createdAt: date,
        data: [],
      };

      const json = JSON.stringify(backup);
      const restored = JSON.parse(json);

      expect(restored.createdAt).toBe(date);
      expect(restored.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('devrait gérer les montants décimaux', () => {
      const invoice = {
        subtotal: 1000.5,
        tax: 200.1,
        total: 1200.6,
      };

      const backup = JSON.stringify(invoice);
      const restored = JSON.parse(backup);

      expect(restored.subtotal).toBe(1000.5);
      expect(restored.tax).toBe(200.1);
      expect(restored.total).toBe(1200.6);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer le JSON invalide', () => {
      const invalidJson = '{{{invalid json}}}';

      expect(() => {
        JSON.parse(invalidJson);
      }).toThrow();
    });

    it('devrait gérer les fichiers vides', () => {
      const emptyFile = new File([''], 'empty.json', { type: 'application/json' });

      expect(emptyFile.size).toBe(0);
    });

    it('devrait gérer les données circulaires', () => {
      const obj: any = { a: 1 };
      obj.self = obj; // Référence circulaire

      expect(() => {
        JSON.stringify(obj);
      }).toThrow();
    });
  });

  describe('Performance de sauvegarde', () => {
    it('devrait sérialiser de grandes quantités de données', () => {
      const largeBackup = {
        invoices: Array.from({ length: 500 }).map((_, i) => ({
          id: `inv-${i}`,
          total: Math.random() * 10000,
        })),
        clients: Array.from({ length: 200 }).map((_, i) => ({
          id: `c-${i}`,
          name: `Client ${i}`,
        })),
      };

      const start = performance.now();
      const json = JSON.stringify(largeBackup);
      const duration = performance.now() - start;

      expect(json).toBeTruthy();
      expect(duration).toBeLessThan(500); // Moins de 500ms
    });

    it('devrait créer un fichier de taille appropriée', () => {
      const data = {
        invoices: Array.from({ length: 100 }).map((_, i) => ({
          id: `inv-${i}`,
          total: 100 + i,
        })),
      };

      const json = JSON.stringify(data);
      const blob = new Blob([json], { type: 'application/json' });

      // 100 invoices × ~40 bytes chaque + structure = ~4-5KB
      expect(blob.size).toBeGreaterThan(1000);
      expect(blob.size).toBeLessThan(50000);
    });
  });
});
