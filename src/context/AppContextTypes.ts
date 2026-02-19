/**
 * AppContextTypes - Définition du contexte et de ses types
 *
 * Ce fichier sépare les types et la création du contexte du composant Provider
 * pour permettre le hot reload efficace avec react-refresh
 */

import { createContext } from 'react';
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
export const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props pour le Provider
 */
export interface AppProviderProps {
  children: React.ReactNode;
  userPassphrase?: string; // Pour initialiser l'encryption
}
