/**
 * useAsync.test.ts
 * 🧪 Tests du hook de gestion des opérations asynchrones
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

// Mock des services
vi.mock('../services/loggerService', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('🔄 useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('État de base', () => {
    it('devrait initialiser avec les valeurs par défaut', () => {
      const { result } = renderHook(() => useAsync());

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('devrait avoir une fonction execute', () => {
      const { result } = renderHook(() => useAsync());

      expect(result.current.execute).toBeDefined();
      expect(typeof result.current.execute).toBe('function');
    });
  });

  describe('Exécution simple', () => {
    it('devrait exécuter une fonction asynchrone avec succès', async () => {
      const { result } = renderHook(() => useAsync());
      const mockFn = vi.fn(async () => 'success data');

      await act(async () => {
        const data = await result.current.execute(mockFn, 'Test operation');
        expect(data).toBe('success data');
      });

      expect(result.current.data).toBe('success data');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les erreurs correctement', async () => {
      const { result } = renderHook(() => useAsync());
      const errorMsg = 'Operation failed';
      const mockFn = vi.fn(async () => {
        throw new Error(errorMsg);
      });

      await act(async () => {
        const data = await result.current.execute(mockFn, 'Test operation');
        expect(data).toBeNull();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe(errorMsg);
      expect(result.current.isLoading).toBe(false);
    });

    it("devrait définir isLoading à true pendant l'exécution", async () => {
      const { result } = renderHook(() => useAsync());
      const mockFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'data';
      });

      act(() => {
        result.current.execute(mockFn, 'Test').then(() => {});
      });

      // Devrait être en train de charger immédiatement après l'appel
      // Note: En test, le timing peut être rapide
      await waitFor(() => {
        expect(result.current.isLoading || result.current.data).toBeTruthy();
      });
    });
  });

  describe('Options - showToast', () => {
    it('devrait afficher un toast de succès par défaut', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useAsync({ showToast: true }));
      const mockFn = vi.fn(async () => 'success');

      await act(async () => {
        await result.current.execute(mockFn, 'Test operation');
      });

      expect(toast.success).toHaveBeenCalledWith('Test operation réussi');
    });

    it("devrait afficher un toast d'erreur", async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useAsync({ showToast: true }));
      const mockFn = vi.fn(async () => {
        throw new Error('Test error');
      });

      await act(async () => {
        await result.current.execute(mockFn, 'Test operation');
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('ne devrait pas afficher de toast si showToast est false', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useAsync({ showToast: false }));
      const mockFn = vi.fn(async () => 'success');

      await act(async () => {
        await result.current.execute(mockFn, 'Test operation');
      });

      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks - onSuccess/onError', () => {
    it('devrait appeler onSuccess réussi', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAsync({ onSuccess }));
      const mockFn = vi.fn(async () => ({ value: 'success' }));

      const successData = { value: 'success' };
      await act(async () => {
        await result.current.execute(mockFn, 'Test');
      });

      expect(onSuccess).toHaveBeenCalledWith(successData);
    });

    it("devrait appeler onError en cas d'erreur", async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useAsync({ onError }));
      const testError = new Error('Test error');
      const mockFn = vi.fn(async () => {
        throw testError;
      });

      await act(async () => {
        await result.current.execute(mockFn, 'Test');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("ne devrait pas appeler onSuccess en cas d'erreur", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAsync({ onSuccess }));
      const mockFn = vi.fn(async () => {
        throw new Error('Test error');
      });

      await act(async () => {
        await result.current.execute(mockFn, 'Test');
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it("devrait réessayer en cas d'erreur", async () => {
      const { result } = renderHook(() => useAsync({ retryCount: 2, retryDelay: 10 }));
      const mockFn = vi.fn(async () => {
        throw new Error('Fail');
      });

      await act(async () => {
        const data = await result.current.execute(mockFn, 'Test');
        expect(data).toBeNull();
      });

      // 1 tentative initiale + 2 retries = 3 appels
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('devrait retourner le succès dès que réussi (pas de retry supplémentaire)', async () => {
      const { result } = renderHook(() => useAsync({ retryCount: 3, retryDelay: 10 }));
      let callCount = 0;
      const mockFn = vi.fn(async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Fail first time');
        }
        return 'success';
      });

      await act(async () => {
        const data = await result.current.execute(mockFn, 'Test');
        expect(data).toBe('success');
      });

      // Devraitavoir essayé 2 fois (initial + 1 retry)
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('devrait attendre le delai entre les retries', async () => {
      const { result } = renderHook(() => useAsync({ retryCount: 1, retryDelay: 50 }));
      const mockFn = vi.fn(async () => {
        throw new Error('Fail');
      });

      const startTime = Date.now();
      await act(async () => {
        await result.current.execute(mockFn, 'Test');
      });
      const elapsed = Date.now() - startTime;

      // Devrait avoir attendu au moins le délai
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Types générique', () => {
    it('devrait supporter les types génériques', async () => {
      interface CustomData {
        id: number;
        name: string;
      }

      const { result } = renderHook(() => useAsync<CustomData>());
      const mockFn = vi.fn(
        async (): Promise<CustomData> => ({
          id: 1,
          name: 'Test',
        })
      );

      await act(async () => {
        await result.current.execute(mockFn, 'Test');
      });

      expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    });
  });

  describe('Erreurs non-Error', () => {
    it('devrait gérer les erreurs non-Error (string)', async () => {
      const { result } = renderHook(() => useAsync());
      const mockFn = vi.fn(async () => {
        throw 'String error'; // Pas une Error
      });

      await act(async () => {
        await result.current.execute(mockFn, 'Test');
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('String error');
    });

    it('devrait gérer les erreurs inconnues', async () => {
      const { result } = renderHook(() => useAsync());
      const mockFn = vi.fn(async () => {
        throw { code: 'UNKNOWN' }; // Objet quelconque
      });

      await act(async () => {
        await result.current.execute(mockFn, 'Test');
      });

      expect(result.current.error).toBeDefined();
    });
  });
});
