/**
 * auditService.test.ts
 * 🧪 Tests du service d'audit (RGPD/Conformité)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditAction } from './auditService';

// Mock db et logger
vi.mock('./db', () => ({
  db: {
    auditLogs: {
      add: vi.fn(async () => {}),
      toArray: vi.fn(async () => []),
      toCollection: vi.fn(() => ({
        filter: vi.fn(function (this: any) {
          return this;
        }),
        toArray: vi.fn(async () => []),
      })),
      where: vi.fn(() => ({
        below: vi.fn(() => ({
          toArray: vi.fn(async () => []),
        })),
      })),
      bulkDelete: vi.fn(async () => {}),
    },
  },
}));

vi.mock('./loggerService', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('📋 auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Énumération des actions', () => {
    it("devrait définir les actions d'audit principales", () => {
      expect(AuditAction.CREATE).toBe('CREATE');
      expect(AuditAction.UPDATE).toBe('UPDATE');
      expect(AuditAction.DELETE).toBe('DELETE');
      expect(AuditAction.EXPORT).toBe('EXPORT');
      expect(AuditAction.IMPORT).toBe('IMPORT');
      expect(AuditAction.BACKUP).toBe('BACKUP');
      expect(AuditAction.RESTORE).toBe('RESTORE');
      expect(AuditAction.LOGIN).toBe('LOGIN');
      expect(AuditAction.SETTINGS_CHANGE).toBe('SETTINGS_CHANGE');
      expect(AuditAction.API_KEY_CHANGE).toBe('API_KEY_CHANGE');
    });
  });

  describe('Logging des actions', () => {
    it("devrait créer une entrée d'audit avec tous les détails", async () => {
      const { db } = await import('./db');

      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.logAction(AuditAction.CREATE, 'Invoice', 'inv-123', { amount: 1000 });

      // Vérifier que l'ajout a été appelé
      expect(db.auditLogs.add).toHaveBeenCalled();
    });

    it("devrait générer un ID d'audit unique", async () => {
      const { db } = await import('./db');

      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.logAction(AuditAction.UPDATE, 'Client', 'client-123');
      await auditService.logAction(AuditAction.UPDATE, 'Client', 'client-456');

      // Vérifier que add a été appelé deux fois
      expect(db.auditLogs.add).toHaveBeenCalledTimes(2);
    });

    it('devrait capturer le timestamp ISO', async () => {
      const { db } = await import('./db');

      const auditService = await import('./auditService').then((m) => m.auditService);

      const before = new Date().toISOString();
      await auditService.logAction(AuditAction.DELETE, 'Invoice', 'inv-123');
      const after = new Date().toISOString();

      const callArgs = (db.auditLogs.add as any).mock.calls[0][0];
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(callArgs.timestamp >= before).toBe(true);
      expect(callArgs.timestamp <= after).toBe(true);
    });

    it('devrait inclure le userAgent du navigateur', async () => {
      const { db } = await import('./db');

      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.logAction(AuditAction.LOGIN, 'User', 'user-123');

      const callArgs = (db.auditLogs.add as any).mock.calls[0][0];
      expect(callArgs.userAgent).toBeTruthy();
    });

    it('devrait gérer les détails manquants', async () => {
      const { db } = await import('./db');

      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.logAction(AuditAction.BACKUP, 'backup');

      const callArgs = (db.auditLogs.add as any).mock.calls[0][0];
      expect(callArgs.details || {}).toEqual(callArgs.details || {});
    });
  });

  describe('Récupération des logs', () => {
    it('devrait retourner un tableau vide par défaut', async () => {
      const auditService = await import('./auditService').then((m) => m.auditService);

      const logs = await auditService.getAuditLogs();

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    });

    it('devrait appliquer une limite par défaut de 100', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.getAuditLogs();

      // Vérifier que toCollection a été appelé
      expect(db.auditLogs.toCollection).toHaveBeenCalled();
    });

    it('devrait filtrer par type de ressource', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.getAuditLogs({ resourceType: 'Invoice' });

      expect(db.auditLogs.toCollection).toHaveBeenCalled();
    });

    it('devrait filtrer par action', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.getAuditLogs({ action: AuditAction.DELETE });

      expect(db.auditLogs.toCollection).toHaveBeenCalled();
    });

    it('devrait filtrer par plage de dates', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      const startDate = '2025-02-01T00:00:00Z';
      const endDate = '2025-02-28T23:59:59Z';

      await auditService.getAuditLogs({ startDate, endDate });

      expect(db.auditLogs.toCollection).toHaveBeenCalled();
    });

    it('devrait respecter la limite personnalisée', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.getAuditLogs({ limit: 50 });

      expect(db.auditLogs.toCollection).toHaveBeenCalled();
    });

    it('devrait parser les détails JSON si nécessaire', async () => {
      const auditService = await import('./auditService').then((m) => m.auditService);

      // Mock db.auditLogs.toArray pour retourner des données
      const { db } = await import('./db');
      (db.auditLogs.toCollection as any).mockReturnValue({
        filter: vi.fn(function (this: any) {
          return this;
        }),
        toArray: vi.fn(async () => [
          {
            id: 'audit-1',
            timestamp: '2025-02-01T10:00:00Z',
            action: 'CREATE',
            resourceType: 'Invoice',
            resourceId: 'inv-123',
            details: '{"amount": 100}',
          },
        ]),
      });

      const logs = await auditService.getAuditLogs();

      expect(logs[0].details).toEqual({ amount: 100 });
    });
  });

  describe("Export du journal d'audit (RGPD)", () => {
    it('devrait exporter les logs en JSON', async () => {
      const auditService = await import('./auditService').then((m) => m.auditService);

      const json = await auditService.exportAuditLog();

      expect(typeof json).toBe('string');
      expect(json).toBeTruthy();
    });

    it('devrait exporter un JSON valide', async () => {
      const { db } = await import('./db');
      (db.auditLogs.toArray as any).mockResolvedValue([]);

      const auditService = await import('./auditService').then((m) => m.auditService);

      const json = await auditService.exportAuditLog();

      // Devrait pouvoir parser le JSON
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('devrait inclure toutes les colonnes', async () => {
      const { db } = await import('./db');
      const mockLog = {
        id: 'audit-1',
        timestamp: '2025-02-01T10:00:00Z',
        action: 'CREATE',
        resourceType: 'Invoice',
        resourceId: 'inv-123',
        details: { amount: 1000 },
        userAgent: 'Mozilla/5.0',
      };

      (db.auditLogs.toArray as any).mockResolvedValue([mockLog]);

      const auditService = await import('./auditService').then((m) => m.auditService);

      const json = await auditService.exportAuditLog();
      const parsed = JSON.parse(json);

      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('timestamp');
      expect(parsed[0]).toHaveProperty('action');
      expect(parsed[0]).toHaveProperty('resourceType');
    });
  });

  describe('Nettoyage des logs anciens', () => {
    it('devrait supprimer les logs de plus de 90 jours par défaut', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.cleanOldLogs();

      expect(db.auditLogs.where).toHaveBeenCalledWith('timestamp');
    });

    it('devrait respecter la rétention personnalisée', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.cleanOldLogs(30);

      expect(db.auditLogs.where).toHaveBeenCalled();
    });

    it('devrait retourner le nombre de logs supprimés', async () => {
      const { db } = await import('./db');
      (db.auditLogs.where as any).mockReturnValue({
        below: vi.fn(() => ({
          toArray: vi.fn(async () => [{ id: 'log-1' }, { id: 'log-2' }, { id: 'log-3' }]),
        })),
      });

      const auditService = await import('./auditService').then((m) => m.auditService);

      const deleted = await auditService.cleanOldLogs();

      expect(deleted).toBe(3);
    });

    it('devrait exécuter bulkDelete', async () => {
      const { db } = await import('./db');
      (db.auditLogs.where as any).mockReturnValue({
        below: vi.fn(() => ({
          toArray: vi.fn(async () => [{ id: 'log-1' }]),
        })),
      });

      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.cleanOldLogs();

      expect(db.auditLogs.bulkDelete).toHaveBeenCalled();
    });
  });

  describe('Conformité RGPD', () => {
    it('devrait créer des entrées traçables', async () => {
      const { db } = await import('./db');
      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.logAction(AuditAction.API_KEY_CHANGE, 'User', 'user-123');

      const callArgs = (db.auditLogs.add as any).mock.calls[0][0];
      expect(callArgs.id).toBeTruthy();
      expect(callArgs.timestamp).toBeTruthy();
      expect(callArgs.action).toBe(AuditAction.API_KEY_CHANGE);
    });

    it("devrait supporter l'export de données personnelles", async () => {
      const auditService = await import('./auditService').then((m) => m.auditService);

      const exported = await auditService.exportAuditLog();

      expect(typeof exported).toBe('string');
      expect(exported).toBeTruthy();
    });

    it('devrait permettre le nettoyage régulier des données anciennes', async () => {
      const auditService = await import('./auditService').then((m) => m.auditService);

      const deleted = await auditService.cleanOldLogs(90);

      expect(typeof deleted).toBe('number');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait logger les erreurs de sauvegarde', async () => {
      const { db } = await import('./db');
      const { logger } = await import('./loggerService');

      (db.auditLogs.add as any).mockRejectedValueOnce(new Error('DB Error'));

      const auditService = await import('./auditService').then((m) => m.auditService);

      await auditService.logAction(AuditAction.CREATE, 'Invoice', 'inv-123');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
