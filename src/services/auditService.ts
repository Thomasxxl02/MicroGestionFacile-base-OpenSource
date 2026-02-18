/**
 * Service d'audit pour logger les actions importants (RGPD/Conformité)
 */

import { db } from './db';
import { logger } from './loggerService';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  API_KEY_CHANGE = 'API_KEY_CHANGE',
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  /**
   * Log une action pour conformité
   */
  async logAction(
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      details: details || {},
      userAgent: navigator.userAgent,
    };

    try {
      await db.auditLogs.add(entry as any);
      logger.debug(`Audit logged: ${action} on ${resourceType}#${resourceId}`, details);
    } catch (error) {
      logger.error(
        'Failed to log audit entry',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Récupère les logs d'audit filtrés
   */
  async getAuditLogs(
    options: {
      resourceType?: string;
      action?: AuditAction;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<AuditLogEntry[]> {
    const { resourceType, action, limit = 100, startDate, endDate } = options;

    let query = db.auditLogs.toCollection();

    if (resourceType) {
      query = query.filter((log) => log.resourceType === resourceType);
    }

    if (action) {
      query = query.filter((log) => log.action === action);
    }

    if (startDate && endDate) {
      query = query.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate);
    }

    const results = await query.toArray();
    return results
      .slice(-limit)
      .reverse()
      .map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action as AuditAction,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
      }));
  }

  /**
   * Exporte le journal d'audit complet (RGPD)
   */
  async exportAuditLog(): Promise<string> {
    const logs = await db.auditLogs.toArray();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Supprime les logs d'audit anciens (rétention 90 jours)
   */
  async cleanOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const logsToDelete = await db.auditLogs
      .where('timestamp')
      .below(cutoffDate.toISOString())
      .toArray();

    await db.auditLogs.bulkDelete(logsToDelete.map((log) => log.id));

    logger.info(`Cleaned ${logsToDelete.length} old audit logs`, {
      retentionDays,
    });

    return logsToDelete.length;
  }
}

export const auditService = new AuditService();
