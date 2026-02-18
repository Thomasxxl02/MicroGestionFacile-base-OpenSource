/**
 * Service de Chiffrement pour Données Sensibles en IndexedDB
 *
 * Fournit une couche de chiffrement AES-GCM transparent pour les données sensibles.
 * Utilise KeyManagementService pour la gestion des clés dérivées par table.
 *
 * Données chiffrées par défaut:
 * - Montants de factures (HT, TTC, TVA)
 * - Données clients (email, téléphone, adresse)
 * - Données fournisseurs (infos bancaires)
 * - Notes internes
 */

import { logger } from './loggerService';
import { keyManagementService } from './keyManagementService';

/**
 * Format des données chiffrées stockées en IndexedDB
 */
export interface EncryptedField {
  __encrypted: true;
  __algorithm: 'AES-GCM';
  __keyVersion: number; // Pour tracker les rotations
  __iv: string; // base64
  __authTag?: string; // optionnel pour validation additionnelle
  value: string; // base64(ciphertext)
}

/**
 * Configuration des champs à chiffrer par table
 */
const ENCRYPTED_FIELDS_CONFIG: Record<string, string[]> = {
  invoices: ['subtotal', 'taxAmount', 'total', 'clientEmail', 'clientPhone', 'notes'],
  clients: ['email', 'phone', 'address', 'city', 'postalCode'],
  suppliers: ['email', 'phone', 'address', 'bankDetails'],
  products: [], // Produits non sensibles
  expenses: ['description', 'amount', 'vendor'],
  userProfile: ['phone', 'email', 'address'],
};

class EncryptionService {
  private initialized = false;

  /**
   * Initialise le service avec KeyManagementService
   * À appeler au démarrage de l'app, après l'introduction du mot de passe utilisateur
   */
  async initialize(userPassphrase: string): Promise<void> {
    try {
      // Initialiser le gestionnaire de clés
      await keyManagementService.initialize(userPassphrase);

      // Vérifier que tout fonctionne
      const testResult = await keyManagementService.test();
      if (!testResult) {
        throw new Error('Key management service test failed');
      }

      this.initialized = true;
      logger.info('[Encryption] Service initialisé avec succès');
    } catch (error) {
      logger.error('[Encryption] Erreur initialisation', error as Error);
      throw error;
    }
  }

  /**
   * Chiffre une donnée pour une table spécifique
   * @param data - Données à chiffrer (JS object, string, etc.)
   * @param tableName - Nom de la table (pour chiffrement adapté)
   * @returns Objet EncryptedField
   */
  async encryptField(data: unknown, tableName: string): Promise<EncryptedField> {
    if (!this.initialized) {
      throw new Error('[Encryption] Service non initialisé');
    }

    try {
      // Récupérer la clé de table
      const tableKey = await keyManagementService.getTableKey(tableName);

      // Encoder les données
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(JSON.stringify(data));

      // Générer un IV aléatoire (12 bytes pour AES-GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Chiffrer
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv } as AesGcmParams,
        tableKey,
        plaintext
      );

      // Formater le résultat
      return {
        __encrypted: true,
        __algorithm: 'AES-GCM',
        __keyVersion: 1, // TODO: tracker version depuis KeyMetadata
        __iv: this.uint8ArrayToBase64(iv),
        value: this.uint8ArrayToBase64(new Uint8Array(ciphertext)),
      };
    } catch (error) {
      logger.error(`[Encryption] Erreur chiffrement pour ${tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Déchiffre une donnée d'une table spécifique
   * @param encryptedField - Objet EncryptedField
   * @param tableName - Nom de la table
   * @returns Données déchiffrées
   */
  async decryptField<T>(encryptedField: EncryptedField, tableName: string): Promise<T> {
    if (!this.initialized) {
      throw new Error('[Encryption] Service non initialisé');
    }

    if (!encryptedField.__encrypted) {
      throw new Error('[Encryption] Données non chiffrées');
    }

    try {
      // Récupérer la clé de table
      const tableKey = await keyManagementService.getTableKey(tableName);

      // Décoder l'IV et le ciphertext
      const iv = this.base64ToUint8Array(encryptedField.__iv);
      const ciphertext = this.base64ToUint8Array(encryptedField.value);

      // Déchiffrer
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv } as AesGcmParams,
        tableKey,
        ciphertext
      );

      // Parser les données
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(plaintext);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      logger.error(`[Encryption] Erreur déchiffrement pour ${tableName}`, error as Error);
      throw new Error('Impossible déchiffrer - données corrompues ou clé invalide');
    }
  }

  /**
   * Chiffre un objet entier (récursivement chiffre les champs sensibles)
   * @param obj - Objet à chiffrer
   * @param tableName - Nom de la table
   * @returns Objet avec champs sensibles chiffrés
   */
  async encryptObject<T extends Record<string, any>>(obj: T, tableName: string): Promise<T> {
    if (!this.initialized) {
      return obj;
    }

    const fieldsToEncrypt = ENCRYPTED_FIELDS_CONFIG[tableName] || [];
    if (fieldsToEncrypt.length === 0) {
      return obj;
    }

    const result = { ...obj } as Record<string, any>;

    for (const fieldName of fieldsToEncrypt) {
      if (fieldName in result && result[fieldName] !== null && result[fieldName] !== undefined) {
        result[fieldName] = await this.encryptField(result[fieldName], tableName);
      }
    }

    return result as T;
  }

  /**
   * Déchiffre un objet entier (récursivement déchiffre les champs sensibles)
   * @param obj - Objet avec champs potentiellement chiffrés
   * @param tableName - Nom de la table
   * @returns Objet avec champs déchiffrés
   */
  async decryptObject<T extends Record<string, any>>(obj: T, tableName: string): Promise<T> {
    if (!this.initialized) {
      return obj;
    }

    const result = { ...obj } as Record<string, any>;

    // Parcourir tous los champs
    for (const [key, value] of Object.entries(result)) {
      // Vérifier si c'est un EncryptedField
      if (
        value &&
        typeof value === 'object' &&
        '__encrypted' in value &&
        (value as any).__encrypted === true
      ) {
        try {
          result[key] = await this.decryptField(value as EncryptedField, tableName);
        } catch (error) {
          logger.warn(`[Encryption] Erreur déchiffrement champ ${key}`, error as Error);
          // Ne pas lever l'erreur, laisser le champ chiffré
        }
      }
    }

    return result as T;
  }

  /**
   * Utilitaires d'encodage
   */
  private uint8ArrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  }

  /**
   * Teste l'initialization du service
   */
  async test(): Promise<boolean> {
    try {
      if (!this.initialized) {
        logger.warn('[Encryption] Service non initialisé');
        return false;
      }

      // Tester chiffrement/déchiffrement
      const testData = { test: 'hello', amount: 123.45 };
      const encrypted = await this.encryptField(testData, 'invoices');
      const decrypted = await this.decryptField<typeof testData>(encrypted, 'invoices');

      const success = decrypted.test === 'hello' && Math.abs(decrypted.amount - 123.45) < 0.01;

      if (success) {
        logger.info('[Encryption] Test réussi');
      } else {
        logger.error('[Encryption] Test échoué: données non cohérentes');
      }

      return success;
    } catch (error) {
      logger.error('[Encryption] Erreur test', error as Error);
      return false;
    }
  }

  /**
   * Récupère le statut du service
   */
  async getStatus() {
    return {
      initialized: this.initialized,
      keyManagement: await keyManagementService.getSecurityStatus(),
    };
  }
}

export const encryptionService = new EncryptionService();
