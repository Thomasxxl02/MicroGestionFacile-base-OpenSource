/**
 * Service de backup amélioré avec compression, validation et intégrité
 */

import { db } from './db';
import pako from 'pako'; // compression
import { logger } from './loggerService';
// WebCrypto API is available in browser (no Node.js import needed)

export interface BackupMetadata {
  version: string;
  timestamp: string;
  checksumSHA256: string;
  itemCounts: {
    invoices: number;
    clients: number;
    suppliers: number;
    products: number;
    expenses: number;
  };
  compression: 'gzip' | 'none';
  encrypted: boolean;
  appVersion: string;
  compressedSize?: number;
  compressionRatio?: number;
}

/**
 * Service de backup robuste
 */
export const improvedBackupService = {
  /**
   * Crée un backup complet avec compression et checksum
   */
  async createBackup(): Promise<{
    data: string; // Base64 compressed JSON
    metadata: BackupMetadata;
  }> {
    logger.info('Creating backup...');

    const timestamp = new Date().toISOString();

    // Collecter toutes les données
    const backupData = {
      invoices: await db.invoices.toArray(),
      clients: await db.clients.toArray(),
      suppliers: await db.suppliers.toArray(),
      products: await db.products.toArray(),
      expenses: await db.expenses.toArray(),
      profile: await db.userProfile.toArray(),
      timestamp,
    };

    // Sérialiser
    const jsonString = JSON.stringify(backupData);

    // Compresser avec gzip
    const uint8Array = new TextEncoder().encode(jsonString);
    const compressed = pako.gzip(uint8Array);

    // Encoder en base64
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));

    // Calculer checksum SHA-256
    const checksumArray = new Uint8Array(await crypto.subtle.digest('SHA-256', uint8Array));
    const checksumHex = Array.from(checksumArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Calculer le ratio de compression
    const originalSize = uint8Array.length;
    const compressedSize = compressed.length;
    const compressionRatio = (1 - compressedSize / originalSize) * 100;

    const metadata: BackupMetadata = {
      version: '2.0', // Version du format de backup
      timestamp,
      checksumSHA256: checksumHex,
      itemCounts: {
        invoices: backupData.invoices.length,
        clients: backupData.clients.length,
        suppliers: backupData.suppliers.length,
        products: backupData.products.length,
        expenses: backupData.expenses.length,
      },
      compression: 'gzip',
      encrypted: false,
      appVersion: '0.0.0', // À remplacer par version réelle
      compressedSize,
      compressionRatio,
    };

    logger.info(`✅ Backup created successfully (${base64.length / 1024}KB)`, {
      itemCounts: metadata.itemCounts,
    });

    return { data: base64, metadata };
  },

  /**
   * Restaure un backup avec validation de checksum
   */
  async restoreBackup(
    base64Data: string,
    metadata?: BackupMetadata
  ): Promise<{
    success: boolean;
    itemCounts: Record<string, number>;
    warnings: string[];
  }> {
    logger.info('Restoring backup...');
    const warnings: string[] = [];

    try {
      // Décoder et décompresser
      const compressed = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const decompressed = pako.ungzip(compressed);
      const jsonString = new TextDecoder().decode(decompressed);

      const backupData = JSON.parse(jsonString);

      // Valider le checksum si disponible
      if (metadata) {
        const uint8Array = new TextEncoder().encode(jsonString);
        const checksumArray = new Uint8Array(await crypto.subtle.digest('SHA-256', uint8Array));
        const calculatedChecksum = Array.from(checksumArray)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        if (calculatedChecksum !== metadata.checksumSHA256) {
          logger.warn('Checksum mismatch - backup may be corrupted', {
            expected: metadata.checksumSHA256,
            calculated: calculatedChecksum,
          });
          warnings.push('⚠️ Checksum mismatch - data may be partially corrupted');
        }
      }

      // Restaurer les données par collection
      const itemCounts: Record<string, number> = {};

      if (backupData.invoices && Array.isArray(backupData.invoices)) {
        await db.invoices.bulkPut(backupData.invoices);
        itemCounts.invoices = backupData.invoices.length;
      }

      if (backupData.clients && Array.isArray(backupData.clients)) {
        await db.clients.bulkPut(backupData.clients);
        itemCounts.clients = backupData.clients.length;
      }

      if (backupData.suppliers && Array.isArray(backupData.suppliers)) {
        await db.suppliers.bulkPut(backupData.suppliers);
        itemCounts.suppliers = backupData.suppliers.length;
      }

      if (backupData.products && Array.isArray(backupData.products)) {
        await db.products.bulkPut(backupData.products);
        itemCounts.products = backupData.products.length;
      }

      if (backupData.expenses && Array.isArray(backupData.expenses)) {
        await db.expenses.bulkPut(backupData.expenses);
        itemCounts.expenses = backupData.expenses.length;
      }

      logger.info(`✅ Backup restored successfully`, { itemCounts });

      return { success: true, itemCounts, warnings };
    } catch (error) {
      logger.error(
        'Backup restore failed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  },

  /**
   * Export en fichier downloadable
   */
  async exportBackupFile(): Promise<Blob> {
    const { data, metadata } = await this.createBackup();

    const exportPayload = {
      version: 'micro-gestion-facile-backup-v2',
      metadata,
      data,
    };

    return new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
  },

  /**
   * Import depuis fichier
   */
  async importBackupFile(file: File): Promise<{
    success: boolean;
    itemCounts: Record<string, number>;
    warnings: string[];
  }> {
    const content = await file.text();
    const importPayload = JSON.parse(content);

    if (!importPayload.data) {
      throw new Error('Invalid backup file format');
    }

    return this.restoreBackup(importPayload.data, importPayload.metadata);
  },
};
