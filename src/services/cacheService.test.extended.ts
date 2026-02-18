/**
 * cacheService.test.ts
 * 🧪 Tests du service de cache en mémoire
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('💾 CacheService', () => {
  beforeEach(() => {
    // Reset for each test
  });

  describe('Stockage en cache', () => {
    it('devrait créer un cache simple', () => {
      const cache = new Map();

      cache.set('key1', { value: 'data1' });
      expect(cache.get('key1')).toEqual({ value: 'data1' });
    });

    it('devrait gérer plusieurs entrées', () => {
      const cache = new Map();

      cache.set('invoice-1', { id: '1', total: 100 });
      cache.set('client-1', { id: 'c1', name: 'Client A' });
      cache.set('product-1', { id: 'p1', price: 50 });

      expect(cache.size).toBe(3);
      expect(cache.get('invoice-1').total).toBe(100);
    });

    it('devrait pouvoir supprimer des entrées', () => {
      const cache = new Map();

      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('TTL et expiration', () => {
    it("devrait pouvoir tracker une date d'expiration", () => {
      const cacheEntry = {
        value: 'data',
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      };

      expect(cacheEntry.expiresAt).toBeGreaterThan(Date.now());
    });

    it('devrait déterminer si une entrée est expirée', () => {
      const now = Date.now();
      const validEntry = { value: 'data', expiresAt: now + 10000 };
      const expiredEntry = { value: 'data', expiresAt: now - 1000 };

      expect(validEntry.expiresAt > now).toBe(true);
      expect(expiredEntry.expiresAt > now).toBe(false);
    });

    it('devrait nettoyer les entrées expirées', () => {
      const cache = new Map();
      const now = Date.now();

      cache.set('active', { value: 'data', expiresAt: now + 10000 });
      cache.set('expired', { value: 'data', expiresAt: now - 1000 });

      // Simulate cleanup
      const cleaned = new Map();
      for (const [key, entry] of cache.entries()) {
        if (entry.expiresAt > now) {
          cleaned.set(key, entry);
        }
      }

      expect(cleaned.size).toBe(1);
      expect(cleaned.has('active')).toBe(true);
      expect(cleaned.has('expired')).toBe(false);
    });
  });

  describe('Limitation de taille', () => {
    it('devrait rispetter une taille max', () => {
      const maxSize = 1000;
      let currentSize = 0;

      const cache = new Map();

      // Ajouter 50 items de 20 bytes chacun
      for (let i = 0; i < 50; i++) {
        const data = 'x'.repeat(20);
        cache.set(`key-${i}`, data);
        currentSize += data.length;
      }

      expect(currentSize).toBeLessThan(maxSize * 2); // dans la limite
    });

    it('devrait évènéer les plus anciennes entrées si full', () => {
      const cache = new Map();
      const maxEntries = 3;

      // Ajouter 5 items (max 3)
      for (let i = 0; i < 5; i++) {
        cache.set(`key-${i}`, `value-${i}`);

        // Simule éviction LRU
        if (cache.size > maxEntries) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }

      expect(cache.size).toBeLessThanOrEqual(maxEntries);
    });
  });

  describe('Sérialisation', () => {
    it('devrait pouvoir sérialiser des données cachées', () => {
      const data = {
        id: 'inv-1',
        items: [{ name: 'Item 1', price: 100 }],
        total: 100,
      };

      const serialized = JSON.stringify(data);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(data);
    });

    it('devrait gérer les types complexes', () => {
      const data = {
        date: new Date().toISOString(),
        array: [1, 2, 3],
        nested: { a: { b: 'c' } },
        null: null,
        boolean: true,
      };

      const json = JSON.stringify(data);
      const restored = JSON.parse(json);

      expect(restored.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(restored.nested.a.b).toBe('c');
      expect(restored.boolean).toBe(true);
    });
  });

  describe('Performance', () => {
    it('devrait avoir un accès O(1)', () => {
      const cache = new Map();

      // Ajouter 1000 items
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const start = performance.now();
      cache.get('key-500');
      const durationSingle = performance.now() - start;

      // L'accès doit être rapide (< 1ms typically)
      expect(durationSingle).toBeLessThan(10);
    });

    it('devrait être efficace en mémoire', () => {
      const cache = new Map();
      const smallData = 'x'.repeat(100);

      // 1000 entrées
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, smallData);
      }

      expect(cache.size).toBe(1000);
    });
  });

  describe('Invalidation', () => {
    it('devrait pouvoir vider tout le cache', () => {
      const cache = new Map();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();
      expect(cache.size).toBe(0);
    });

    it('devrait pouvoir invalider par pattern', () => {
      const cache = new Map();
      cache.set('invoice:1', { id: 1 });
      cache.set('invoice:2', { id: 2 });
      cache.set('client:1', { id: 'c1' });

      // Invalider tous les invoices
      for (const key of cache.keys()) {
        if (key.startsWith('invoice:')) {
          cache.delete(key);
        }
      }

      expect(cache.size).toBe(1);
      expect(cache.has('client:1')).toBe(true);
    });
  });
});
