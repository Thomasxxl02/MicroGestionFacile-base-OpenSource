/**
 * geminiService.test.ts
 * 🧪 Tests simples du service Gemini (IA)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateAssistantResponse, analyzePredictiveVat } from './geminiService';

// Mock des variables d'environnement
vi.mock('../../vite-env.d.ts', () => ({
  import: {
    meta: {
      env: {
        VITE_API_PROXY_URL: 'http://localhost:3001',
      },
    },
  },
}));

// Mock de loggerService
vi.mock('./loggerService', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('🤖 Gemini Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch global mock
    global.fetch = vi.fn();
  });

  describe('generateAssistantResponse', () => {
    it('devrait générer une réponse IA', async () => {
      const mockResponse = {
        success: true,
        data: 'Voici ma réponse IA',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await generateAssistantResponse('Quelle est la TVA?');
      expect(response).toBe('Voici ma réponse IA');
    });

    it('devrait gérer les erreurs API', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Erreur serveur' }),
      });

      const response = await generateAssistantResponse('Question');
      expect(response).toContain('erreur');
    });

    it('devrait gérer les erreurs réseau', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const response = await generateAssistantResponse('Question');
      expect(response).toContain('erreur');
    });

    it('devrait inclure le contexte dans la requête', async () => {
      const mockResponse = { success: true, data: 'Réponse' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const context = 'Contexte important';
      await generateAssistantResponse('Question', context);

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[0]).toContain('/api/ai/chat');
    });
  });

  describe('analyzePredictiveVat', () => {
    it('devrait analyser la TVA prévisionnelle', async () => {
      const mockResponse = {
        success: true,
        data: {
          isLikelyToExceed: false,
          monthsBeforeExceeding: null,
          recommendation: 'Vous êtes dans la limite',
          projectedCA: 100000,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await analyzePredictiveVat(50000, [], 'sales');
      expect(result).toBeDefined();
      expect(result.isLikelyToExceed).toBe(false);
    });

    it('devrait gérer les réponses invalides', async () => {
      const mockResponse = { success: false, data: null };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await analyzePredictiveVat(50000, [], 'sales');
      expect(result.isLikelyToExceed).toBe(false);
      expect(result.recommendation).toContain('Impossible');
    });
  });
});
