import { db } from './db';
import { logger } from './loggerService';

/**
 * Service gérant la sécurité des données sensibles (RIB, IBAN)
 * Chiffrement local AES-256-GCM et logging d'accès immuable.
 *
 * ⚠️ SÉCURITÉ :
 * - La clé maître est stockée dans IndexedDB (meilleur que localStorage)
 * - Pour une sécurité maximale, implémenter un mot de passe maître (PBKDF2)
 * - Les données restent vulnérables en cas d'accès physique au poste
 */

const MASTER_KEY_ID = 'master_key';

/**
 * Récupère ou crée la clé de chiffrement maître
 * Stockée dans IndexedDB (plus sécurisé que localStorage)
 */
async function getOrCreateKey(): Promise<CryptoKey> {
  try {
    // Essayer de récupérer la clé existante depuis IndexedDB
    const existingKey = await db.securityKeys.get(MASTER_KEY_ID);
    if (existingKey) {
      return await crypto.subtle.importKey(
        'jwk',
        existingKey.keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }

    // Générer une nouvelle clé
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);
    const exported = await crypto.subtle.exportKey('jwk', key);

    // Stocker dans IndexedDB
    await db.securityKeys.put({
      id: MASTER_KEY_ID,
      keyData: exported,
      createdAt: new Date().toISOString(),
    });

    return key;
  } catch (error) {
    logger.error(
      'Encryption key management failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error("Impossible d'initialiser le système de chiffrement");
  }
}

export const securityService = {
  /**
   * Chiffre une chaîne de caractères
   */
  async encrypt(text: string): Promise<string> {
    if (!text) return '';
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...result));
  },

  /**
   * Déchiffre une chaîne et log l'accès si spécifié
   */
  async decrypt(
    encryptedBase64: string,
    context?: { resourceType: string; resourceId: string; action: string }
  ): Promise<string> {
    if (!encryptedBase64) return '';

    try {
      const key = await getOrCreateKey();
      const data = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

      // Log d'accès immuable (simulation d'immuabilité via table dédiée)
      if (context) {
        await this.logAccess(context.action, context.resourceType, context.resourceId);
      }

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      logger.error('Decryption error', e instanceof Error ? e : new Error(String(e)));
      return '****';
    }
  },

  async logAccess(action: string, resourceType: string, resourceId: string, details: string = '') {
    await db.auditLogs.add({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      details,
    });
  },
};
