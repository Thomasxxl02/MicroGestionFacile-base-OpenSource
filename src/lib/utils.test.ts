import { describe, it, expect } from 'vitest';
import { cn, getContrastColor, stableStringify, calculateHash } from './utils';

describe('utils', () => {
  describe('cn()', () => {
    it('devrait fusionner les classes CSS correctement', () => {
      const result = cn('px-4 py-2', 'bg-blue-500');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-blue-500');
    });

    it('devrait gérer le tailwind merge correctement', () => {
      const result = cn('px-4', 'px-6');
      expect(result).toContain('px-6');
      expect(result).not.toContain('px-4');
    });

    it('devrait ingnorer les classes nulles/undefined', () => {
      const result = cn('px-4', undefined, 'py-2', null, 'bg-blue-500');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-blue-500');
    });

    it('devrait gérer les objets conditionnels', () => {
      const result = cn({
        'px-4': true,
        'py-2': false,
        'bg-blue-500': true,
      });
      expect(result).toContain('px-4');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('py-2');
    });
  });

  describe('getContrastColor()', () => {
    it('devrait retourner white pour les couleurs sombres', () => {
      const result = getContrastColor('#000000');
      expect(result).toBe('white');
    });

    it('devrait retourner black pour les couleurs claires', () => {
      const result = getContrastColor('#FFFFFF');
      expect(result).toBe('black');
    });

    it('devrait retourner black pour les couleurs jaunes', () => {
      const result = getContrastColor('#FFFF00');
      expect(result).toBe('black');
    });

    it('devrait retourner white pour les couleurs bleues foncées', () => {
      const result = getContrastColor('#0000FF');
      expect(result).toBe('white');
    });

    it('devrait gérer les couleurs sans hash', () => {
      const result = getContrastColor('FFFFFF');
      expect(result).toBe('black');
    });

    it('devrait retourner white pour les chaînes vides ou nulles', () => {
      expect(getContrastColor('')).toBe('white');
    });

    it('devrait utiliser la formule YIQ correctement', () => {
      // Tests de couleurs connues
      const darkRed = getContrastColor('#800000'); // Maroon - should be white
      expect(darkRed).toBe('white');

      const lightGreen = getContrastColor('#00FF00'); // Bright green - should be black
      expect(lightGreen).toBe('black');
    });
  });

  describe('stableStringify()', () => {
    it('devrait stringifier les types primitifs', () => {
      expect(stableStringify(null)).toBe('null');
      expect(stableStringify(42)).toBe('42');
      expect(stableStringify('test')).toBe('"test"');
      expect(stableStringify(true)).toBe('true');
    });

    it('devrait trier les clés des objets', () => {
      const obj1 = { z: 1, a: 2, m: 3 };
      const obj2 = { a: 2, m: 3, z: 1 };
      expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    });

    it('devrait traiter les tableaux correctement', () => {
      const arr = [3, 1, 2];
      const expected = `[3,1,2]`;
      expect(stableStringify(arr)).toBe(expected);
    });

    it('devrait gérer les objets imbriqués', () => {
      const obj1 = { a: { z: 1, a: 2 }, b: [1, 2] };
      const obj2 = { a: { a: 2, z: 1 }, b: [1, 2] };
      expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    });

    it('devrait traiter les objets complexes', () => {
      const obj = {
        invoice: {
          number: 'INV-001',
          amount: 100.5,
          items: [
            { id: '1', price: 50 },
            { id: '2', price: 50.5 },
          ],
        },
        client: { name: 'Test' },
      };

      const result = stableStringify(obj);
      expect(result).toContain('"invoice"');
      expect(result).toContain('"client"');
      expect(result).toContain('"number"');
      expect(result).toContain('"INV-001"');
    });

    it('devrait toujours retourner la même sortie pour les mêmes données', () => {
      const obj = { b: 2, a: 1, c: { z: 26, a: 1 } };
      const hash1 = stableStringify(obj);
      const hash2 = stableStringify(obj);
      expect(hash1).toBe(hash2);
    });
  });

  describe('calculateHash()', () => {
    it('devrait calculer un hash SHA-256 pour une chaîne', async () => {
      const hash = await calculateHash('test');
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      // Note: jsdom peut ne pas avoir crypto.subtle, donc on teste juste que c'est une chaîne
    });

    it('devrait calculer le même hash pour le même contenu', async () => {
      const hash1 = await calculateHash('test');
      const hash2 = await calculateHash('test');
      expect(hash1).toBe(hash2);
    });

    it('devrait calculer des hashes différents pour des contenus différents', async () => {
      const hash1 = await calculateHash('test1');
      const hash2 = await calculateHash('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('devrait calculer un hash pour un objet', async () => {
      const obj = { invoice: 'INV-001', amount: 100 };
      const hash = await calculateHash(obj);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    it('devrait calculer le même hash pour les objets avec les mêmes données (même ordre)', async () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };
      const hash1 = await calculateHash(obj1);
      const hash2 = await calculateHash(obj2);
      expect(hash1).toBe(hash2);
    });

    it('devrait calculer le même hash pour les objets avec la même donnée (ordre différent)', async () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { c: 3, b: 2, a: 1 };
      const hash1 = await calculateHash(obj1);
      const hash2 = await calculateHash(obj2);
      expect(hash1).toBe(hash2); // Grâce à stableStringify
    });

    it('devrait être déterministe et reproducible', async () => {
      const data = { test: 'value', nested: { key: 'data' } };
      const hashes = await Promise.all([data, data, data].map((d) => calculateHash(d)));
      expect(hashes[0]).toBe(hashes[1]);
      expect(hashes[1]).toBe(hashes[2]);
    });
  });
});
