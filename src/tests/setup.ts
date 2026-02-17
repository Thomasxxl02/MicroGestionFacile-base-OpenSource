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
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
  deriveBits: vi.fn(),
  deriveKey: vi.fn(),
  wrapKey: vi.fn(),
  unwrapKey: vi.fn(),
  digest: vi.fn((_algorithm: string | AlgorithmIdentifier, data: BufferSource) => {
    // Convert data to string for hashing
    const str = new TextDecoder().decode(new Uint8Array(data as ArrayBuffer));
    const hash = simpleHash(str);
    return Promise.resolve(hash);
  }),
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

// Mock localStorage
const localStorageMock: Storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

global.localStorage = localStorageMock;
