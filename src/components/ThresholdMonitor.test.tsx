import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThresholdMonitor from './ThresholdMonitor';

// Test mocks minimalistes (pas de dépendances externes)

describe('ThresholdMonitor', () => {
  describe('Composant ThresholdMonitor - Activité Services uniquement', () => {
    it('affiche correctement la surveillance des seuils pour activité services', () => {
      const caStatus = {
        sales: {
          amount: 0,
          threshold: 188700,
          percent: 0,
          isOverLimit: false,
        },
        services: {
          amount: 45000,
          threshold: 77700,
          percent: 57.9,
          isOverLimit: false,
        },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: {
          amount: 0,
          threshold: 91900,
          percent: 0,
          isOverLimit: false,
          limit: 101000,
        },
        services: {
          amount: 45000,
          threshold: 36800,
          percent: 122.3,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      // Vérification du titre principal
      expect(screen.getByText('Surveillance des Seuils')).toBeInTheDocument();
      expect(screen.getByText('Plafonds annuels et franchises de TVA')).toBeInTheDocument();

      // Vérification section CA
      expect(screen.getByText("Chiffre d'Affaires")).toBeInTheDocument();
      expect(screen.getByText('Prestations de Services')).toBeInTheDocument();
      expect(screen.getAllByText('45 000 €')[0]).toBeInTheDocument();
      expect(screen.getByText('/ 77 700 €')).toBeInTheDocument();

      // Pas d'achat/revente pour services uniquement
      expect(screen.queryByText('Achat / Revente')).not.toBeInTheDocument();

      // Vérification section TVA
      expect(screen.getByText('Franchise de TVA')).toBeInTheDocument();
      expect(screen.getByText('Seuil Services')).toBeInTheDocument();
      expect(screen.getAllByText('45 000 €')[0]).toBeInTheDocument(); // Premier "45 000 €" dans la section TVA
      expect(screen.getByText('/ 36 800 €')).toBeInTheDocument();
    });

    it('affiche le badge "Ok" quand sous le seuil (< 80%)', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 30000, threshold: 77700, percent: 38.6, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 25000,
          threshold: 36800,
          percent: 67.9,
          isOverLimit: false,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      const okBadges = screen.getAllByText('Ok');
      expect(okBadges).toHaveLength(2); // Un pour CA services, un pour TVA services
    });

    it('affiche le badge "Approche" quand entre 80% et 100%', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 70000, threshold: 77700, percent: 90.1, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 32000,
          threshold: 36800,
          percent: 87.0,
          isOverLimit: false,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      const approacheBadges = screen.getAllByText('Approche');
      expect(approacheBadges).toHaveLength(2);
    });

    it('affiche le badge "Seuil atteint" quand dépassement du threshold sans dépasser limit', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 77700, threshold: 77700, percent: 100, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 37000,
          threshold: 36800,
          percent: 100.5,
          isOverLimit: false,
          isOverThreshold: true,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      const seuilBadges = screen.getAllByText('Seuil atteint');
      expect(seuilBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('affiche le badge "Dépassement" quand dépassement de la limite', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 90000, threshold: 77700, percent: 115.8, isOverLimit: true },
        isOverLimit: true,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 42000,
          threshold: 36800,
          percent: 114.1,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      const depassementBadges = screen.getAllByText('Dépassement');
      expect(depassementBadges).toHaveLength(2);
    });

    it('affiche le message "Il reste X €" quand sous le seuil', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 50000, threshold: 77700, percent: 64.4, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 30000,
          threshold: 36800,
          percent: 81.5,
          isOverLimit: false,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      expect(screen.getByText('Il reste 27 700 €')).toBeInTheDocument(); // CA: 77700 - 50000
      expect(screen.getByText('Il reste 6 800 €')).toBeInTheDocument(); // TVA: 36800 - 30000
    });

    it('affiche "Attention : Seuil dépassé" quand au-delà du threshold', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 80000, threshold: 77700, percent: 103.0, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 40000,
          threshold: 36800,
          percent: 108.7,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      const attentionMessages = screen.getAllByText('Attention : Seuil dépassé');
      expect(attentionMessages).toHaveLength(2);
    });
  });

  describe('Composant ThresholdMonitor - Activité Vente/Achat uniquement', () => {
    it('affiche correctement la surveillance pour activité ventes', () => {
      const caStatus = {
        sales: {
          amount: 120000,
          threshold: 188700,
          percent: 63.6,
          isOverLimit: false,
        },
        services: {
          amount: 0,
          threshold: 77700,
          percent: 0,
          isOverLimit: false,
        },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: {
          amount: 120000,
          threshold: 91900,
          percent: 130.6,
          isOverLimit: true,
          limit: 101000,
        },
        services: {
          amount: 0,
          threshold: 36800,
          percent: 0,
          isOverLimit: false,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(<ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="sales" />);

      // Vérification section CA
      expect(screen.getByText('Achat / Revente')).toBeInTheDocument();
      expect(screen.getAllByText('120 000 €')[0]).toBeInTheDocument();
      expect(screen.getByText('/ 188 700 €')).toBeInTheDocument();

      // Pas de prestations de services pour ventes uniquement
      expect(screen.queryByText('Prestations de Services')).not.toBeInTheDocument();

      // Vérification section TVA
      expect(screen.getByText('Seuil Ventes')).toBeInTheDocument();
      expect(screen.getAllByText('120 000 €')[0]).toBeInTheDocument();
      expect(screen.getByText('/ 91 900 €')).toBeInTheDocument();
    });

    it('affiche uniquement les seuils ventes (pas de services)', () => {
      const caStatus = {
        sales: { amount: 50000, threshold: 188700, percent: 26.5, isOverLimit: false },
        services: { amount: 0, threshold: 77700, percent: 0, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: {
          amount: 50000,
          threshold: 91900,
          percent: 54.4,
          isOverLimit: false,
          limit: 101000,
        },
        services: { amount: 0, threshold: 36800, percent: 0, isOverLimit: false, limit: 39100 },
        shouldPayVat: false,
      };

      render(<ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="sales" />);

      // Vérifier qu'il n'y a qu'un seul item dans chaque section (ventes seulement)
      // On s'attend à trouver un seul ThresholdItem par section
      expect(screen.queryByText('Prestations de Services')).not.toBeInTheDocument();
      expect(screen.getByText('Achat / Revente')).toBeInTheDocument();
      expect(screen.queryByText('Seuil Services')).not.toBeInTheDocument();
      expect(screen.getByText('Seuil Ventes')).toBeInTheDocument();
    });
  });

  describe('Composant ThresholdMonitor - Activité Mixte', () => {
    it('affiche tous les seuils pour activité mixte', () => {
      const caStatus = {
        sales: {
          amount: 80000,
          threshold: 188700,
          percent: 42.4,
          isOverLimit: false,
        },
        services: {
          amount: 60000,
          threshold: 77700,
          percent: 77.2,
          isOverLimit: false,
        },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: {
          amount: 80000,
          threshold: 91900,
          percent: 87.1,
          isOverLimit: false,
          limit: 101000,
        },
        services: {
          amount: 60000,
          threshold: 36800,
          percent: 163.0,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(<ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="mixed" />);

      // Vérification qu'on a bien toutes les sections
      expect(screen.getByText('Prestations de Services')).toBeInTheDocument();
      expect(screen.getByText('Achat / Revente')).toBeInTheDocument();
      expect(screen.getByText('Seuil Services')).toBeInTheDocument();
      expect(screen.getByText('Seuil Ventes')).toBeInTheDocument();

      // CA Services
      expect(screen.getAllByText('60 000 €')[0]).toBeInTheDocument();
      expect(screen.getByText('/ 77 700 €')).toBeInTheDocument();

      // CA Ventes
      expect(screen.getAllByText('80 000 €')[0]).toBeInTheDocument();
      expect(screen.getByText('/ 188 700 €')).toBeInTheDocument();

      // TVA Services
      expect(screen.getAllByText('60 000 €')[0]).toBeInTheDocument();
      expect(screen.getByText('/ 36 800 €')).toBeInTheDocument();

      // TVA Ventes
      expect(screen.getAllByText('80 000 €')[0]).toBeInTheDocument();
      expect(screen.getByText('/ 91 900 €')).toBeInTheDocument();
    });

    it("affiche le message d'information pour activité mixte", () => {
      const caStatus = {
        sales: { amount: 100000, threshold: 188700, percent: 53.0, isOverLimit: false },
        services: { amount: 50000, threshold: 77700, percent: 64.4, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: {
          amount: 100000,
          threshold: 91900,
          percent: 108.8,
          isOverLimit: true,
          limit: 101000,
        },
        services: {
          amount: 50000,
          threshold: 36800,
          percent: 135.9,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(<ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="mixed" />);

      expect(
        screen.getByText(/En activité mixte, votre CA global ne doit pas dépasser 188 700 €/)
      ).toBeInTheDocument();
      expect(screen.getByText(/la partie services est limitée à 77 700 €/)).toBeInTheDocument();
    });

    it("n'affiche pas le message d'information pour activité non mixte", () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 50000, threshold: 77700, percent: 64.4, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 50000,
          threshold: 36800,
          percent: 135.9,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      expect(screen.queryByText(/En activité mixte/)).not.toBeInTheDocument();
    });
  });

  describe('Calculs et Affichage des barres de progression', () => {
    it('calcule correctement le pourcentage (plafonné à 100%)', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 100000, threshold: 77700, percent: 128.7, isOverLimit: true },
        isOverLimit: true,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 50000,
          threshold: 36800,
          percent: 135.9,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      const { container } = render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      // Vérifier que les barres de progression ont un width de style
      const progressBars = container.querySelectorAll('.h-3 > div');
      expect(progressBars.length).toBeGreaterThan(0);

      // Les barres doivent avoir une largeur <= 100%
      progressBars.forEach((bar) => {
        const width = bar.getAttribute('style');
        expect(width).toBeTruthy();
        // Extraire le % et vérifier qu'il est <= 100
        const match = width?.match(/width:\s*(\d+(\.\d+)?)%/);
        if (match) {
          const widthValue = parseFloat(match[1]);
          expect(widthValue).toBeLessThanOrEqual(100);
        }
      });
    });

    it('affiche la ligne de seuil de tolérance pour la TVA (limit > threshold)', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 37500, threshold: 77700, percent: 48.3, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 37500,
          threshold: 36800,
          percent: 101.9,
          isOverLimit: false,
          isOverThreshold: true,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      const { container } = render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      // Vérifier la présence de la ligne de seuil (border-r-2 border-dashed)
      const thresholdLine = container.querySelector('.border-dashed.border-destructive\\/50');
      expect(thresholdLine).toBeInTheDocument();

      // Vérifier que le title contient le montant de la limite
      expect(thresholdLine?.getAttribute('title')).toContain('39100');
    });
  });

  describe('Formatage des montants', () => {
    it('formate correctement les montants avec séparateurs français', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 123456.78, threshold: 77700, percent: 158.9, isOverLimit: true },
        isOverLimit: true,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 123456.78,
          threshold: 36800,
          percent: 335.5,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      // En français: 123 456,78 mais ici on a des nombres entiers affichés comme "123 457" (arrondi)
      // Vérifier le format avec espace comme séparateur de milliers
      expect(screen.getAllByText(/123\s?456/)).toHaveLength(2); // Peut y avoir un espace ou pas selon le DOM
    });

    it('affiche les petits montants sans séparateurs', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 999, threshold: 77700, percent: 1.3, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: { amount: 500, threshold: 36800, percent: 1.4, isOverLimit: false, limit: 39100 },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      expect(screen.getByText('999 €')).toBeInTheDocument();
      expect(screen.getByText('500 €')).toBeInTheDocument();
    });
  });

  describe('Statuts et badges visuels', () => {
    it('affiche les couleurs appropriées pour les différents statuts', () => {
      const caStatus = {
        sales: { amount: 150000, threshold: 188700, percent: 79.5, isOverLimit: false }, // Ok (< 80%)
        services: { amount: 70000, threshold: 77700, percent: 90.1, isOverLimit: false }, // Approche (> 80%)
        isOverLimit: false,
      };

      const vatStatus = {
        sales: {
          amount: 95000,
          threshold: 91900,
          percent: 103.4,
          isOverLimit: false,
          isOverThreshold: true,
          limit: 101000,
        }, // Seuil atteint
        services: {
          amount: 42000,
          threshold: 36800,
          percent: 114.1,
          isOverLimit: true,
          limit: 39100,
        }, // Dépassement
        shouldPayVat: true,
      };

      render(<ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="mixed" />);

      // Vérifier les 4 types de badges
      expect(screen.getByText('Ok')).toBeInTheDocument(); // CA ventes
      expect(screen.getByText('Approche')).toBeInTheDocument(); // CA services
      expect(screen.getByText('Seuil atteint')).toBeInTheDocument(); // TVA ventes
      expect(screen.getByText('Dépassement')).toBeInTheDocument(); // TVA services
    });
  });

  describe('Cas limites et edge cases', () => {
    it('gère correctement un montant à 0', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 0, threshold: 77700, percent: 0, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: { amount: 0, threshold: 36800, percent: 0, isOverLimit: false, limit: 39100 },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      expect(screen.getAllByText('0 €')).toHaveLength(4); // 2 pour CA, 2 pour TVA (début de barre)
      expect(screen.getByText('Il reste 77 700 €')).toBeInTheDocument();
      expect(screen.getByText('Il reste 36 800 €')).toBeInTheDocument();
    });

    it('gère correctement un montant exactement égal au seuil', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 77700, threshold: 77700, percent: 100, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 36800,
          threshold: 36800,
          percent: 100,
          isOverLimit: false,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      // À 100%, on devrait voir "Seuil atteint" (ou "Approche" si > 80%)
      expect(screen.getAllByText('77 700 €').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('36 800 €').length).toBeGreaterThanOrEqual(1);

      // Quand amount = threshold exactement, le badge devrait être "Approche" (>80%)
      // car isOverThreshold nécessite current > threshold (pas >=)
      const approcheBadges = screen.queryAllByText('Approche');
      expect(approcheBadges.length).toBeGreaterThanOrEqual(1);

      // Vérifier qu'il reste 0 €
      expect(screen.getAllByText('Il reste 0 €').length).toBeGreaterThanOrEqual(1);
    });

    it('gère correctement un montant largement supérieur au seuil', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 250000, threshold: 77700, percent: 321.7, isOverLimit: true },
        isOverLimit: true,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 250000,
          threshold: 36800,
          percent: 679.3,
          isOverLimit: true,
          limit: 39100,
        },
        shouldPayVat: true,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      expect(screen.getAllByText('250 000 €')).toHaveLength(2);
      expect(screen.getAllByText('Dépassement')).toHaveLength(2);
      expect(screen.getAllByText('Attention : Seuil dépassé')).toHaveLength(2);
    });

    it('gère un montant juste en dessous du seuil de tolérance (entre threshold et limit)', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 50000, threshold: 77700, percent: 64.4, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 38000, // Entre 36800 (threshold) et 39100 (limit)
          threshold: 36800,
          percent: 103.3,
          isOverLimit: false,
          isOverThreshold: true,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      expect(screen.getAllByText('38 000 €').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('/ 36 800 €')).toBeInTheDocument();

      // Devrait afficher "Seuil atteint" mais pas "Dépassement"
      expect(screen.getByText('Seuil atteint')).toBeInTheDocument();
      expect(screen.queryByText('Dépassement')).not.toBeInTheDocument();
    });
  });

  describe('Intégration et cohérence visuelle', () => {
    it('utilise les bons composants UI (Card, Badge)', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 50000, threshold: 77700, percent: 64.4, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 30000,
          threshold: 36800,
          percent: 81.5,
          isOverLimit: false,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      const { container } = render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      // Vérifier la structure générale (pas de test trop spécifique au markup)
      expect(container.querySelector('.space-y-10')).toBeInTheDocument();
      expect(container.querySelectorAll('section').length).toBe(2); // CA + TVA
    });

    it('affiche les icônes appropriées (Euro, AlertTriangle)', () => {
      const caStatus = {
        sales: { amount: 0, threshold: 188700, percent: 0, isOverLimit: false },
        services: { amount: 50000, threshold: 77700, percent: 64.4, isOverLimit: false },
        isOverLimit: false,
      };

      const vatStatus = {
        sales: { amount: 0, threshold: 91900, percent: 0, isOverLimit: false, limit: 101000 },
        services: {
          amount: 30000,
          threshold: 36800,
          percent: 81.5,
          isOverLimit: false,
          limit: 39100,
        },
        shouldPayVat: false,
      };

      const { container } = render(
        <ThresholdMonitor caStatus={caStatus} vatStatus={vatStatus} activityType="services" />
      );

      // Vérifier qu'il y a des icônes SVG
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
