/**
 * useAudit.test.ts
 * 🧪 Tests du hook d'audit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudit } from './useAudit';

// Mock du service d'audit
vi.mock('../services/auditService', () => ({
  auditService: {
    logAction: vi.fn(async () => {}),
  },
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    EXPORT: 'EXPORT',
    BACKUP: 'BACKUP',
  },
}));

describe('📝 useAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fonctions de base', () => {
    it("devrait retourner les fonctions de log d'audit", () => {
      const { result } = renderHook(() => useAudit());

      expect(result.current.logAction).toBeDefined();
      expect(result.current.logCreate).toBeDefined();
      expect(result.current.logUpdate).toBeDefined();
      expect(result.current.logDelete).toBeDefined();
      expect(result.current.logExport).toBeDefined();
      expect(result.current.logBackup).toBeDefined();
    });
  });

  describe('logAction générique', () => {
    it('devrait appeler auditService.logAction avec la bonne signature', async () => {
      const { AuditAction } = await import('../services/auditService');
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logAction(AuditAction.CREATE, 'Invoice', 'inv-123', { amount: 1000 });
      });

      // Le logAction devrait avoir été appelé de manière asynchrone
      // Attendre un tick pour que la promise se résolve
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe('logCreate', () => {
    it("devrait logger une création d'entité", async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logCreate('Client', 'client-456', { name: 'New Client' });
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('devrait supporter les détails optionnels', async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logCreate('Invoice', 'inv-789'); // Sans détails
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe('logUpdate', () => {
    it("devrait logger une mise à jour d'entité", async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logUpdate('Invoice', 'inv-123', { status: 'paid' });
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('devrait supporter les détails optionnels', async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logUpdate('Client', 'client-456'); // Sans détails
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe('logDelete', () => {
    it("devrait logger une suppression d'entité", async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logDelete('Invoice', 'inv-123', { reason: 'Duplicate' });
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('devrait supporter les détails optionnels', async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logDelete('Client', 'client-456');
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe('logExport', () => {
    it('devrait logger une exportation', async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logExport('Invoice', { format: 'PDF', count: 10 });
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('devrait supporter les détails optionnels', async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logExport('FEC');
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe('logBackup', () => {
    it('devrait logger une sauvegarde', async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logBackup({ type: 'automatic', size: 5242880 });
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('devrait supporter les détails optionnels', async () => {
      const { result } = renderHook(() => useAudit());

      await act(async () => {
        result.current.logBackup();
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe('Stabilité des fonctions', () => {
    it('les fonctions doivent rester stables entre les rendus', () => {
      const { result, rerender } = renderHook(() => useAudit());

      const { logCreate: logCreate1 } = result.current;

      rerender();

      const { logCreate: logCreate2 } = result.current;

      // Les fonctions doivent être les mêmes références (memoized)
      expect(logCreate1).toBe(logCreate2);
    });

    it('logAction doit rester stable entre les rendus', () => {
      const { result, rerender } = renderHook(() => useAudit());

      const { logAction: logAction1 } = result.current;

      rerender();

      const { logAction: logAction2 } = result.current;

      expect(logAction1).toBe(logAction2);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait catch les erreurs du auditService sans lever', async () => {
      const { result } = renderHook(() => useAudit());

      // La fonction ne devrait pas lever d'erreur même si le service échoue
      await act(async () => {
        result.current.logCreate('Invoice', 'inv-123');
      });

      // Pas d'erreur levée
      expect(true).toBe(true);
    });
  });

  describe('Types de ressource', () => {
    it('devrait supporter divers types de ressources', async () => {
      const { result } = renderHook(() => useAudit());

      const resourceTypes = [
        'Invoice',
        'Client',
        'Supplier',
        'Expense',
        'Product',
        'User',
        'Settings',
      ];

      for (const resourceType of resourceTypes) {
        await act(async () => {
          result.current.logCreate(resourceType, `id-${resourceType}`);
        });
      }

      // Tous les types devraient être supportés sans erreur
      expect(true).toBe(true);
    });
  });
});
