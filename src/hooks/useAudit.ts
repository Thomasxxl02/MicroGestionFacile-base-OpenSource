/**
 * Hook pour intégration facile de l'audit dans les composants
 */

import { useCallback } from 'react';
import { auditService, AuditAction } from '../services/auditService';

export const useAudit = () => {
  const logAction = useCallback(
    (
      action: AuditAction,
      resourceType: string,
      resourceId?: string,
      details?: Record<string, any>
    ) => {
      auditService.logAction(action, resourceType, resourceId, details).catch(console.error);
    },
    []
  );

  const logCreate = useCallback(
    (resourceType: string, resourceId: string, details?: Record<string, any>) => {
      logAction(AuditAction.CREATE, resourceType, resourceId, details);
    },
    [logAction]
  );

  const logUpdate = useCallback(
    (resourceType: string, resourceId: string, details?: Record<string, any>) => {
      logAction(AuditAction.UPDATE, resourceType, resourceId, details);
    },
    [logAction]
  );

  const logDelete = useCallback(
    (resourceType: string, resourceId: string, details?: Record<string, any>) => {
      logAction(AuditAction.DELETE, resourceType, resourceId, details);
    },
    [logAction]
  );

  const logExport = useCallback(
    (resourceType: string, details?: Record<string, any>) => {
      logAction(AuditAction.EXPORT, resourceType, undefined, details);
    },
    [logAction]
  );

  const logBackup = useCallback(
    (details?: Record<string, any>) => {
      logAction(AuditAction.BACKUP, 'backup', undefined, details);
    },
    [logAction]
  );

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logExport,
    logBackup,
  };
};
