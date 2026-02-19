/**
 * testUtils.tsx
 * 🧪 Utilitaires de test réutilisables
 * Wrappers et helpers pour React Testing Library
 *
 * Pour les mocks et les constantes, voir testConstants.ts
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

/**
 * Wrapper avec BrowserRouter simple
 * Utilisé pour les tests qui n'ont pas de Routes enfants
 */
export const BrowserRouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

/**
 * Wrapper avec Routes et Route wildcard
 * Utilisé pour les tests avec des composants qui ont Routes enfants
 * Résout le warning: "parent route path has no trailing "*""
 */
export const RoutesWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/*" element={<>{children}</>} />
    </Routes>
  </BrowserRouter>
);

/**
 * Wrapper pour les composants qui utilisent Recharts
 * Ajoute des dimensions CSS appropriées au conteneur
 */
export const ChartsWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: '800px',
      height: '600px',
      display: 'flex',
      position: 'relative',
      minWidth: '800px',
      minHeight: '600px',
    }}
    className="resize-observer-wrapper"
  >
    {children}
  </div>
);

/**
 * Wrapper combiné pour Routes + Charts
 * Utilisé pour les composants avec Routes enfants et Recharts
 */
export const RoutesChartsWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/*"
        element={
          <div
            style={{
              width: '800px',
              height: '600px',
              display: 'flex',
              position: 'relative',
              minWidth: '800px',
              minHeight: '600px',
            }}
            className="resize-observer-wrapper"
          >
            {children}
          </div>
        }
      />
    </Routes>
  </BrowserRouter>
);

/**
 * Fonction de rendu personnalisée avec wrappers par défaut
 * Utilise BrowserRouter par défaut
 */
// eslint-disable-next-line react-refresh/only-export-components
export const renderWithRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { useRoutes?: boolean; withCharts?: boolean }
) => {
  const { useRoutes = false, withCharts = false, ...renderOptions } = options || {};
  let Wrapper: React.ComponentType<{ children: React.ReactNode }>;

  if (withCharts && useRoutes) {
    Wrapper = RoutesChartsWrapper;
  } else if (withCharts) {
    Wrapper = ChartsWrapper;
  } else if (useRoutes) {
    Wrapper = RoutesWrapper;
  } else {
    Wrapper = BrowserRouterWrapper;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Réinitialiser les données de test locales
 * Nettoie le localStorage et autres données persistantes
 */
// eslint-disable-next-line react-refresh/only-export-components
export const resetTestData = () => {
  localStorage.clear();
};
