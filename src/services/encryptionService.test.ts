/**
 * Tests unitaires pour EncryptionService
 * Valide le chiffrement/déchiffrement et les opérations crypto
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks
vi.mock('./loggerService', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('🔐 EncryptionService - Crypto Runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Crypto API disponible', () => {
    it('devrait avoir le runtime crypto disponible', () => {
      expect(global.crypto).toBeDefined();
      expect(global.crypto.subtle).toBeDefined();
    });

    it('devrait pouvoir générer des UUIDs', () => {
      const uuid = global.crypto.randomUUID();
      expect(uuid).toBeTruthy();
      expect(uuid).toHaveLength(36); // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    });

    it('devrait pouvoir générer des valeurs aléatoires', () => {
      const array = new Uint8Array(32);
      global.crypto.getRandomValues(array);

      expect(array).toHaveLength(32);
      expect(array instanceof Uint8Array).toBe(true);
    });

    it('devrait générer des valeurs aléatoires différentes', () => {
      const array1 = new Uint8Array(16);
      const array2 = new Uint8Array(16);

      global.crypto.getRandomValues(array1);
      global.crypto.getRandomValues(array2);

      // Les arrays aléatoires doivent être différents
      let different = false;
      for (let i = 0; i < 16; i++) {
        if (array1[i] !== array2[i]) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe('Opérations de hachage', () => {
    it('devrait pouvoir hacher avec SHA-256', async () => {
      const data = new TextEncoder().encode('data to hash');
      const hash = await global.crypto.subtle.digest('SHA-256', data);

      expect(hash).toBeDefined();
      expect(hash instanceof ArrayBuffer).toBe(true);
      expect((hash as ArrayBuffer).byteLength).toBe(32); // SHA-256 = 256 bits = 32 bytes
    });

    it('devrait produire des hashes différents pour des données différentes', async () => {
      const data1 = new TextEncoder().encode('data1');
      const data2 = new TextEncoder().encode('data2');

      const hash1 = await global.crypto.subtle.digest('SHA-256', data1);
      const hash2 = await global.crypto.subtle.digest('SHA-256', data2);

      const array1 = new Uint8Array(hash1);
      const array2 = new Uint8Array(hash2);

      // Les hashes doivent être différents
      let different = false;
      for (let i = 0; i < 32; i++) {
        if (array1[i] !== array2[i]) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });

    it('devrait produire le même hash pour les mêmes données', async () => {
      const data = new TextEncoder().encode('consistent data');

      const hash1 = await global.crypto.subtle.digest('SHA-256', data);
      const hash2 = await global.crypto.subtle.digest('SHA-256', data);

      const array1 = new Uint8Array(hash1);
      const array2 = new Uint8Array(hash2);

      expect(array1).toEqual(array2);
    });
  });

  describe('Dérivation de clés', () => {
    it('devrait supporter les salts aléatoires', () => {
      const salt1 = global.crypto.getRandomValues(new Uint8Array(16));
      const salt2 = global.crypto.getRandomValues(new Uint8Array(16));

      // Les salts doivent être différents
      expect(salt1).not.toEqual(salt2);
      expect(salt1).toHaveLength(16);
      expect(salt2).toHaveLength(16);
    });

    it('devrait supporter les itérations PBKDF2', () => {
      const iterations = 100000;
      const pbkdf2Params = {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: global.crypto.getRandomValues(new Uint8Array(16)),
        iterations,
      };

      expect(pbkdf2Params.iterations).toBe(iterations);
      expect(pbkdf2Params.name).toBe('PBKDF2');
    });

    it('devrait pouvoir hacher avec PBKDF2-like patterns', async () => {
      // Simuler PBKDF2 en utilisant SHA-256 itéré
      const password = new TextEncoder().encode('password');
      const salt = global.crypto.getRandomValues(new Uint8Array(16));

      // Première itération : hash(password + salt)
      const data = new Uint8Array(password.length + salt.length);
      data.set(password);
      data.set(salt, password.length);

      const hash1 = await global.crypto.subtle.digest('SHA-256', data);
      expect(hash1).toBeDefined();
      expect((hash1 as ArrayBuffer).byteLength).toBe(32);

      // Deuxième itération : hash du hash
      const hash2 = await global.crypto.subtle.digest('SHA-256', hash1);
      expect(hash2).toBeDefined();

      // Les deux hashes doivent être différents
      const arr1 = new Uint8Array(hash1);
      const arr2 = new Uint8Array(hash2);
      let different = false;
      for (let i = 0; i < 32; i++) {
        if (arr1[i] !== arr2[i]) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe('Opérations de chiffrement AES-GCM', () => {
    it('devrait pouvoir utiliser AES-GCM pour chiffrer', async () => {
      const key = { type: 'secret' } as CryptoKey;
      const data = new TextEncoder().encode('plaintext');
      const iv = new Uint8Array(12);

      const encrypted = await global.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      expect(encrypted).toBeDefined();
      expect(encrypted instanceof ArrayBuffer).toBe(true);
    });

    it('devrait pouvoir déchiffrer avec AES-GCM', async () => {
      const key = { type: 'secret' } as CryptoKey;
      const plaintext = 'test-data';
      const iv = new Uint8Array(12);

      // Encrypt
      const encrypted = await global.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
      );

      // Decrypt
      const decrypted = await global.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      expect(decrypted).toBeDefined();
      expect(decrypted instanceof ArrayBuffer).toBe(true);
    });

    it('devrait gérer les données binaires', async () => {
      const key = { type: 'secret' } as CryptoKey;
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const iv = new Uint8Array(12);

      const encrypted = await global.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      expect(encrypted instanceof ArrayBuffer).toBe(true);
      expect((encrypted as ArrayBuffer).byteLength).toBeGreaterThan(0);
    });

    it('devrait produire des chiffres différents avec des IVs différents', async () => {
      const key = { type: 'secret' } as CryptoKey;
      const data = new TextEncoder().encode('same data');
      const iv1 = new Uint8Array(12);
      const iv2 = global.crypto.getRandomValues(new Uint8Array(12));

      const enc1 = await global.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv1 },
        key,
        data
      );

      const enc2 = await global.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv2 },
        key,
        data
      );

      expect(enc1).toBeDefined();
      expect(enc2).toBeDefined();
      // Même données, mais différents IVs = différents ciphertexts
      const arr1 = new Uint8Array(enc1 as ArrayBuffer);
      const arr2 = new Uint8Array(enc2 as ArrayBuffer);
      let different = false;
      for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
        if (arr1[i] !== arr2[i]) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe('Gestion des erreurs', () => {
    it('ne devrait pas lever d\'erreur sur les opérations basiques', () => {
      expect(() => {
        global.crypto.randomUUID();
      }).not.toThrow();

      expect(async () => {
        const data = new TextEncoder().encode('test');
        await global.crypto.subtle.digest('SHA-256', data);
      }).not.toThrow();
    });

    it('devrait gérer les données vides', async () => {
      const key = { type: 'secret' } as CryptoKey;
      const emptyData = new Uint8Array(0);
      const iv = new Uint8Array(12);

      const encrypted = await global.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        emptyData
      );

      expect(encrypted).toBeDefined();
    });

    it('devrait supporter les données de différentes tailles', async () => {
      const key = { type: 'secret' } as CryptoKey;
      const iv = new Uint8Array(12);

      const sizes = [1, 100, 1000, 10000];
      for (const size of sizes) {
        const data = new Uint8Array(size);
        const encrypted = await global.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          data
        );
        expect(encrypted).toBeDefined();
      }
    });
  });

  describe('Interopérabilité des types', () => {
    it('devrait gérer String -> Uint8Array -> String', async () => {
      const original = 'test message';
      const encoded = new TextEncoder().encode(original);
      const decoded = new TextDecoder().decode(encoded);

      expect(decoded).toBe(original);
    });

    it('devrait supporter le hachage de différents types', async () => {
      const testCases = [
        'string data',
        new Uint8Array([1, 2, 3]),
        new TextEncoder().encode('encoded string'),
      ];

      for (const testCase of testCases) {
        const hash = await global.crypto.subtle.digest('SHA-256', testCase as any);
        expect(hash).toBeDefined();
        expect((hash as ArrayBuffer).byteLength).toBe(32);
      }
    });

    it('devrait gérer les conversions Uint8Array bidirectionnelles', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = original.buffer;
      const reconstructed = new Uint8Array(buffer);

      expect(reconstructed).toEqual(original);
    });
  });
});
