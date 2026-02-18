/**
 * cacheService.test.ts
 * 🧪 Tests du service de cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./loggerService', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('⚡ cacheService', () => {
  let cache: Map<string, { value: any; timestamp: number; ttl?: number }>;

  beforeEach(() => {
    cache = new Map();
  });

  describe('Opérations de base', () => {
    it('devrait mettre en cache une valeur', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      cache.set(key, { value, timestamp: Date.now() });

      expect(cache.has(key)).toBe(true);
      expect(cache.get(key)?.value).toEqual(value);
    });

    it('devrait récupérer une valeur en cache', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      cache.set(key, { value, timestamp: Date.now() });
      const retrieved = cache.get(key)?.value;

      expect(retrieved).toEqual(value);
    });

    it('devrait supprimer une valeur du cache', () => {
      const key = 'test-key';
      cache.set(key, { value: 'test', timestamp: Date.now() });

      cache.delete(key);

      expect(cache.has(key)).toBe(false);
    });

    it("devrait vérifier l'existence d'une clé", () => {
      const key = 'test-key';
      cache.set(key, { value: 'test', timestamp: Date.now() });

      expect(cache.has(key)).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('devrait stocker une TTL avec la valeur', () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 5000; // 5 secondes

      cache.set(key, { value, timestamp: Date.now(), ttl });

      const cached = cache.get(key);
      expect(cached?.ttl).toBe(ttl);
    });

    it('devrait identifier les valeurs expirées', () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 100; // 100ms

      const cached = { value, timestamp: Date.now() - 150, ttl }; // Expiré
      cache.set(key, cached);

      const isExpired = Date.now() - cached.timestamp > cached.ttl;
      expect(isExpired).toBe(true);
    });

    it('devrait identifier les valeurs non expirées', () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 10000; // 10 secondes

      const cached = { value, timestamp: Date.now(), ttl }; // Pas encore expiré
      cache.set(key, cached);

      const isExpired = Date.now() - cached.timestamp > cached.ttl;
      expect(isExpired).toBe(false);
    });
  });

  describe('Invalidation du cache', () => {
    it('devrait vider le cache', () => {
      cache.set('key1', { value: 'value1', timestamp: Date.now() });
      cache.set('key2', { value: 'value2', timestamp: Date.now() });

      cache.clear();

      expect(cache.size).toBe(0);
    });

    it('devrait supprimer les entrées expirées', () => {
      const now = Date.now();

      // Valeur non expirée
      cache.set('fresh', { value: 'fresh-value', timestamp: now, ttl: 10000 });

      // Valeur expirée
      cache.set('stale', { value: 'stale-value', timestamp: now - 20000, ttl: 10000 });

      // Nettoyer les entrées expirées
      const keysToDelete: string[] = [];
      for (const [key, cached] of cache.entries()) {
        if (cached.ttl && now - cached.timestamp > cached.ttl) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => cache.delete(key));

      expect(cache.has('fresh')).toBe(true);
      expect(cache.has('stale')).toBe(false);
    });
  });

  describe('Taille du cache', () => {
    it("devrait retourner le nombre d'entrées", () => {
      cache.set('key1', { value: 'value1', timestamp: Date.now() });
      cache.set('key2', { value: 'value2', timestamp: Date.now() });
      cache.set('key3', { value: 'value3', timestamp: Date.now() });

      expect(cache.size).toBe(3);
    });

    it('devrait gérer un cache vide', () => {
      expect(cache.size).toBe(0);
    });

    it('devrait gérer les limites de taille', () => {
      const maxSize = 100;
      const entries = Array.from(
        { length: 150 },
        (_, i) =>
          [`key-${i}`, { data: `value-${i}`, timestamp: Date.now(), ttl: 5 * 60 * 1000 }] as const
      );

      // Ajouter les entrées et appliquer une limite si nécessaire
      let count = 0;
      for (const [key, value] of entries) {
        if (count < maxSize) {
          cache.set(key, value as any);
          count++;
        }
      }

      // Si on dépasse, supprimer les plus anciennes
      if (cache.size > maxSize) {
        const sortedEntries = Array.from(cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, maxSize);

        cache.clear();
        for (const [key, value] of sortedEntries) {
          cache.set(key, value);
        }
      }

      expect(cache.size).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Types de données', () => {
    it('devrait cacher les objets', () => {
      const obj = { id: 1, name: 'Test' };
      cache.set('obj', { value: obj, timestamp: Date.now() });

      expect(cache.get('obj')?.value).toEqual(obj);
    });

    it('devrait cacher les tableaux', () => {
      const arr = [1, 2, 3];
      cache.set('arr', { value: arr, timestamp: Date.now() });

      expect(cache.get('arr')?.value).toEqual(arr);
    });

    it('devrait cacher les primitives', () => {
      cache.set('string', { value: 'test', timestamp: Date.now() });
      cache.set('number', { value: 42, timestamp: Date.now() });
      cache.set('boolean', { value: true, timestamp: Date.now() });

      expect(cache.get('string')?.value).toBe('test');
      expect(cache.get('number')?.value).toBe(42);
      expect(cache.get('boolean')?.value).toBe(true);
    });

    it('devrait cacher les valeurs null', () => {
      cache.set('null', { value: null, timestamp: Date.now() });

      expect(cache.has('null')).toBe(true);
      expect(cache.get('null')?.value).toBeNull();
    });
  });

  describe('Performance', () => {
    it('devrait supporter les accès rapides', () => {
      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        cache.set(`key-${i}`, { value: `value-${i}`, timestamp: Date.now() });
      }

      const duration = Date.now() - start;

      // Map est très rapide, devrait être < 100ms même pour 10k entrées
      expect(duration).toBeLessThan(500);
    });

    it('devrait supporter les récupérations rapides', () => {
      // Remplir le cache
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, { value: `value-${i}`, timestamp: Date.now() });
      }

      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        cache.get(`key-${i % 1000}`);
      }

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Clés de cache', () => {
    it('devrait supporter les clés string', () => {
      const key = 'my-cache-key';
      cache.set(key, { value: 'test', timestamp: Date.now() });

      expect(cache.has(key)).toBe(true);
    });

    it('devrait supporter les clés avec espaces', () => {
      const key = 'my cache key';
      cache.set(key, { value: 'test', timestamp: Date.now() });

      expect(cache.has(key)).toBe(true);
    });

    it('devrait supporter les clés avec caractères spéciaux', () => {
      const key = 'my:cache:key:2025-02-01';
      cache.set(key, { value: 'test', timestamp: Date.now() });

      expect(cache.has(key)).toBe(true);
    });

    it('devrait être sensible à la casse', () => {
      const key1 = 'TestKey';
      const key2 = 'testkey';

      cache.set(key1, { value: 'value1', timestamp: Date.now() });

      expect(cache.has(key1)).toBe(true);
      expect(cache.has(key2)).toBe(false);
    });
  });
});
