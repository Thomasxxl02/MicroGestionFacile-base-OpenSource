/**
 * Types et interfaces pour le chiffrement
 * Utilisés à travers toute l'application pour la sécurité des types
 */

/**
 * Identificateur de données chiffrées (pour TypeScript)
 */
export type Encrypted<T> = EncryptedField & {
  __dataType?: T;
};

/**
 * Format des données chiffrées stockées en IndexedDB
 */
export interface EncryptedField {
  __encrypted: true;
  __algorithm: 'AES-GCM';
  __keyVersion: number;
  __iv: string; // base64
  __authTag?: string;
  value: string; // base64(ciphertext)
}

/**
 * Configuration de chiffrement par table
 */
export interface EncryptionConfig {
  [tableName: string]: {
    enabled: boolean;
    fields: string[]; // "path.to.field" format supporté
    algorithm: 'AES-GCM';
    keyRotationDays: number;
  };
}

/**
 * Status du chiffrement
 */
export interface EncryptionStatus {
  initialized: boolean;
  tables: {
    [tableName: string]: {
      encrypted: number;
      unencrypted: number;
      total: number;
      lastKeyRotation?: string;
    };
  };
}

/**
 * Déterminer si une valeur est chiffrée
 */
export function isEncryptedField(value: any): value is EncryptedField {
  return (
    value &&
    typeof value === 'object' &&
    value.__encrypted === true &&
    'value' in value &&
    '__iv' in value
  );
}

/**
 * Extraire le type original (pour TypeScript)
 */
export function getDecryptedType<T>(encrypted: Encrypted<T>): T | undefined {
  return (encrypted as any).__dataType as T;
}
