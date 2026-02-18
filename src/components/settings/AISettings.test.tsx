/**
 * AISettings.test.tsx
 * 🧪 Tests du composant AISettings
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AISettings from './AISettings';

describe('🤖 AISettings Component', () => {
  it('devrait rendre le composant AISettings', () => {
    render(<AISettings />);

    expect(screen.getByText(/Assistant IA Sécurisé/i)).toBeInTheDocument();
  });

  it('devrait afficher la section de sécurité', () => {
    render(<AISettings />);

    expect(screen.getByText(/Clés API Sécurisées/i)).toBeInTheDocument();
  });

  it('devrait afficher les informations de proxy serveur', () => {
    render(<AISettings />);

    const proxyText = screen.getByText(/Powered by Google Gemini via Proxy Serveur/i);
    expect(proxyText).toBeInTheDocument();
  });

  it('devrait afficher les mentions de sécurité', () => {
    render(<AISettings />);

    expect(screen.getByText(/gérées uniquement par le serveur backend/i)).toBeInTheDocument();
  });

  it('devrait avoir une structure appropriée', () => {
    const { container } = render(<AISettings />);

    // Vérifier la structure HTML
    const mainDiv = container.querySelector('div');
    expect(mainDiv).toBeInTheDocument();
  });

  it('devrait afficher les icônes appropriées', () => {
    const { container } = render(<AISettings />);

    // Vérifier que les SVG (icônes) sont présents
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
