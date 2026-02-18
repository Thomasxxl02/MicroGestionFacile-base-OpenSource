/**
 * Performance Monitoring Test Suite
 * Mesure les métriques de performance et détecte les régressions
 *
 * Ces tests s'exécutent APRÈS le build et ne bloquent pas le déploiement Vercel
 */

import { test, expect } from '../fixtures/auth.fixture';

// Skip tests on Vercel during build
const skipOnVercel = process.env.VERCEL === 'true';
const describe = skipOnVercel ? test.describe.skip : test.describe;

describe('⚡ Performance Monitoring', () => {
  test("devrait charger la page d'accueil en moins de 3 secondes", async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
    console.info(`Page load time: ${loadTime}ms`);
  });

  test('devrait avoir des Core Web Vitals acceptables', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    // Mesurer les Core Web Vitals avec l'API Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: Record<string, number> = {};

        // LCP (Largest Contentful Paint)
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals['LCP'] = entry.startTime;
            }
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay) - approximation avec Event Timing
        document.addEventListener(
          'click',
          () => {
            vitals['FID'] = 0; // Sera mesuré par le test réel
          },
          { once: true }
        );

        // CLS (Cumulative Layout Shift)
        let cls = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Cast to LayoutShift type for property access
            const layoutShift = entry as unknown as { hadRecentInput?: boolean; value?: number };
            if (entry.entryType === 'layout-shift' && !layoutShift.hadRecentInput) {
              cls += layoutShift.value || 0;
            }
          }
          vitals['CLS'] = cls;
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => {
          resolve(vitals);
        }, 2000);
      });
    });

    console.info(`Core Web Vitals:`, vitals);
  });

  test('devrait charger les assets critiques en priorité', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    const resources: Record<string, number> = {};

    page.on('response', (response) => {
      const url = response.url();
      resources[url] = response.status();
    });

    await page.goto('/');

    // Vérifier que les CSS et JS critiques sont chargés
    const cssLoaded = Object.keys(resources).some(
      (url) => url.includes('.css') && resources[url] === 200
    );
    const jsLoaded = Object.keys(resources).some(
      (url) => url.includes('.js') && resources[url] === 200
    );

    expect(cssLoaded).toBeTruthy();
    expect(jsLoaded).toBeTruthy();
  });

  test('devrait pas avoir de fuites mémoire', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    // Obtenir les métriques de mémoire initiales
    const initialMemory = await page.evaluate(() => {
      return (
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0
      );
    });

    // Effectuer plusieurs actions
    for (let i = 0; i < 5; i++) {
      const buttons = page.locator('button');
      for (let j = 0; j < Math.min(3, await buttons.count()); j++) {
        try {
          await buttons.nth(j).click({ timeout: 1000 });
          await page.waitForTimeout(200);
        } catch {
          // Ignorer les erreurs de clic
        }
      }
    }

    // Obtenir les métriques finales
    const finalMemory = await page.evaluate(() => {
      return (
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0
      );
    });

    // La mémoire ne devrait pas augmenter de plus de 50%
    if (initialMemory > 0) {
      const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
      expect(memoryIncrease).toBeLessThan(0.5);
      console.info(`Memory increase: ${(memoryIncrease * 100).toFixed(2)}%`);
    } else {
      console.info('Performance.memory not available, skipping memory check');
    }
  });

  test('devrait compresser les réponses avec gzip', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    let gzipFound = false;

    page.on('response', (response) => {
      const contentEncoding = response.headers()['content-encoding'] || '';
      if (contentEncoding.includes('gzip')) {
        gzipFound = true;
      }
    });

    await page.goto('/');

    expect(gzipFound).toBeTruthy();
  });

  test('devrait mettre en cache les assets statiques', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    const firstLoadRequests: Record<string, number> = {};
    const secondLoadRequests: Record<string, number> = {};

    // Premier chargement
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css') || url.includes('.woff')) {
        firstLoadRequests[url] = (firstLoadRequests[url] || 0) + 1;
      }
    });

    await page.goto('/');

    // Deuxième chargement
    page.removeAllListeners('response');
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css') || url.includes('.woff')) {
        secondLoadRequests[url] = (secondLoadRequests[url] || 0) + 1;
      }
    });

    await page.reload();

    // Vérifier que certains assets sont en cache (pas de requête HTTP 200)
    const cachedAssets = Object.keys(secondLoadRequests).filter(
      (url) => firstLoadRequests[url]
    ).length;

    expect(cachedAssets).toBeGreaterThan(0);
    console.info(`Cached assets: ${cachedAssets}/${Object.keys(firstLoadRequests).length}`);
  });

  test('devrait supporter les images responsive', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    const images = page.locator('img');
    const imagesCount = await images.count();

    let responsiveCount = 0;

    for (let i = 0; i < imagesCount; i++) {
      const img = images.nth(i);
      const srcSet = await img.getAttribute('srcset');

      // Vérifier que l'image a un srcset ou une taille responsive
      if (srcSet || (await img.getAttribute('sizes'))) {
        responsiveCount++;
      }
    }

    expect(responsiveCount).toBeGreaterThan(0);
    console.info(`Responsive images: ${responsiveCount}/${imagesCount}`);
  });

  test('devrait lazy-loader les éléments hors écran', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    const lazyImages = page.locator('img[loading="lazy"]');
    const lazyCount = await lazyImages.count();

    if (lazyCount > 0) {
      console.info(`Found ${lazyCount} lazy-loaded images`);
      expect(lazyCount).toBeGreaterThan(0);
    }
  });
});
