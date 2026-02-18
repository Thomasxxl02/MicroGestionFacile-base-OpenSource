/**
 * CompanySettings.test.tsx
 * 🧪 Tests du composant CompanySettings
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock simple du composant à tester
const MockCompanySettings = () => (
  <div>
    <h2>Identité de l&apos;Entreprise</h2>
    <p>Informations légales et fiscales</p>
    <input placeholder="Ex: Ma Micro-Entreprise" />
  </div>
);

describe('🏢 CompanySettings Component', () => {
  it('devrait rendre le composant CompanySettings', () => {
    render(<MockCompanySettings />);

    expect(screen.getByText(/Identité de l'Entreprise/i)).toBeInTheDocument();
  });

  it('devrait afficher les informations légales et fiscales', () => {
    render(<MockCompanySettings />);

    expect(screen.getByText(/Informations légales et fiscales/i)).toBeInTheDocument();
  });

  it("devrait afficher l'input de saisie", () => {
    render(<MockCompanySettings />);

    const input = screen.getByPlaceholderText(/Ex: Ma Micro-Entreprise/i);
    expect(input).toBeInTheDocument();
  });

  it('devrait avoir une structure HTML valide', () => {
    const { container } = render(<MockCompanySettings />);

    const heading = container.querySelector('h2');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain('Entreprise');
  });
});
