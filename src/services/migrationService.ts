/**
 * Service de gestion des migrations et versions de schéma IndexedDB
 */

import { logger } from './loggerService';

export interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

interface MigrationHistory {
  version: number;
  name: string;
  appliedAt: string;
  success: boolean;
  error?: string;
}

class MigrationService {
  private migrationHistory: MigrationHistory[] = [];
  private readonly STORAGE_KEY = 'mgf_migration_history';

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      this.migrationHistory = stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.warn('Could not load migration history', { error: String(error) });
      this.migrationHistory = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.migrationHistory));
    } catch (error) {
      logger.error(
        'Failed to save migration history',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Exécute toutes les migrations en attente
   */
  async runMigrations(migrations: Migration[]): Promise<{
    success: boolean;
    applied: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let applied = 0;

    // Trier par version
    const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);

    for (const migration of sortedMigrations) {
      const alreadyApplied = this.migrationHistory.some(
        (h) => h.version === migration.version && h.success
      );

      if (alreadyApplied) {
        logger.debug(`Migration v${migration.version} already applied, skipping`);
        continue;
      }

      try {
        logger.info(`Running migration v${migration.version}: ${migration.name}`);
        await migration.up();

        const entry: MigrationHistory = {
          version: migration.version,
          name: migration.name,
          appliedAt: new Date().toISOString(),
          success: true,
        };

        this.migrationHistory.push(entry);
        applied++;

        logger.info(`✅ Migration v${migration.version} applied successfully`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const entry: MigrationHistory = {
          version: migration.version,
          name: migration.name,
          appliedAt: new Date().toISOString(),
          success: false,
          error: errorMsg,
        };

        this.migrationHistory.push(entry);
        errors.push(`Migration v${migration.version} (${migration.name}): ${errorMsg}`);

        logger.error(
          `❌ Migration v${migration.version} failed`,
          error instanceof Error ? error : new Error(String(error)),
          {
            migration: migration.name,
          }
        );
      }
    }

    this.saveHistory();

    return {
      success: errors.length === 0,
      applied,
      errors,
    };
  }

  /**
   * Obtient l'historique des migrations
   */
  getHistory(): MigrationHistory[] {
    return [...this.migrationHistory];
  }

  /**
   * Obtient la dernière migration appliquée
   */
  getLastApplied(): MigrationHistory | null {
    const successful = this.migrationHistory.filter((h) => h.success);
    return successful.length > 0 ? successful[successful.length - 1] : null;
  }

  /**
   * Réinitialise l'historique (débogage uniquement)
   */
  resetHistory(): void {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Cannot reset migration history in production');
    }
    this.migrationHistory = [];
    localStorage.removeItem(this.STORAGE_KEY);
    logger.warn('Migration history reset (dev mode only)');
  }
}

export const migrationService = new MigrationService();
