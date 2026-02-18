/**
 * initializationService.ts
 * 🚀 Initialisation prioritaire de l'app AVANT que React ne se monte
 * 
 * Responsabilités:
 * - Migration localStorage -> IndexedDB
 * - Initialisation de Dexie
 * - Exposition des services globaux pour les tests
 */

import { db } from './db';
import { logger } from './loggerService';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Effectue la migration localStorage -> IndexedDB
 * Cette fonction doit être appelée dès que possible pour que le profil soit disponible
 */
async function migrateFromLocalStorage(): Promise<void> {
  try {
    logger.debug('Starting localStorage -> IndexedDB migration');
    
    // Priorité absolue: PROFIL utilisateur
    // Ceci doit être fait EN PREMIER car useUserProfile() en dépend
    const localProfile = localStorage.getItem('autogest_profile');
    if (localProfile) {
      const profile = JSON.parse(localProfile);
      const existing = await db.userProfile.get('current');
      
      // Only migrate if not already in IndexedDB
      if (!existing) {
        await db.userProfile.put({
          ...profile,
          id: 'current',
        });
        logger.info('✅ User profile migrated to IndexedDB');
      }
    }

    // Vérifier si d'autres données existent
    const hasInvoices = await db.invoices.count();
    if (hasInvoices === 0) {
      // Migrer les autres entités
      const localInvoices = localStorage.getItem('autogest_invoices');
      if (localInvoices) {
        await db.invoices.bulkAdd(JSON.parse(localInvoices));
        logger.info('✅ Invoices migrated');
      }

      const localClients = localStorage.getItem('autogest_clients');
      if (localClients) {
        await db.clients.bulkAdd(JSON.parse(localClients));
        logger.info('✅ Clients migrated');
      }

      const localSuppliers = localStorage.getItem('autogest_suppliers');
      if (localSuppliers) {
        await db.suppliers.bulkAdd(JSON.parse(localSuppliers));
        logger.info('✅ Suppliers migrated');
      }

      const localProducts = localStorage.getItem('autogest_products');
      if (localProducts) {
        await db.products.bulkAdd(JSON.parse(localProducts));
        logger.info('✅ Products migrated');
      }

      const localExpenses = localStorage.getItem('autogest_expenses');
      if (localExpenses) {
        await db.expenses.bulkAdd(JSON.parse(localExpenses));
        logger.info('✅ Expenses migrated');
      }

      logger.info('✅ All data migrated successfully');
    }
  } catch (error) {
    logger.error(
      'Migration failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Initialise complètement l'application AVANT que React ne se monte
 * Expose également les services globaux pour les tests
 */
export async function initializeApplication(): Promise<void> {
  // Éviter les initialisations multiples
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.info('[INIT] 🚀 Starting application initialization...');
      
      // Étape 1: Effectuer la migration localStorage -> IndexedDB
      // C'est CRITIQUE pour que useUserProfile() trouve le profil
      await migrateFromLocalStorage();
      console.info('[INIT] ✅ Migration complete');

      // Étape 2: Exposer les services globaux POUR LES TESTS
      // Cela doit être fait avant que React ne se monte
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).db = db;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).logger = logger;
      
      console.info('[INIT] ✅ Services exposed to window');
      console.info('[INIT] ✅ Application ready for React mount');

      isInitialized = true;
    } catch (error) {
      logger.error(
        'Application initialization failed',
        error instanceof Error ? error : new Error(String(error))
      );
      isInitialized = true; // Mark as initialized even on error
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Vérifie si l'initialisation est complète
 */
export function isApplicationInitialized(): boolean {
  return isInitialized;
}
