/**
 * Service de Gestion des Clés de Chiffrement
 * Responsabilités:
 * - Génération de clés maître depuis passphrase utilisateur
 * - Dérivation de clés par table (invoices, clients, etc.)
 * - Gestion du versioning des clés
 * - Rotation des clés (optionnelle)
 * - Stockage sécurisé des métadonnées
 */

import { logger } from './loggerService';
import { db } from './db';

/**
 * Métadonnées associées à une clé chiffrée
 */
export interface KeyMetadata {
  id: string; // Format: 'table-v1', 'table-v2', etc.
  tableName: string;
  version: number; // Increment à chaque rotation
  createdAt: string; // ISO timestamp
  rotatedAt?: string;
  algorithm: 'AES-GCM';
  keyLength: 256; // bits
  derivationMethod: 'PBKDF2-HKDF';
  isActive: boolean;
}

/**
 * Clé stockée en IndexedDB (format JsonWebKey)
 */
export interface StoredKey extends KeyMetadata {
  keyData: JsonWebKey; // Format exporté PKCS8
  hmacKey?: Uint8Array; // Pour authentification supplémentaire (optionnel)
}

class KeyManagementService {
  private masterKey: CryptoKey | null = null;
  private derivedKeys: Map<string, CryptoKey> = new Map();

  /**
   * Constantes PBKDF2 (conformes NIST)
   */
  private static readonly PBKDF2_ITERATIONS = 310000; // Recommandé OWASP 2023
  private static readonly PBKDF2_HASH = 'SHA-256';
  private static readonly KEY_LENGTH = 256; // bits

  /**
   * Initialise le service avec une passphrase utilisateur
   * Cette fonction DOIT être appelée au démarrage de l'app
   */
  async initialize(userPassphrase: string): Promise<void> {
    try {
      // 1. Dériver la clé maître
      this.masterKey = await this.deriveMasterKey(userPassphrase);

      // 2. Générer ou charger les clés par table
      await this.initializeTableKeys();

      logger.info('[KeyManagement] Service initialisé avec succès');
    } catch (error) {
      logger.error('[KeyManagement] Erreur initialisation', error as Error);
      throw error;
    }
  }

  /**
   * Dérive la clé maître depuis la passphrase utilisateur
   * Utilise PBKDF2 avec salt spécifique à l'app
   */
  private async deriveMasterKey(passphrase: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passPhraseData = encoder.encode(passphrase);

    // Salt statique pour cette instance (dérivé du device ID ou constant)
    // IMPORTANT: En production, utiliser un salt unique par utilisateur
    const salt = encoder.encode('micro-gestion-facile-salting-key-v2');

    // 1. Importer la passphrase comme clé brute
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passPhraseData,
      { name: 'PBKDF2' },
      false, // non extractible (sécurisé)
      ['deriveKey', 'deriveBits']
    );

