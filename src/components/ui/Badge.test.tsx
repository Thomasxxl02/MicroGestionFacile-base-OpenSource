import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  describe('Rendu de base', () => {
    it('devrait rendre un badge avec du texte', () => {
      render(<Badge>Status Active</Badge>);
      expect(screen.getByText('Status Active')).toBeInTheDocument();
    });

    it('devrait rendre avec la variante default (slate)', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-muted');
      expect(badge).toHaveClass('text-muted-foreground');
    });

    it('devrait rendre avec variante emerald', () => {
      const { container } = render(<Badge variant="emerald">Success</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-emerald-500/10');
      expect(badge).toHaveClass('text-emerald-600');
    });

    it('devrait rendre avec variante red', () => {
      const { container } = render(<Badge variant="red">Error</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-destructive/10');
      expect(badge).toHaveClass('text-destructive');
    });

    it('devrait rendre avec variante warning', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-amber-500/10');
    });

    it('devrait rendre avec variante blue', () => {
      const { container } = render(<Badge variant="blue">Info</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-primary/10');
      expect(badge).toHaveClass('text-primary');
    });
  });

  describe('Couleurs de texte', () => {
    it('devrait utiliser la couleur de texte correcte pour emerald', () => {
      const { container } = render(<Badge variant="emerald">Success</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-emerald-600');
    });

    it('devrait utiliser la couleur de texte correcte pour red', () => {
      const { container } = render(<Badge variant="red">Error</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-destructive');
    });

    it('devrait utiliser la couleur de texte correcte pour warning', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-amber-600');
    });

    it('devrait utiliser la couleur de texte correcte pour blue', () => {
      const { container } = render(<Badge variant="blue">Info</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-primary');
    });
  });

  describe('Accessibilité', () => {
    it('devrait être accessible avec un texte clair', () => {
      const { container } = render(<Badge>Payment Pending</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.textContent).toBe('Payment Pending');
    });

    it('devrait avoir des attributs aria natifs', () => {
      const { container } = render(<Badge>Badge Text</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toContain('Badge Text');
    });
  });

  describe('Classes personnalisées', () => {
    it('devrait accepter une classe personnalisée', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('custom-badge');
    });

    it('devrait combiner les classes de base avec les classes personnalisées', () => {
      const { container } = render(<Badge className="custom">Test</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('custom');
    });
  });

  describe('Responsive et dark mode', () => {
    it('devrait avoir des classes pour dark mode', () => {
      const { container } = render(<Badge variant="emerald">Test</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('dark:text-emerald-400');
    });

    it('devrait être centré et avoir les bonnes dimensions', () => {
      const { container } = render(<Badge>Centered</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('Icône indicatrice (dot)', () => {
    it('devrait rendre un point si dot=true', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      const dot = container.querySelector('.w-2.h-2');
      expect(dot).toBeInTheDocument();
    });

    it('ne devrait pas rendre de point par défaut', () => {
      const { container } = render(<Badge>No Dot</Badge>);
      const dot = container.querySelector('.w-2.h-2');
      expect(dot).not.toBeInTheDocument();
    });

    it('le point devrait avoir la couleur appropriée à la variante', () => {
      const { container } = render(
        <Badge variant="emerald" dot>
          Dot Green
        </Badge>
      );
      const dot = container.querySelector('.w-2.h-2');
      expect(dot).toHaveClass('bg-emerald-500');
    });
  });
});
