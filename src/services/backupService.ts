import { db, exportDatabase } from './db';

const BACKEND_URL = 'http://localhost:4000';

/**
 * Service gérant les sauvegardes automatiques vers le stockage S3 via le backend
 */
export const backupService = {
  /**
   * Effectue une sauvegarde complète de la base de données vers S3
   */
  async performBackup(): Promise<boolean> {
    try {
      console.log('Initiating automatic backup to S3...');

      // 1. Export all data to JSON
      const dataStr = await exportDatabase();

      // 2. Send to backend for encryption and S3 upload
      const response = await fetch(`${BACKEND_URL}/api/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: dataStr,
          timestamp: new Date().toISOString(),
          type: 'full_backup',
        }),
      });

      if (!response.ok) {
        throw new Error(`Backup failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backup successful:', result);

      // Log the event in audit logs
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'S3_BACKUP',
        resourceType: 'DATABASE',
        resourceId: 'ALL',
        details: 'Automatic cloud backup completed successfully',
      });

      return true;
    } catch (error) {
      console.error('S3 Backup Error:', error);
      // We don't show a toast by default to avoid annoying the user on every startup/shutdown
      // unless it's a critical error we want them to know about.
      return false;
    }
  },

  /**
   * Initialise le cycle de vie du backup (ex: au démarrage)
   */
  initialize() {
    // Run cloud backup on startup after a short delay to not block UI
    setTimeout(() => {
      this.performBackup();
      this.checkAndRunAutoBackup();
    }, 5000);

    // Save on beforeunload if possible
    window.addEventListener('beforeunload', () => {
      // Note: fetch with keepalive: true is better for shutdown
      this.performBackupWithKeepAlive();
    });
  },

  /**
   * Vérifie si une sauvegarde automatique locale est nécessaire
   */
  async checkAndRunAutoBackup() {
    try {
      const profiles = await db.userProfile.toArray();
      const profile = profiles[0];

      if (!profile || profile.backupFrequency === 'none') return;

      const now = new Date();
      const lastBackupDate = profile.lastAutoBackupDate
        ? new Date(profile.lastAutoBackupDate)
        : null;

      let shouldBackup = false;

      if (!lastBackupDate) {
        shouldBackup = true;
      } else {
        const diffInDays = (now.getTime() - lastBackupDate.getTime()) / (1000 * 3600 * 24);

        if (profile.backupFrequency === 'weekly' && diffInDays >= 7) {
          shouldBackup = true;
        } else if (profile.backupFrequency === 'monthly' && diffInDays >= 30) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        console.log('Running automatic scheduled local backup...');
        await this.triggerLocalDownload();

        // Update last backup date
        await db.userProfile.update(profile.id, {
          lastAutoBackupDate: now.toISOString(),
        });
      }
    } catch (error) {
      console.error('Auto local backup check failed:', error);
    }
  },

  /**
   * Déclenche un téléchargement JSON local (Auto)
   */
  async triggerLocalDownload() {
    try {
      const dataStr = await exportDatabase();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `micro-gestion-auto-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      // Audit log
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'LOCAL_AUTO_BACKUP',
        resourceType: 'DATABASE',
        resourceId: 'ALL',
        details: 'Scheduled automatic local backup triggered',
      });
    } catch (error) {
      console.error('Triggering local download failed:', error);
    }
  },

  async performBackupWithKeepAlive() {
    const dataStr = await exportDatabase();
    fetch(`${BACKEND_URL}/api/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: dataStr,
        timestamp: new Date().toISOString(),
        type: 'shutdown_backup',
      }),
      keepalive: true,
    }).catch(console.error);
  },
};
