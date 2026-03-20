## Web Conventions

These are universal web development conventions. They apply to every stack.

### Architecture: Layered Separation

Every web app has these layers. The names differ per stack but the boundaries are the same:

1. **Route handlers** — receive HTTP requests, validate input, call services, return responses. No business logic.
2. **Services** — contain all business logic. No HTTP concerns. No direct DB access.
3. **Data access** — repositories or ORM models. Parameterized queries only. Error wrapping with context.
4. **Components** — reusable UI building blocks. Props in, markup out. No side effects.
5. **Pages** — compose components into full views. Fetch data via services/loaders.

**Rule**: Never skip layers. A handler must not query the database directly. A component must not call an API.

### Routing

- RESTful resource naming: `/{plural}` for list, `/{plural}/{id}` for detail
- Nested routes for relationships: `/{parent}/{parentId}/{children}`
- Auth-protected routes use middleware/guards, not inline checks
- All routes registered in one place (router file, pages directory, or route config)

### Authentication

- Short-lived access tokens (15-30 min) + refresh mechanism
- Tokens in HttpOnly cookies (server-rendered) or secure storage (SPA)
- Never store secrets in client-side code or localStorage
- CSRF protection on all state-changing endpoints
- Magic link / OAuth as passwordless alternatives

### Data Access

- Always parameterized queries — no string concatenation for SQL
- Always wrap errors with context: the caller should know what operation failed
- Always handle connection failures gracefully
- Migrations are forward-only in production; always include rollback
- Index frequently queried columns

### Error Handling

- Wrap errors with context at every layer boundary
- Never swallow errors silently
- User-facing errors: friendly message, no stack traces
- Developer errors: full context, stack trace in logs
- HTTP: 4xx for client errors, 5xx for server errors — never 200 with error body

### Forms & Validation

- Validate on both client and server — server is the source of truth
- Show per-field errors inline, not just a banner
- Preserve form state on validation failure
- Progressive enhancement: forms should work without JavaScript

### Security

- CSP headers on all responses
- Input sanitization at system boundaries
- No `dangerouslySetInnerHTML` / `templ.Raw()` / `{@html}` on user input
- Rate limiting on auth endpoints
- CORS configured explicitly, never `*` in production

### Responsive Design

- Mobile-first: base styles for mobile, breakpoints for larger screens
- Test at 3 viewports: mobile (375px), tablet (768px), desktop (1440px)
- No horizontal scroll at any viewport
- Touch targets minimum 44x44px

### Performance

- Lazy load below-the-fold content
- Optimize images (WebP, srcset)
- Minimize JavaScript bundle size
- Cache static assets with content hashes
- Server-render critical content for fast first paint

### Testing Strategy

- Unit tests for services/business logic
- Integration tests for API routes
- E2E tests for critical user flows (auth, checkout)
- Visual regression tests for key pages

### Stack-Specific Conventions

Stack-specific conventions (Go handler patterns, Next.js server actions, SvelteKit load functions, etc.) are served by the **web-patterns MCP**. Always read `stack://{stackId}/*` patterns before implementing.

The universal conventions above always apply. Stack conventions extend them, never contradict them.
