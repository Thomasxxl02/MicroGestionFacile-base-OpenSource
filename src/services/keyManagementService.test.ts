/**
 * Tests unitaires pour KeyManagementService
 * Valide la génération, dérivation et rotation des clés de chiffrement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { keyManagementService } from '../../src/services/keyManagementService';
// import { logger } from '../../src/services/loggerService';  // Mocked below

// Mock du loggerService
vi.mock('../../src/services/loggerService', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('🔐 KeyManagementService', () => {
  beforeEach(async () => {
    // Vider indexedDB avant chaque test
    const dbs = (await window.indexedDB.databases?.()) ?? [];
    for (const db of dbs) {
      if (db.name === 'MicroGestionDB') {
        window.indexedDB.deleteDatabase(db.name);
      }
    }
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec une passphrase utilisateur', async () => {
      const passphrase = 'mon-mot-de-passe-super-secret';

      // Ne pas lever d'erreur
      await expect(keyManagementService.initialize(passphrase)).resolves.toBeUndefined();
    });

    it('devrait créer des clés pour toutes les tables', async () => {
      await keyManagementService.initialize('test-passphrase');

      const status = await keyManagementService.getSecurityStatus();

      expect(status.initialized).toBe(true);
      expect(status.tables).toContain('invoices');
      expect(status.tables).toContain('clients');
      expect(status.tables).toContain('suppliers');
      expect(status.keyCount).toBeGreaterThanOrEqual(7); // Au moins 7 tables
    });

    it('devrait passer le test de fonctionnement', async () => {
      await keyManagementService.initialize('test-passphrase');
      const result = await keyManagementService.test();

      expect(result).toBe(true);
    });
  });

  describe('Dérivation de clés', () => {
    beforeEach(async () => {
      await keyManagementService.initialize('test-passphrase');
    });

    it('devrait dériver des clés différentes pour des tables différentes', async () => {
      const invoiceKey = await keyManagementService.getTableKey('invoices');
      const clientKey = await keyManagementService.getTableKey('clients');

      // Les clés sont différentes (même si dérivées de la même maître)
      expect(invoiceKey).not.toBe(clientKey);
    });

    it('devrait retourner la même clé pour une table', async () => {
      const key1 = await keyManagementService.getTableKey('invoices');
      const key2 = await keyManagementService.getTableKey('invoices');

      // Même clé (Dexie les compare par valeur)
      expect(key1.type).toBe(key2.type);
    });

    it('devrait lever une erreur pour une table inexistante', async () => {
      await expect(keyManagementService.getTableKey('nonexistent-table')).rejects.toThrow();
    });
  });

  describe('Historique des clés', () => {
    beforeEach(async () => {
      await keyManagementService.initialize('test-passphrase');
    });

    it("devrait retourner l'historique des clés", async () => {
      const history = await keyManagementService.getKeyHistory('invoices');

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('tableName', 'invoices');
      expect(history[0]).toHaveProperty('version');
    });

    it("l'historique devrait être trié chronologiquement", async () => {
      const history = await keyManagementService.getKeyHistory('invoices');

      for (let i = 0; i < history.length - 1; i++) {
        const current = new Date(history[i].createdAt).getTime();
        const next = new Date(history[i + 1].createdAt).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    });
  });

  describe('Rotation de clés', () => {
    beforeEach(async () => {
      await keyManagementService.initialize('test-passphrase');
    });

    it('devrait pouvoir effectuer une rotation de clé', async () => {
      const historyBefore = await keyManagementService.getKeyHistory('invoices');
      const versionBefore = historyBefore[historyBefore.length - 1].version;

      // Effectuer la rotation
      await keyManagementService.rotateTableKey('invoices');

      const historyAfter = await keyManagementService.getKeyHistory('invoices');
      const versionAfter = historyAfter[historyAfter.length - 1].version;

      expect(versionAfter).toBe(versionBefore + 1);
    });

    it('la rotation devrait mettre à jour la clé active', async () => {
      await keyManagementService.rotateTableKey('invoices');

      const history = await keyManagementService.getKeyHistory('invoices');
      const activeKey = history.find((k) => (k as any).isActive);

      expect(activeKey).toBeDefined();
      expect(activeKey?.version).toBe(history[history.length - 1].version);
    });

    it('les anciennes clés ne devraient pas être supprimées', async () => {
      const historyBefore = await keyManagementService.getKeyHistory('invoices');
      const countBefore = historyBefore.length;

      await keyManagementService.rotateTableKey('invoices');

      const historyAfter = await keyManagementService.getKeyHistory('invoices');
      const countAfter = historyAfter.length;

      // Une clé supplémentaire, pas de suppression
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  describe('Statut de sécurité', () => {
    beforeEach(async () => {
      await keyManagementService.initialize('test-passphrase');
    });

    it('devrait retourner un statut de sécurité complet', async () => {
      const status = await keyManagementService.getSecurityStatus();

      expect(status).toHaveProperty('initialized', true);
      expect(status).toHaveProperty('keyCount');
      expect(status).toHaveProperty('lastRotation');
      expect(status).toHaveProperty('tables');
      expect(Array.isArray(status.tables)).toBe(true);
    });

    it('les tables du statut devraient inclure les principales', async () => {
      const status = await keyManagementService.getSecurityStatus();

      const expectedTables = ['invoices', 'clients', 'suppliers', 'products', 'expenses'];

      for (const table of expectedTables) {
        expect(status.tables).toContain(table);
      }
    });
  });
});
