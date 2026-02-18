/**
 * Hooks Dexie pour Chiffrement Transparent
 *
 * Intercepte les opérations de lecture/écriture pour:
 * - Chiffrer les données avant stockage (creating/updating)
 * - Déchiffrer les données lors du chargement (reading)
 *
 * Invisible à l'utilisateur: les données sont toujours déchiffrées
 * lorsqu'elles sont retournées au code applicatif
 */

import { Table } from 'dexie';
import { encryptionService } from '../services/encryptionService';
import { logger } from '../services/loggerService';

/**
 * Enregistre les hooks de chiffrement transparent sur une table Dexie
 * @param table - Table où appliquer les hooks
 * @param tableName - Nom de la table (pour logs et configuration)
 */
export function setupEncryptionHooks(table: Table, tableName: string): void {
  // Hook quando créant un nouvel objet
  table.hook('creating', async (_primKey, _obj, _trans) => {
    try {
      // Chiffrer les champs sensibles
      const encrypted = await encryptionService.encryptObject(_obj, tableName);

      // Retourner l'objet chiffré pour storage
      return encrypted;
    } catch (error) {
      logger.error(`[EncryptionHook] Erreur creating ${tableName}`, error as Error);
      throw error;
    }
  });

  // Hook quand mettant à jour un objet
  table.hook('updating', async (changes) => {
    try {
      // Chiffrer les changements
      const encrypted = await encryptionService.encryptObject(changes, tableName);

      // Retourner les changements chiffrés
      return encrypted;
    } catch (error) {
      logger.error(`[EncryptionHook] Erreur updating ${tableName}`, error as Error);
      throw error;
    }
  });

  // Hook quand lisant un objet
  table.hook('reading', async (obj) => {
    try {
      // Déchiffrer les champs sensibles
      const decrypted = await encryptionService.decryptObject(obj, tableName);

      // Retourner l'objet déchiffré à l'application
      return decrypted;
    } catch (error) {
      logger.warn(`[EncryptionHook] Erreur reading ${tableName}:`, error as Error);
      // En cas d'erreur de déchiffrement, retourner l'objet tel quel
      // (peut être encore chiffré si c'est une migration en cours)
      return obj;
    }
  });
}

/**
 * Initialise tous les hooks de chiffrement sur la base de données
 * À appeler après l'initialisation de Dexie et du service d'encryptio
 */
export async function initializeEncryptionHooks(db: any): Promise<void> {
  try {
    // Tables à protéger
    const protectedTables = [
      'invoices',
      'clients',
      'suppliers',
      'products',
      'expenses',
      'userProfile',
      'auditLogs',
    ];

    // Appliquer les hooks
    for (const tableName of protectedTables) {
      if (tableName in db) {
        setupEncryptionHooks(db[tableName], tableName);
        logger.info(`[EncryptionHook] Hooks installés pour: ${tableName}`);
      }
    }

    logger.info('[EncryptionHook] Tous les hooks initialisés');
  } catch (error) {
    logger.error('[EncryptionHook] Erreur initialisation', error as Error);
    throw error;
  }
}

/**
 * Désactive temporairement les hooks (pour migrations, etc.)
 * À utiliser avec précaution!
 */
export function disableEncryptionHooks(): void {
  // Dexie n'expose pas directement l'API pour désactiver les hooks,
  // mais on peut le faire par inspection du code source ou en ré-créant la table
  // Pour l'instant, cette fonction est un placeholder
  logger.warn('[EncryptionHook] Désactivation des hooks - NON IMPLÉMENTÉE');
}

/**
 * Récupère des statistiques sur les données chiffrées
 */
export async function getEncryptionStats(db: any): Promise<{
  [tableName: string]: {
    total: number;
    encrypted: number;
    unencrypted: number;
  };
}> {
  const stats: any = {};

  const tables = ['invoices', 'clients', 'suppliers', 'products', 'expenses', 'userProfile'];

  for (const tableName of tables) {
    if (!(tableName in db)) continue;

    const table = db[tableName];
    const items = await table.toArray();

    let encryptedCount = 0;
    let unencryptedCount = 0;

    for (const item of items) {
      // Vérifier si des champs semblent chiffrés
      const valuesStr = JSON.stringify(item);
      if (valuesStr.includes('__encrypted')) {
        encryptedCount++;
      } else {
        unencryptedCount++;
      }
    }

    stats[tableName] = {
      total: items.length,
      encrypted: encryptedCount,
      unencrypted: unencryptedCount,
    };
  }

  return stats;
}
