/**
 * validationService.test.ts
 * 🧪 Suite de tests pour validationService
 */

import { describe, it, expect } from 'vitest';
import {
  validateData,
  validateAmount,
  validateEmail,
  validateSiret,
  validateDataBatch,
  getErrorMessages,
} from '../../src/services/validationService';
import { z } from 'zod';

describe('✅ validationService', () => {
  // ============================================================================
  // TESTS: validateData
  // ============================================================================

  describe('validateData', () => {
    it('doit valider des données valides', async () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const data = { name: 'John', age: 30 };

      const result = await validateData(data, schema, 'test-id', 'TestType');

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toEqual([]);
    });

    it('doit rejeter les données invalides', async () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const data = { name: 'John', age: 'not-a-number' };

      const result = await validateData(data, schema, 'test-id', 'TestType');

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('doit retourner les erreurs Zod', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });
      const data = { email: 'invalid', age: 15 };

      const result = await validateData(data, schema, 'test-id', 'TestType');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Les erreurs doivent avoir les champs requis
      result.errors.forEach((err) => {
        expect(err).toHaveProperty('field');
        expect(err).toHaveProperty('message');
        expect(err).toHaveProperty('code');
      });
    });
  });

  // ============================================================================
  // TESTS: validateEmail
  // ============================================================================

  describe('validateEmail', () => {
    it('doit valider un email valide', async () => {
      const result = await validateEmail('test@example.com');

      expect(result.valid).toBe(true);
      expect(result.data).toBe('test@example.com');
    });

    it('doit rejeter un email sans @', async () => {
      const result = await validateEmail('testexample.com');

      expect(result.valid).toBe(false);
    });

    it('doit rejeter un email vide', async () => {
      const result = await validateEmail('');

      expect(result.valid).toBe(false);
    });
  });

  // ============================================================================
  // TESTS: validateSiret
  // ============================================================================

  describe('validateSiret', () => {
    it('doit valider un SIRET valide (14 chiffres)', async () => {
      const result = await validateSiret('12345678901234');

      expect(result.valid).toBe(true);
      expect(result.data).toBe('12345678901234');
    });

    it('doit valider un SIRET avec espaces', async () => {
      const result = await validateSiret('123 456 789 01234');

      expect(result.valid).toBe(true);
      expect(result.data).toBe('12345678901234');
    });

    it('doit rejeter un SIRET trop court', async () => {
      const result = await validateSiret('12345');

      expect(result.valid).toBe(false);
    });

    it('doit rejeter un SIRET avec caractères non numériques', async () => {
      const result = await validateSiret('123 456 ABC 01234');

      expect(result.valid).toBe(false);
    });
  });

  // ============================================================================
  // TESTS: validateAmount
  // ============================================================================

  describe('validateAmount', () => {
    it('doit valider un montant positif', async () => {
      const result = await validateAmount(150.5);

      expect(result.valid).toBe(true);
      expect(result.data).toBe(150.5);
    });

    it('doit rejeter un montant négatif par défaut', async () => {
      const result = await validateAmount(-50);

      expect(result.valid).toBe(false);
    });

    it('doit accepter les montants négatifs si allowNegative=true', async () => {
      const result = await validateAmount(-50, { allowNegative: true });

      expect(result.valid).toBe(true);
    });

    it('doit détecter les montants > maxAmount', async () => {
      const result = await validateAmount(1000000, { maxAmount: 999999.99 });

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toMatch(/maximum/i);
    });

    it('doit rejeter les valeurs non numériques', async () => {
      const result = await validateAmount('not-a-number' as unknown);

      expect(result.valid).toBe(false);
    });
  });

  // ============================================================================
  // TESTS: validateDataBatch
  // ============================================================================

  describe('validateDataBatch', () => {
    const schema = z.object({
      id: z.string(),
      value: z.number(),
    });

    it('doit valider un batch de données valides', async () => {
      const items = [
        { id: '1', value: 100 },
        { id: '2', value: 200 },
      ];

      const result = await validateDataBatch(items, schema, 'TestBatch');

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it('doit séparer les données valides et invalides', async () => {
      const items = [
        { id: '1', value: 100 },
        { id: '2', value: 'invalid' },
        { id: '3', value: 300 },
      ];

      const result = await validateDataBatch(items, schema, 'TestBatch');

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].index).toBe(1);
    });
  });

  // ============================================================================
  // TESTS: Helper functions
  // ============================================================================

  describe('getErrorMessages', () => {
    it("doit extraire les messages d'erreur", async () => {
      const schema = z.object({ name: z.string().min(3) });
      const result = await validateData({ name: 'ab' }, schema, 'test', 'Test');

      const messages = getErrorMessages(result);

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toBeTruthy();
    });

    it("doit retourner un tableau vide si pas d'erreurs", async () => {
      const schema = z.object({ name: z.string() });
      const result = await validateData({ name: 'valid' }, schema, 'test', 'Test');

      const messages = getErrorMessages(result);

      expect(messages).toEqual([]);
    });
  });

  describe('hasFieldError', () => {
    it('doit détecter une erreur dans la validation', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });
      const result = await validateData({ email: 'invalid', age: 15 }, schema, 'test', 'Test');

      // Au moins une erreur doit être présente
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.valid).toBe(false);
    });
  });
});
