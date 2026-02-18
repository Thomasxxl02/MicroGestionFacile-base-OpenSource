import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Augment Vitest's expect with jest-dom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveClass(className: string | string[]): T;
    toHaveAttribute(attr: string, value?: string): T;
    toHaveStyle(style: string | Record<string, string>): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeEmptyDOMElement(): T;
    toBeInvalid(): T;
    toBeValid(): T;
    toBeRequired(): T;
    toBePartiallyChecked(): T;
    toHaveFormValues(values: Record<string, any>): T;
    toHaveErrorMessage(message: string): T;
    toHaveDisplayValue(value: string | string[]): T;
    toBeChecked(): T;
    toHaveFocus(): T;
    toHaveReachedIntersectionThreshold(): T;
    toHaveValue(value: string | number | string[]): T;
    toHaveTextContent(text: string | RegExp, options?: any): T;
  }
}

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto API for tests (used in securityService and utils)
// Simple hash function for testing (not cryptographically secure)
const simpleHash = (data: string): Uint8Array => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & 0xffffffff; // Convert to 32-bit integer
  }
  // Create a 32-byte (256-bit) array for SHA-256 compatibility
  const result = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    result[i] = (hash >>> (i * 8)) & 0xff;
  }
  // Fill rest with data-dependent values
  for (let i = 4; i < 32; i++) {
    result[i] = ((result[i - 1] ^ result[Math.floor(i / 2)]) * 31) & 0xff;
  }
  return result;
};

const mockSubtleCrypto: SubtleCrypto = {
  generateKey: vi.fn(),
  exportKey: vi.fn(),
  importKey: vi.fn(),
  encrypt: vi.fn((_algorithm: any, _key: CryptoKey, data: BufferSource) => {
    // Mock implementation that returns a ciphertext as ArrayBuffer
    const plaintext = new Uint8Array(data as ArrayBuffer);
    const ciphertext = new Uint8Array(plaintext.length + 12); // Add simple encryption
    for (let i = 0; i < plaintext.length; i++) {
      ciphertext[i + 12] = plaintext[i] ^ 0xaa; // Simple XOR encryption
    }
    // Fill first 12 bytes with IV-like data
    for (let i = 0; i < 12; i++) {
      ciphertext[i] = Math.floor(Math.random() * 256);
    }
    return Promise.resolve(ciphertext.buffer as ArrayBuffer);
  }),
  decrypt: vi.fn((_algorithm: any, _key: CryptoKey, data: BufferSource) => {
    // Mock implementation that decrypts the simple XOR
    const encrypted = new Uint8Array(data as ArrayBuffer);
    const plaintext = new Uint8Array(encrypted.length - 12);
    for (let i = 0; i < plaintext.length; i++) {
      plaintext[i] = encrypted[i + 12] ^ 0xaa; // Reverse the XOR
    }
    return Promise.resolve(plaintext.buffer as ArrayBuffer);
  }),
  sign: vi.fn(),
  verify: vi.fn(),
  deriveBits: vi.fn((_algorithm: any, _key: CryptoKey, length: number) => {
    // Return a random buffer of the requested length
    const derivedBits = new Uint8Array(length / 8);
    for (let i = 0; i < derivedBits.length; i++) {
      derivedBits[i] = Math.floor(Math.random() * 256);
    }
    return Promise.resolve(derivedBits.buffer);
  }),
  deriveKey: vi.fn(),
  wrapKey: vi.fn(),
  unwrapKey: vi.fn(),
  digest: vi.fn((_algorithm: string | AlgorithmIdentifier, data: BufferSource) => {
    // Convert data to string for hashing
    const str = new TextDecoder().decode(new Uint8Array(data as ArrayBuffer));
    const hash = simpleHash(str);
    return Promise.resolve(hash.buffer as ArrayBuffer);
  }) as (algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>,
};

const mockCrypto: Crypto = {
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
  getRandomValues(array) {
    if (array instanceof Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  },
  subtle: mockSubtleCrypto,
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
});

// Mock localStorage with actual storage behavior
const store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((key) => delete store[key]);
  },
  key: (index: number) => {
    const keys = Object.keys(store);
    return keys[index] || null;
  },
  length: Object.keys(store).length,
};

// Make length a getter to always return current store size
Object.defineProperty(localStorageMock, 'length', {
  get: () => Object.keys(store).length,
  configurable: true,
});

global.localStorage = localStorageMock;

// Mock window.matchMedia for dark mode tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
