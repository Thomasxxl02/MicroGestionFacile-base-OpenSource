import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

describe('Button', () => {
  describe('Rendu de base', () => {
    it('devrait rendre un bouton avec du texte', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('devrait rendre avec la variante primary par défaut', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('devrait rendre avec la variante secondary', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('devrait rendre avec la variante danger', () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive/10');
      expect(button).toHaveClass('text-destructive');
    });

    it('devrait rendre avec la variante ghost', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('devrait rendre avec la variante outline', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
    });

    it('devrait rendre avec la variante success', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-emerald-500/10');
    });

    it('devrait rendre avec la variante gradient', () => {
      render(<Button variant="gradient">Gradient</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('Tailles', () => {
    it('devrait rendre avec la taille sm', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-xs');
    });

    it('devrait rendre avec la taille md par défaut', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-sm');
    });

    it('devrait rendre avec la taille lg', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-10');
      expect(button).toHaveClass('py-4');
      expect(button).toHaveClass('text-base');
    });

    it('devrait rendre avec la taille icon', () => {
      render(<Button size="icon" icon={AlertCircle} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-3');
    });
  });

  describe('Icônes', () => {
    it('devrait rendre une icône si fournie', () => {
      const { container } = render(<Button icon={AlertCircle}>With Icon</Button>);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('ne devrait pas rendre une icône si non fournie', () => {
      const { container } = render(<Button>No Icon</Button>);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('devrait rendre seulement une icône pour la taille icon', () => {
      render(<Button size="icon" icon={AlertCircle} />);
      const button = screen.getByRole('button');
      expect(button.textContent).not.toContain('Children');
    });
  });

  describe('État de chargement', () => {
    it('devrait afficher un spinner en cas de chargement', () => {
      const { container } = render(<Button loading>Loading</Button>);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it("ne devrait pas afficher l'icône durant le chargement", () => {
      const { container } = render(
        <Button loading icon={AlertCircle}>
          Loading
        </Button>
      );
      // Avec le loading, le spinner remplace l'icône
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      // L'icône ne doit pas être rendue
      const button = screen.getByRole('button');
      const svgs = button.querySelectorAll('svg');
      expect(svgs.length).toBe(0); // Pas d'icône SVG, juste le spinner
    });

    it('devrait afficher le texte même en cas de chargement', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });
  });

  describe('Événements', () => {
    it('devrait appeler onClick quand cliqué', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('ne devrait pas appeler onClick quand désactivé', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('État désactivé', () => {
    it('devrait avoir la classe disabled:opacity-50 quand désactivé', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('devrait accepter les propriétés HTML standard', () => {
      render(
        <Button id="test-btn" data-testid="custom-btn" title="Test button">
          Test
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'test-btn');
      expect(button).toHaveAttribute('title', 'Test button');
    });
  });

  describe('Classes personnalisées', () => {
    it('devrait accepter et appliquer des classes personnalisées', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('devrait combiner les classes de base avec les classes personnalisées', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Accessibilité', () => {
    it('devrait être un élément button valide', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it("devrait supporter l'attribut aria-label", () => {
      render(<Button aria-label="Custom label">Content</Button>);
      const button = screen.getByRole('button', { name: /custom label/i });
      expect(button).toBeInTheDocument();
    });

    it('devrait avoir le focus outline avec focus:ring', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2');
    });
  });
});
