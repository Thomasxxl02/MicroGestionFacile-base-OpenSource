import { describe, it, expect, vi } from 'vitest';
import { asyncHandler, createAsyncHandler, safeAsync } from './asyncHandler';

describe('asyncHandler', () => {
  describe('asyncHandler', () => {
    it('devrait wrapper une fonction async et retourner une fonction synchrone', () => {
      const asyncFn = vi.fn().mockResolvedValue(undefined);
      const handler = asyncHandler(asyncFn);

      expect(typeof handler).toBe('function');
      handler('arg1', 'arg2');

      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('devrait ignorer les erreurs de la promise (void)', () => {
      const rejectedFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const handler = asyncHandler(rejectedFn);

      // Should not throw
      expect(() => handler()).not.toThrow();
      expect(rejectedFn).toHaveBeenCalled();
    });

    it('devrait accepter des arguments et les passer à la fonction async', () => {
      const asyncFn = vi.fn().mockResolvedValue(undefined);
      const handler = asyncHandler(asyncFn);

      handler('test', 123);

      expect(asyncFn).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('createAsyncHandler', () => {
    it('devrait wrapper une fonction async avec gestion des erreurs', async () => {
      const asyncFn = vi.fn().mockResolvedValue(undefined);
      const handler = createAsyncHandler(asyncFn);

      expect(typeof handler).toBe('function');
      handler('arg1');

      // Wait for the promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(asyncFn).toHaveBeenCalledWith('arg1');
    });

    it('devrait capturer les erreurs avec console.error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(testError);
      const handler = createAsyncHandler(asyncFn);

      handler();

      // Wait for the promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith('Async handler error:', testError);

      consoleErrorSpy.mockRestore();
    });

    it('devrait accepter des arguments et les passer à la fonction async', async () => {
      const asyncFn = vi.fn().mockResolvedValue(undefined);
      const handler = createAsyncHandler(asyncFn);

      handler('test', 456);

      // Wait for the promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(asyncFn).toHaveBeenCalledWith('test', 456);
    });
  });

  describe('safeAsync', () => {
    it('devrait ignorer les erreurs de la promise avec void', async () => {
      const promise = Promise.reject(new Error('Test error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => safeAsync(promise)).not.toThrow();

      // Wait for the promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled async error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('devrait gérer les promises résolues sans erreur', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const promise = Promise.resolve('success');

      safeAsync(promise);

      // Wait for the promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
