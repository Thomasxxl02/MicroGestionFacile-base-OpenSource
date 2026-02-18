/**
 * Service de cache intelligent pour IndexedDB
 * Réduit les lectures BD et améliore la performance UX
 */

import { logger } from './loggerService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time-to-live en ms
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Avec cache automatique (5min par défaut)
   */
  async getOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_TTL, forceRefresh = false } = options;

    // Vérifier le cache valide
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return cached.data;
      }
    }

    logger.debug(`Cache miss for ${cacheKey}, fetching...`);
    const data = await fetchFn();

    this.cache.set(cacheKey, { data, timestamp: Date.now(), ttl });
    return data;
  }

  /**
   * Write-through cache avec invalidation
   */
  async updateAndCache<T>(
    cacheKey: string,
    updateFn: () => Promise<T>,
    options: { ttl?: number } = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_TTL } = options;

    const data = await updateFn();
    this.cache.set(cacheKey, { data, timestamp: Date.now(), ttl });
    return data;
  }

  /**
   * Invalide immédiatement un cache
   */
  invalidate(cacheKey: string | string[]): void {
    const keys = Array.isArray(cacheKey) ? cacheKey : [cacheKey];
    keys.forEach((key) => {
      this.cache.delete(key);
      logger.debug(`Cache invalidated: ${key}`);
    });
  }

  /**
   * Débounce une opération (utile pour les uploads de formulaires)
   */
  debountOperationAsync<T>(
    operationKey: string,
    fn: () => Promise<T>,
    delay: number = 500
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Annuler le timer précédent
      const existingTimer = this.debounceTimers.get(operationKey);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(operationKey);
        }
      }, delay);

      this.debounceTimers.set(operationKey, timer);
    });
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.debounceTimers.forEach(clearTimeout);
    this.debounceTimers.clear();
    logger.info('Cache cleared completely');
  }

  /**
   * Obtient les stats du cache (pour monitoring)
   */
  getStats(): {
    cacheSize: number;
    activeTimers: number;
  } {
    return {
      cacheSize: this.cache.size,
      activeTimers: this.debounceTimers.size,
    };
  }
}

export const cacheService = new CacheService();
