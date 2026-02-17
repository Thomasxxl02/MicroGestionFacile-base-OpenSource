import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the best contrast color (black or white) for a given hex background
 * using the YIQ luminance formula.
 */
export function getContrastColor(hexColor: string): 'white' | 'black' {
  if (!hexColor) return 'white';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

/**
 * Generates a stable JSON string by sorting object keys recursively.
 * Essential for consistent hashing.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`;
  }
  const typedObj = obj as Record<string, unknown>;
  const keys = Object.keys(typedObj).sort();
  return `{${keys.map((k) => `"${k}":${stableStringify(typedObj[k])}`).join(',')}}`;
}

/**
 * Generates a SHA-256 hash for a given object (Invoice integrity)
 * Uses stable stringification to ensure the same object always produces the same hash.
 */
export async function calculateHash(data: unknown): Promise<string> {
  const json = typeof data === 'string' ? data : stableStringify(data);
  const msgUint8 = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
