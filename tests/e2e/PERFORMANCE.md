# Performance Monitoring

## Metrics Tracked

### 1. Page Load Time

- **Target**: < 3 seconds
- **Measured**: Time from navigation start to network idle
- **Tool**: Playwright navigation timing

### 2. Core Web Vitals

#### Largest Contentful Paint (LCP)

- **Target**: < 2.5 seconds
- **Measures**: Time until largest visible content is painted
- **Impact**: User perception of page load

#### First Input Delay (FID)

- **Target**: < 100ms
- **Measures**: Responsiveness to user interactions
- **Impact**: Interactive feel of page

#### Cumulative Layout Shift (CLS)

- **Target**: < 0.1
- **Measures**: Visual stability during load
- **Impact**: User experience quality

### 3. Memory Management

- **Leak Detection**: JavaScript heap size after interactions
- **Target**: < 50% increase
- **Method**: page.metrics() API

### 4. Asset Optimization

#### Compression

- **Type**: Gzip compression for text assets
- **Target**: All CSS/JS files compressed
- **Verification**: content-encoding header check

#### Caching

- **Strategy**: Browser caching for static assets
- **Validation**: HTTP caches hit on reload

#### Image Optimization

- **Responsive**: srcset and sizes attributes
- **Lazy Loading**: loading="lazy" attribute
- **Formats**: WebP support

## Configuration

### Vite Build Configuration

```javascript
// vite.config.ts
export default {
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-pdf': ['jspdf', 'pdf-lib'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['tailwindcss'],
        },
      },
    },
  },
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 10000,
  retries: 0,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
});
```

## Running Tests

```bash
# Performance suite
npm run test:e2e -- performance.spec.ts

# With detailed metrics
npm run test:e2e -- performance.spec.ts --reporter=verbose

# Generate HTML report
npm run test:e2e -- --reporter=html
```

## Continuous Monitoring

GitHub Actions workflow monitors on each PR:

- `.github/workflows/performance-monitoring.yml`
- Bundle analysis
- Performance regression detection
- Automatic PR comments with metrics

## Best Practices

1. **Code Splitting**
   - Use dynamic imports for route-based splitting
   - Separate vendor bundles
   - Lazy load heavy dependencies

2. **Image Optimization**
   - Use WebP with fallbacks
   - Implement responsive images
   - Lazy load below-the-fold images

3. **Caching Strategy**
   - Long cache TTL for hashed assets
   - Service Worker for offline support
   - Efficient cache invalidation

4. **Monitoring**
   - Track Core Web Vitals in production
   - Use Vercel Analytics
   - Monitor error rates

## Tools

- **Playwright**: E2E performance testing
- **Vite Build Analyzer**: Bundle size analysis
- **Vercel Analytics**: Production monitoring
- **Lighthouse**: Additional audits (manual)
