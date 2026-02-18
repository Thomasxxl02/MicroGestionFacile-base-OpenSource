/**
 * Usage Examples: Context Provider Patterns
 *
 * Exemples de bonnes et mauvaises pratiques d'utilisation du contexte
 */

import React from 'react';
import { useAppContext } from './AppContext';

/**
 * ✅ GOOD PATTERN #1: Utiliser le contexte dans un composant fonctionnel
 */
export function GoodComponent() {
  const { logger } = useAppContext();

  React.useEffect(() => {
    logger.info('Component mounted');
  }, [logger]);

  return <div>Composant avec contexte</div>;
}

/**
 * ✅ GOOD PATTERN #2: Utiliser un service spécifique
 */
export function LoggerConsumer() {
  const context = useAppContext();

  const handleClick = () => {
    context.logger.info('Button clicked');
  };

  return <button onClick={handleClick}>Log Action</button>;
}

/**
 * ✅ GOOD PATTERN #3: Vérifier l'initialisation
 */
export function ProtectedComponent() {
  const { isInitialized, initializationError } = useAppContext();

  if (initializationError) {
    return <div>Erreur d'initialisation: {initializationError.message}</div>;
  }

  if (!isInitialized) {
    return <div>⏳ Initialisation en cours...</div>;
  }

  return <div>✅ Services prêts!</div>;
}

/**
 * ✅ GOOD PATTERN #4: HOC pour composants de classe
 */
interface ClassComponentProps {
  logger?: any;
  encryption?: any;
}

class LegacyClassComponent extends React.Component<ClassComponentProps> {
  render() {
    return <div>Classe avec services injectés</div>;
  }
}

/**
 * Wrapping function pour HOC
 */
function withAppContextHOC<T extends ClassComponentProps>(
  Component: React.ComponentType<T>
): (props: Omit<T, keyof ClassComponentProps>) => React.ReactElement {
  return (props: Omit<T, keyof ClassComponentProps>) => {
    const context = useAppContext();
    return <Component {...(props as T)} logger={context.logger} encryption={context.encryption} />;
  };
}

export const LegacyComponentWrappedWithContext = withAppContextHOC(LegacyClassComponent);

// ============================================
// ANTI-PATTERNS À ÉVITER
// ============================================

/**
 * ❌ BAD PATTERN #1: Prop drilling excessif
 * Ne pas faire: passer des services à travers 5+ composants
 */
export function AvoidDeepPropDrilling() {
  const { logger } = useAppContext();
  // ✅ BON: utiliser le contexte directement à chaque niveau
  // ❌ MAUVAIS: passer 'logger' à travers trop de niveaux intermédiaires

  logger.info('Avoiding prop drilling');
  return <div>Avoid prop drilling antipattern</div>;
}

/**
 * ❌ BAD PATTERN #2: Importer directement les services
 * Legacy code - devrait être refactorisé
 */
// ❌ MAUVAIS (éviter):
// import { logger } from '../services/loggerService';
// function OldComponent() {
//   logger.info('Direct import');
//   return <div>Old Way</div>;
// }

// ✅ CORRECT:
// function NewComponent() {
//   const { logger } = useAppContext();
//   logger.info('Via contexte');
//   return <div>New Way</div>;
// }

// ============================================
// MIGRATION GUIDE: Old Pattern → New Pattern
// ============================================

/**
 * BEFORE (Ancien pattern - Imports directs):
 * ```typescript
 * import { logger } from '../services/loggerService';
 *
 * function MyComponent() {
 *   const handleClick = () => {
 *     logger.info('Clicked');  // Appel direct
 *   };
 *   return <button onClick={handleClick}>Click</button>;
 * }
 * ```
 *
 * AFTER (Nouveau pattern - Context Injection):
 * ```typescript
 * function MyComponent() {
 *   const { logger } = useAppContext();
 *
 *   const handleClick = () => {
 *     logger.info('Clicked');  // Via contexte
 *   };
 *   return <button onClick={handleClick}>Click</button>;
 * }
 * ```
 *
 * Bénéfices:
 * ✅ Testable: Mocker le contexte dans les tests
 * ✅ Pas de prop drilling: Accès partout dans l'arbre
 * ✅ Découplé: Remplacer l'implémentation du service facilement
 * ✅ Performance: Services initialisés une seule fois
 */

// ============================================
// TESTING PATTERNS
// ============================================

/**
 * Patron de test pour un composant utilisant AppContext
 *
 * ```typescript
 * import { render, screen } from '@testing-library/react';
 * import { vi } from 'vitest';
 * import { AppProvider } from './AppContext';
 *
 * describe('MyComponent', () => {
 *   it('should log on click', () => {
 *     const mockLogger = {
 *       info: vi.fn(),
 *       error: vi.fn(),
 *       warn: vi.fn(),
 *       debug: vi.fn(),
 *     };
 *
 *     // Mock useAppContext
 *     vi.mock('./AppContext', () => ({
 *       useAppContext: () => ({
 *         logger: mockLogger,
 *         encryption: { test: vi.fn() },
 *         keyManagement: {},
 *         isInitialized: true,
 *       }),
 *     }));
 *
 *     render(<MyComponent />);
 *     screen.getByRole('button').click();
 *
 *     expect(mockLogger.info).toHaveBeenCalledWith('Clicked');
 *   });
 * });
 * ```
 */
