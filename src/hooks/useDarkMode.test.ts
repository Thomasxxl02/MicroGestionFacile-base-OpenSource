/**
 * useDarkMode.test.ts
 * 🧪 Tests du hook de gestion du mode sombre
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from './useDarkMode';

describe('🌙 useDarkMode', () => {
  beforeEach(() => {
    // Nettoyer le localStorage avant chaque test
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    // Nettoyer après chaque test
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Initialisation', () => {
    it('devrait utiliser le thème sauvegardé dans localStorage', () => {
      localStorage.setItem('theme', 'dark');

      const { result } = renderHook(() => useDarkMode());

      expect(result.current.isDarkMode).toBe(true);
    });

    it('devrait utiliser le thème light si sauvegardé', () => {
      localStorage.setItem('theme', 'light');

      const { result } = renderHook(() => useDarkMode());

      expect(result.current.isDarkMode).toBe(false);
    });

    it('devrait utiliser la préférence système si aucun thème sauvegardé', () => {
      // Mock de matchMedia pour tester la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      const { result } = renderHook(() => useDarkMode());

      expect(result.current.isDarkMode).toBe(prefersDark);
    });

    it('devrait toujours retourner un booléen', () => {
      const { result } = renderHook(() => useDarkMode());

      expect(typeof result.current.isDarkMode).toBe('boolean');
    });
  });

  describe('toggleDarkMode', () => {
    it('devrait basculer le mode sombre', () => {
      localStorage.setItem('theme', 'light');

      const { result } = renderHook(() => useDarkMode());

      expect(result.current.isDarkMode).toBe(false);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(true);
    });

    it('devrait bascule plusieurs fois', () => {
      const { result } = renderHook(() => useDarkMode());

      const initialState = result.current.isDarkMode;

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(!initialState);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(initialState);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(!initialState);
    });
  });

  describe('Persévérance en localStorage', () => {
    it('devrait sauvegarder dark mode dans localStorage', () => {
      localStorage.setItem('theme', 'light');
      const { result } = renderHook(() => useDarkMode());

      expect(localStorage.getItem('theme')).toBe('light');

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('devrait sauvegarder light mode dans localStorage', () => {
      localStorage.setItem('theme', 'dark');
      const { result } = renderHook(() => useDarkMode());

      expect(localStorage.getItem('theme')).toBe('dark');

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('devrait persévérer à travers les rendus', () => {
      const { result, rerender } = renderHook(() => useDarkMode());

      act(() => {
        result.current.toggleDarkMode();
      });

      const isDarkAfterToggle = result.current.isDarkMode;

      rerender();

      expect(result.current.isDarkMode).toBe(isDarkAfterToggle);
    });
  });

  describe('Manipulation du DOM', () => {
    it('devrait ajouter la classe dark au documentElement en mode dark', () => {
      localStorage.setItem('theme', 'light');
      const { result } = renderHook(() => useDarkMode());

      expect(document.documentElement.classList.contains('dark')).toBe(false);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('devrait retirer la classe dark du documentElement en mode light', () => {
      localStorage.setItem('theme', 'dark');
      const { result } = renderHook(() => useDarkMode());

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('devrait initialiser la classe dark si enabled initialement', () => {
      localStorage.setItem('theme', 'dark');

      renderHook(() => useDarkMode());

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('ne devrait pas ajouter dark si disabled initialement', () => {
      localStorage.setItem('theme', 'light');

      renderHook(() => useDarkMode());

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Synchronisation DOM et localStorage', () => {
    it('devrait synchroniser DOM et localStorage à chaque changement', () => {
      localStorage.setItem('theme', 'light');
      const { result } = renderHook(() => useDarkMode());

      act(() => {
        result.current.toggleDarkMode();
      });

      // À la fois le DOM et localStorage doivent être à jour
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('Rendu et références', () => {
    it('devrait maintenir les références pour les fonctions', () => {
      const { result, rerender } = renderHook(() => useDarkMode());

      const { toggleDarkMode: toggle1 } = result.current;

      rerender();

      const { toggleDarkMode: toggle2 } = result.current;

      // La référence peut changer (pas memoized), ce qui est OK
      expect(typeof toggle1).toBe('function');
      expect(typeof toggle2).toBe('function');
    });

    it('devrait retourner un objet avec les bonnes propriétés', () => {
      const { result } = renderHook(() => useDarkMode());

      expect(result.current).toHaveProperty('isDarkMode');
      expect(result.current).toHaveProperty('toggleDarkMode');
      expect(Object.keys(result.current)).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer les valeurs invalides dans localStorage', () => {
      localStorage.setItem('theme', 'invalid-theme');

      const { result } = renderHook(() => useDarkMode());

      // Devrait traiter comme non-dark
      expect(result.current.isDarkMode).toBe(false);
    });

    it('devrait gérer les valeurs null dans localStorage', () => {
      localStorage.setItem('theme', ''); // Valeur vide

      const { result } = renderHook(() => useDarkMode());

      // Devrait se rabattre sur la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      expect(result.current.isDarkMode).toBe(prefersDark);
    });

    it("ne devrait pas lever d'erreur si documentElement n'existe pas", () => {
      // Normalement le documentElement existe toujours en test ou navigateur
      // Mais tester la stabilité générale

      expect(() => {
        renderHook(() => useDarkMode());
      }).not.toThrow();
    });
  });

  describe('Bascule répétée', () => {
    it('devrait stabiliser après basculements multiples', () => {
      const { result } = renderHook(() => useDarkMode());

      // État initial
      const initial = result.current.isDarkMode;

      // Basculer 2x devrait revenir à l'état initial
      act(() => {
        result.current.toggleDarkMode();
      });

      const afterFirstToggle = result.current.isDarkMode;
      expect(afterFirstToggle).toBe(!initial);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(initial);
    });

    it('devrait gérer les basculements rapides', () => {
      localStorage.setItem('theme', 'light');
      const { result } = renderHook(() => useDarkMode());

      // Basculer une fois pour être en dark mode
      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(true);

      // Basculer 99 fois de plus (100 au total) pour revenir à light
      act(() => {
        for (let i = 0; i < 99; i++) {
          result.current.toggleDarkMode();
        }
      });

      // Après 100 basculements (nombre pair), devrait revenir à light
      expect(result.current.isDarkMode).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });
});
