/**
 * AppContextUtils - Utilitaires du contexte d'application
 *
 * Contient les hooks et HOCs pour accéder au AppContext
 * Séparé de AppContext.tsx pour éviter les warnings react-refresh
 */

import { useContext } from 'react';
import React from 'react';
import { AppContext, AppContextType } from './AppContext';

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
 * @example const logger = useAppService('logger');
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
