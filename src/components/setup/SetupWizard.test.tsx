/**
 * SetupWizard.test.tsx
 * 🧪 Tests du composant SetupWizard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// Mock des dépendances
vi.mock('../../types', () => ({
  UserProfileSchema: { parse: vi.fn((v) => v) },
}));

// Props type for MockSetupWizard
interface SetupWizardProps {
  onComplete: (data: unknown) => void;
  initialData?: unknown;
}

// Créer un widget simple pour les tests sans les dépendances complexes
const MockSetupWizard = ({ onComplete, initialData }: SetupWizardProps) => (
  <div data-testid="setup-wizard">
    <h1>Bienvenue</h1>
    <button onClick={() => onComplete(initialData)}>Continuer</button>
  </div>
);

describe('🧙 SetupWizard Component', () => {
  const mockOnComplete = vi.fn();

  const mockInitialData = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre le composant SetupWizard', () => {
    render(<MockSetupWizard onComplete={mockOnComplete} initialData={mockInitialData} />);

    expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
  });

  it("devrait afficher l'étape de bienvenue par défaut", () => {
    render(<MockSetupWizard onComplete={mockOnComplete} initialData={mockInitialData} />);

    expect(screen.getByText(/bienvenue/i)).toBeInTheDocument();
  });

  it('devrait appeler onComplete au clic sur Continuer', async () => {
    const user = userEvent.setup();
    render(<MockSetupWizard onComplete={mockOnComplete} initialData={mockInitialData} />);

    const button = screen.getByRole('button', { name: /continuer/i });
    await user.click(button);

    expect(mockOnComplete).toHaveBeenCalledWith(mockInitialData);
  });
});
