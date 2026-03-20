---
description: Core Web Vitals, lazy loading, caching, bundle optimization, and server-side rendering strategy.
---

# Performance

## Core Web Vitals

| Metric | Target | What it measures |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | How fast main content loads |
| **INP** (Interaction to Next Paint) | < 200ms | How fast interactions respond |
| **CLS** (Cumulative Layout Shift) | < 0.1 | How stable the layout is |

## Server Response Time

- Target: < 200ms for HTML responses
- Use connection pooling for database
- Cache expensive queries
- Compress responses (gzip/brotli)

## Asset Optimization

### Images
- Use WebP format (30% smaller than JPEG)
- Provide srcset for responsive images
- Lazy load below-the-fold images: `loading="lazy"`
- Set explicit width/height to prevent CLS

### CSS
- Inline critical CSS for above-the-fold content
- Load non-critical CSS with `media="print" onload="this.media='all'"`
- Purge unused CSS (Tailwind does this automatically)

### JavaScript
- Minimize bundle size
- Code-split by route (dynamic imports)
- Defer non-critical scripts: `<script defer>`
- Tree-shake unused exports

## Caching Strategy

### Static Assets
```
Cache-Control: public, max-age=31536000, immutable
```
Use content hashes in filenames: `app.abc123.css`

### HTML Pages
```
Cache-Control: no-cache
```
Always revalidate (server decides freshness).

### API Responses
```
Cache-Control: private, max-age=60
```
Cache per-user for 1 minute. Invalidate on mutations.

## Lazy Loading

### Images
```html
<img src="photo.webp" loading="lazy" width="400" height="300" alt="...">
```

### Components (SPA/Hybrid)
```javascript
// Load heavy components only when needed
const Chart = lazy(() => import('./Chart'));
```

### Routes
Framework handles this — Next.js, SvelteKit, Nuxt all code-split by route automatically.

## Database Performance

- Index all foreign keys and frequently filtered columns
- Use `EXPLAIN ANALYZE` to check query plans
- Avoid N+1: use JOINs or batch loading
- Paginate large result sets (never `SELECT * FROM large_table`)
- Connection pool: 10-20 connections for typical apps

## Monitoring

After deployment, monitor:
- Response times (P50, P95, P99)
- Error rates
- Database query times
- Core Web Vitals (via Lighthouse or RUM)
