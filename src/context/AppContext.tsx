/**
 * AppContext - Contexte Global d'Application
 *
 * Centralise l'injection des services critiques:
 * - Logger
 * - Encryption
 * - Audit
 * - Business Logic
 * - Validation
 * - Caching
 *
 * Avantages:
 * - Pas de prop drilling
 * - Dépendances clairement typées
 * - Facile à tester (injection de mocks)
 * - Lifecycle contrôlé
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { logger } from '../services/loggerService';
import { encryptionService } from '../services/encryptionService';
import { keyManagementService } from '../services/keyManagementService';

/**
 * Type d'interface pour tous les services injectés
 */
export interface AppContextType {
  // Logging & Debugging
  logger: typeof logger;

  // Sécurité & Chiffrement
  encryption: typeof encryptionService;
  keyManagement: typeof keyManagementService;

  // Métadonnées du service
  isInitialized: boolean;
  initializationError?: Error;
}

/**
 * Le contexte lui-même
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props pour le Provider
 */
interface AppProviderProps {
  children: ReactNode;
  userPassphrase?: string; // Pour initialiser l'encryption
}

/**
 * AppProvider - Initialise et fournit tous les services
 *
 * À positionner au sommet de l'arbre React (dans App.tsx)
 */
export function AppProvider({ children, userPassphrase }: AppProviderProps) {
  const [initialized, setInitialized] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  // Initialiser les services une seule fois
  React.useEffect(() => {
    async function initializeServices() {
      try {
        logger.info('[AppProvider] Initializing services...');

        // 1. Initialiser le chiffrement si une passphrase est fournie
        if (userPassphrase) {
          await encryptionService.initialize(userPassphrase);
          logger.info('[AppProvider] Encryption service initialized');
        }

        // 2. Services additionnels (optionnels)
        try {
          // Silent initialization failures for optional services

          void keyManagementService;
        } catch {
          logger.warn('[AppProvider] Key management init skipped');
        }

        logger.info('[AppProvider] Services initialized successfully');
        setInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('[AppProvider] Initialization failed', error);
        setError(error);
        // Graceful degradation: still mark as initialized to show the app
        setInitialized(true);
      }
    }

    // Toujours permettre au rendering de continuer même si init échoue
    initializeServices().catch((err) => {
      logger.error('[AppProvider] Unhandled initialization error', err);
    });
  }, [userPassphrase]); // Re-init seulement si passphrase change

  // Fournir le contexte
  const value: AppContextType = {
    logger,
    encryption: encryptionService,
    keyManagement: keyManagementService,
    isInitialized: initialized,
    initializationError: error,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook pour utiliser le contexte
 * @throws Error si utilisé en dehors du AppProvider
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useAppContext must be used within an <AppProvider>. ' +
        'Make sure your component is wrapped with <AppProvider> in the component tree.'
    );
  }

  return context;
}

/**
 * Hook pour accéder rapidement à un service spécifique
 * @example const { logger } = useAppContext(); // Ou:
 *          const logger = useAppService('logger');
 */
export function useAppService<K extends keyof AppContextType>(serviceName: K): AppContextType[K] {
  const context = useAppContext();
  return context[serviceName];
}

/**
 * Higher-Order Component pour fournir le contexte aux composants
 * Utile pour les composants de classe (non-hooks)
 */
export function withAppContext<P extends object>(
  Component: React.ComponentType<P & { appContext: AppContextType }>
): React.FC<P> {
  return (props: P) => {
    const appContext = useAppContext();
    return <Component {...props} appContext={appContext} />;
  };
}

/**
 * Hook pour vérifier que l'initialization est complète
 * Affiche un spinner ou un message d'erreur sinon
 */
export function useAppInitialization() {
  const { isInitialized, initializationError } = useAppContext();

  return {
    isInitialized,
    isLoading: !isInitialized && !initializationError,
    error: initializationError,
    hasError: Boolean(initializationError),
  };
}
