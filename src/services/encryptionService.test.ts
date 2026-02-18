/**
 * Tests unitaires pour EncryptionService
 * Valide le chiffrement/déchiffrement transparent et la gestion des objets
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encryptionService } from './encryptionService';
// import { logger } from './loggerService';  // Mocked below

// Mocks
vi.mock('./loggerService', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('🔐 EncryptionService', () => {
  beforeEach(async () => {
    // Réinitialiser le service avant chaque test
    await encryptionService.initialize('test-passphrase');
  });

  describe('Chiffrement de champs', () => {
    it('devrait chiffrer un nombre', async () => {
      const amount = 1234.56;
      const encrypted = await encryptionService.encryptField(amount, 'invoices');

      expect(encrypted.__encrypted).toBe(true);
      expect(encrypted.__algorithm).toBe('AES-GCM');
      expect(encrypted.value).toBeDefined();
      expect(encrypted.__iv).toBeDefined();
    });

    it('devrait chiffrer une chaîne de caractères', async () => {
      const email = 'client@example.com';
      const encrypted = await encryptionService.encryptField(email, 'clients');

      expect(encrypted.__encrypted).toBe(true);
      expect(encrypted.value).toBeDefined();
    });

    it('devrait produire des ciphertexts différents pour les mêmes données', async () => {
      const data = 'same-data';

      const encrypted1 = await encryptionService.encryptField(data, 'invoices');
      const encrypted2 = await encryptionService.encryptField(data, 'invoices');

      expect(encrypted1.value).not.toBe(encrypted2.value);
      expect(encrypted1.__iv).not.toBe(encrypted2.__iv);
    });
  });

  describe('Déchiffrement de champs', () => {
    it('devrait déchiffrer correctement un nombre', async () => {
      const original = 9999.99;
      const encrypted = await encryptionService.encryptField(original, 'invoices');
      const decrypted = await encryptionService.decryptField<number>(encrypted, 'invoices');

      expect(decrypted).toBe(original);
    });

    it('devrait déchiffrer correctement une chaîne', async () => {
      const original = 'contact@example.com';
      const encrypted = await encryptionService.encryptField(original, 'clients');
      const decrypted = await encryptionService.decryptField<string>(encrypted, 'clients');

      expect(decrypted).toBe(original);
    });

    it('devrait lever une erreur si la clé est mauvaise', async () => {
      const data = 123;
      const encrypted = await encryptionService.encryptField(data, 'invoices');

      // Essayer déchiffrer avec une autre table (clé différente)
      await expect(encryptionService.decryptField(encrypted, 'clients')).rejects.toThrow();
    });
  });

  describe("Chiffrement d'objets entiers", () => {
    it('devrait chiffrer uniquement les champs sensibles', async () => {
      const invoice = {
        id: 'inv-001',
        number: 'FAC-000001',
        subtotal: 1000.0,
        taxAmount: 200.0,
        total: 1200.0,
        notes: 'Important notes',
        status: 'DRAFT',
      };

      const encrypted = await encryptionService.encryptObject(invoice, 'invoices');

      // Champs sensibles => objets chiffrés
      expect((encrypted as any).subtotal?.__encrypted).toBe(true);
      expect((encrypted as any).taxAmount?.__encrypted).toBe(true);
      expect((encrypted as any).total?.__encrypted).toBe(true);
      expect((encrypted as any).notes?.__encrypted).toBe(true);

      // Champs non-sensibles => inchangés
      expect(encrypted.id).toBe('inv-001');
      expect(encrypted.status).toBe('DRAFT');
    });

    it('devrait déchiffrer correctement les objets', async () => {
      const client = {
        id: 'client-001',
        name: 'Test Client',
        email: 'client@example.com',
        phone: '0612345678',
        address: '123 Rue de Paris',
        isArchived: false,
      };

      const encrypted = await encryptionService.encryptObject(client, 'clients');
      const decrypted = await encryptionService.decryptObject(encrypted, 'clients');

      expect(decrypted.email).toBe('client@example.com');
      expect(decrypted.phone).toBe('0612345678');
      expect(decrypted.address).toBe('123 Rue de Paris');
    });
  });

  describe('Test du service', () => {
    it('devrait réussir le test de fonctionnement', async () => {
      const result = await encryptionService.test();
      expect(result).toBe(true);
    });

    it('devrait retourner le statut du service', async () => {
      const status = await encryptionService.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.keyManagement).toBeDefined();
      expect(status.keyManagement.initialized).toBe(true);
    });
  });
});