    // 2. Dériver la clé maître AES-GCM 256-bit
    const masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: KeyManagementService.PBKDF2_ITERATIONS,
        hash: KeyManagementService.PBKDF2_HASH,
      } as any,
      baseKey,
      { name: 'AES-GCM', length: KeyManagementService.KEY_LENGTH },
      true, // extractible (pour rotation/backup)
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );

    logger.debug('[KeyManagement] Clé maître dérivée');
    return masterKey;
  }

  /**
   * Initialise les clés pour chaque table
   * Crée les clés manquantes, charge les existantes
   */
  private async initializeTableKeys(): Promise<void> {
    const tables = [
      'invoices',
      'clients',
      'suppliers',
      'products',
      'expenses',
      'userProfile',
      'auditLogs',
    ];

    for (const tableName of tables) {
      // Essayer charger la clé existante
      const existingKey = await this.loadTableKey(tableName);

      if (existingKey) {
        this.derivedKeys.set(tableName, existingKey);
        logger.debug(`[KeyManagement] Clé chargée pour: ${tableName}`);
      } else {
        // Créer une nouvelle clé si elle n'existe pas
        const newKey = await this.createTableKey(tableName);
        this.derivedKeys.set(tableName, newKey);
        logger.info(`[KeyManagement] Clé créée pour: ${tableName}`);
      }
    }
  }

  /**
   * Charge une clé de table depuis IndexedDB
   */
  private async loadTableKey(tableName: string): Promise<CryptoKey | null> {
    try {
      // Récupérer depuis securityKeys la dernière version active
      const storedKeys = await db.securityKeys.toArray();
      const activeKey = storedKeys
        .filter((k) => k.id.startsWith(`${tableName}-v`))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .find((k) => (k as any).isActive);

      if (!activeKey) {
        return null;
      }

      // Importer la clé depuis le format JsonWebKey
      const key = await crypto.subtle.importKey(
        'jwk',
        (activeKey as any).keyData,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );

      return key;
    } catch (error) {
      logger.warn(`[KeyManagement] Impossible charger clé ${tableName}`, error as Error);
      return null;
    }
  }

  /**
   * Crée une nouvelle clé pour une table
   * Stocke les métadonnées dans IndexedDB
   */
  private async createTableKey(tableName: string): Promise<CryptoKey> {
    if (!this.masterKey) {
      throw new Error('[KeyManagement] Clé maître non initialisée');
    }

    // Dériver une clé de table unique via HKDF
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode(tableName),
        info: new TextEncoder().encode(`table-key-${tableName}`),
      } as any,
      this.masterKey,
      KeyManagementService.KEY_LENGTH
    );

    // Importer comme clé AES-GCM
    const tableKey = await crypto.subtle.importKey('raw', derivedBits, { name: 'AES-GCM' }, true, [
      'encrypt',
      'decrypt',
    ]);

    // Exporter pour stockage
    const exportedKey = await crypto.subtle.exportKey('jwk', tableKey);

    // Déterminer le version number
    const existingKeys = await db.securityKeys.toArray();
    const tableKeys = existingKeys.filter((k) => k.id.startsWith(`${tableName}-`));
    const nextVersion = tableKeys.length + 1;

    // Créer les métadonnées
    const metadata: StoredKey = {
      id: `${tableName}-v${nextVersion}`,
      tableName,
      version: nextVersion,
      createdAt: new Date().toISOString(),
      algorithm: 'AES-GCM',
      keyLength: 256,
      derivationMethod: 'PBKDF2-HKDF',
      isActive: true,
      keyData: exportedKey,
    };

    // Marquer les anciennes comme inactive
    for (const oldKey of tableKeys) {
      (oldKey as any).isActive = false;
      await db.securityKeys.put(oldKey as any);
    }

    // Sauvegarder la nouvelle clé
    await db.securityKeys.put(metadata as any);

    return tableKey;
  }

  /**
   * Récupère une clé dérivée pour une table
   */
  async getTableKey(tableName: string): Promise<CryptoKey> {
    const key = this.derivedKeys.get(tableName);
    if (!key) {
      throw new Error(`[KeyManagement] Clé non disponible pour la table: ${tableName}`);
    }
    return key;
  }

  /**
   * Effectue une rotation de clé pour une table
   * Crée une nouvelle clé et marque l'ancienne comme inactive
   */
  async rotateTableKey(tableName: string): Promise<void> {
    if (!this.masterKey) {
      throw new Error('[KeyManagement] Clé maître non initialisée');
    }

    logger.info(`[KeyManagement] Rotation clé pour: ${tableName}`);

    // Créer la nouvelle clé
    const newKey = await this.createTableKey(tableName);

    // Mettre à jour le cache local
    this.derivedKeys.set(tableName, newKey);

    logger.info(`[KeyManagement] Rotation complète pour: ${tableName}`);
  }

  /**
   * Récupère l'historique des clés pour une table
   */
  async getKeyHistory(tableName: string): Promise<KeyMetadata[]> {
    const allKeys = await db.securityKeys.toArray();
    return allKeys
      .filter((k) => k.id.startsWith(`${tableName}-`))
      .sort(
        (a, b) =>
          new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      ) as unknown as KeyMetadata[];
  }

  /**
   * Exporte la configuration de sécurité (pour audit)
   */
  async getSecurityStatus(): Promise<{
    initialized: boolean;
    keyCount: number;
    lastRotation: string;
    tables: string[];
  }> {
    const allKeys = await db.securityKeys.toArray();
    const tables = Array.from(this.derivedKeys.keys());

    return {
      initialized: this.masterKey !== null,
      keyCount: allKeys.length,
      lastRotation: allKeys[allKeys.length - 1]?.createdAt || 'never',
      tables,
    };
  }

  /**
   * Teste que le service fonctionne correctement
   */
  async test(): Promise<boolean> {
    try {
      if (!this.masterKey) {
        logger.warn('[KeyManagement] Clé maître non initialisée');
        return false;
      }

      // Tester chiffrement/déchiffrement
      const testKey = await this.getTableKey('invoices');
      const testData = new TextEncoder().encode('test-data');
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, testKey, testData);

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, testKey, encrypted);

      const success = new TextDecoder().decode(decrypted) === 'test-data';

      if (success) {
        logger.info('[KeyManagement] Test réussi');
      } else {
        logger.error('[KeyManagement] Test échoué: données non cohérentes');
      }

      return success;
    } catch (error) {
      logger.error('[KeyManagement] Erreur test', error as Error);
      return false;
    }
  }
}

// Export du singleton
export const keyManagementService = new KeyManagementService();
