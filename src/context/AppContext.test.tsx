/**
 * Test App Context Provider
 * Valide l'injection des services et le comportement du contexte
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider, useAppContext, useAppService, useAppInitialization } from './AppContext';

// Mock des services
vi.mock('../services/loggerService', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/encryptionService', () => ({
  encryptionService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    test: vi.fn().mockResolvedValue(true),
    getStatus: vi.fn().mockResolvedValue({ initialized: true }),
  },
}));

vi.mock('../services/keyManagementService', () => ({
  keyManagementService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    test: vi.fn().mockResolvedValue(true),
    getSecurityStatus: vi.fn(),
  },
}));

vi.mock('../services/auditService', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

vi.mock('../services/businessService', () => ({
  businessService: {
    getDashboardData: vi.fn(),
  },
}));

vi.mock('../services/validationService', () => ({
  validateInvoice: vi.fn(),
}));

vi.mock('../services/cacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Composant test
function TestComponent() {
  const context = useAppContext();
  return (
    <div>
      <div data-testid="is-initialized">{context.isInitialized ? 'Ready' : 'Loading'}</div>
      <div data-testid="has-logger">{context.logger ? 'Has Logger' : 'No Logger'}</div>
    </div>
  );
}

describe('🏗️ AppContext Provider', () => {
  describe('AppProvider', () => {
    it('devrait fournir les services via le contexte', async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Attendre l'initialisation
      await waitFor(
        () => {
          expect(screen.getByTestId('is-initialized')).toHaveTextContent('Ready');
        },
        { timeout: 3000 }
      );

      expect(screen.getByTestId('has-logger')).toHaveTextContent('Has Logger');
    });

    it('devrait initialiser les services avec userPassphrase', async () => {
      const { encryptionService } = await import('../services/encryptionService');

      render(
        <AppProvider userPassphrase="test-passphrase">
          <TestComponent />
        </AppProvider>
      );

      await waitFor(() => {
        expect(encryptionService.initialize).toHaveBeenCalledWith('test-passphrase');
      });
    });

    it("devrait capturer les erreurs d'initialisation", async () => {
      const { encryptionService } = await import('../services/encryptionService');
      vi.mocked(encryptionService.initialize).mockRejectedValueOnce(
        new Error('Initialization failed')
      );

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      // Le composant devrait toujours rendre (graceful degradation)
      expect(screen.getByTestId('has-logger')).toBeInTheDocument();
    });
  });

  describe('useAppContext', () => {
    it('devrait retourner le contexte', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contextRef = { current: null as any };

      function ContextCapture() {
        const ctx = useAppContext();
        React.useEffect(() => {
          contextRef.current = ctx;
        }, [ctx]);
        return null;
      }

      render(
        <AppProvider>
          <ContextCapture />
        </AppProvider>
      );

      await waitFor(() => {
        expect(contextRef.current).toBeDefined();
        expect(contextRef.current?.logger).toBeDefined();
        expect(contextRef.current?.encryption).toBeDefined();
        expect(contextRef.current?.isInitialized).toBe(true);
      });
    });

    it('devrait lever une erreur en dehors du Provider', () => {
      function BadComponent() {
        useAppContext(); // ❌ Pas de Provider!
        return <div>Test</div>;
      }

      // Expect to throw
      expect(() => render(<BadComponent />)).toThrow(
        'useAppContext must be used within an <AppProvider>'
      );
    });
  });

  describe('useAppService', () => {
    it('devrait retourner les services spécifiques', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serviceRef = { current: null as any };

      function ServiceConsumer() {
        const service = useAppService('logger');
        React.useEffect(() => {
          serviceRef.current = service;
        }, [service]);
        return null;
      }

      render(
        <AppProvider>
          <ServiceConsumer />
        </AppProvider>
      );

      await waitFor(() => {
        expect(serviceRef.current).toBeDefined();
        expect(serviceRef.current?.info).toBeDefined();
      });
    });
  });

  describe('useAppInitialization', () => {
    it("devrait signaler l'état d'initialisation", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateRef = { current: null as any };

      function InitComponent() {
        const state = useAppInitialization();
        React.useEffect(() => {
          stateRef.current = state;
        }, [state]);
        return <div>{state.isInitialized ? 'Ready' : 'Loading'}</div>;
      }

      render(
        <AppProvider>
          <InitComponent />
        </AppProvider>
      );

      await waitFor(() => {
        expect(stateRef.current?.isInitialized).toBe(true);
        expect(stateRef.current?.isLoading).toBe(false);
        expect(stateRef.current?.error).toBeUndefined();
      });
    });
  });

  describe('Service Injection', () => {
    it('devrait injecter tous les services critiques', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contextRef = { current: null as any };

      function ServiceCheck() {
        const ctx = useAppContext();
        React.useEffect(() => {
          contextRef.current = ctx;
        }, [ctx]);
        return null;
      }

      render(
        <AppProvider>
          <ServiceCheck />
        </AppProvider>
      );

      await waitFor(() => {
        expect(contextRef.current?.logger).toBeDefined();
        expect(contextRef.current?.encryption).toBeDefined();
        expect(contextRef.current?.keyManagement).toBeDefined();
        expect(contextRef.current?.isInitialized).toBeDefined();
      });
    });
  });

  describe('Nested Providers', () => {
    it('devrait fonctionner avec plusieurs providers imbriqués', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contextsRef = { current: { ctx1: null as any, ctx2: null as any } };

      function Component1() {
        const ctx = useAppContext();
        React.useEffect(() => {
          contextsRef.current.ctx1 = ctx;
        }, [ctx]);
        return <Component2 />;
      }

      function Component2() {
        const ctx = useAppContext();
        React.useEffect(() => {
          contextsRef.current.ctx2 = ctx;
        }, [ctx]);
        return null;
      }

      render(
        <AppProvider>
          <Component1 />
        </AppProvider>
      );

      await waitFor(() => {
        // Même contexte partout
        expect(contextsRef.current.ctx1?.logger).toBe(contextsRef.current.ctx2?.logger);
      });
    });
  });
});
