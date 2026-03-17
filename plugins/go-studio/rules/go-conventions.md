## Go Stack Conventions

These conventions are derived from production apps (hrvst, onlead, ariel, donostia.ai). Follow them exactly.

### Package Structure

- `internal/` for all private packages — never expose internals as a public API
- `cmd/server/main.go` is the only binary entry point
- One file per feature domain in handlers/, services/, repositories/
- Shared types go in `internal/models/`

### Handler Pattern

```go
type Handler struct {
    service *services.AuthService
    cfg     *config.Config
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
    // validate input
    // call service
    // render templ component or redirect
}
```

- Always take `(w http.ResponseWriter, r *http.Request)`
- Use chi subrouters: `r.Route("/auth", func(r chi.Router) { ... })`
- HTMX requests: check `r.Header.Get("HX-Request") == "true"` for partial renders

### Service Pattern

```go
type AuthService struct {
    repo *repositories.AuthRepository
    cfg  *config.Config
}

func NewAuthService(repo *repositories.AuthRepository, cfg *config.Config) *AuthService {
    return &AuthService{repo: repo, cfg: cfg}
}
```

- Services contain all business logic
- No direct DB access in handlers
- No HTTP concerns in services

### Repository Pattern

```go
type AuthRepository struct {
    db *pgxpool.Pool
}

func (r *AuthRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
    var u models.User
    err := sqlx.GetContext(ctx, r.db, &u, "SELECT * FROM users WHERE email=$1", email)
    if err != nil {
        return nil, fmt.Errorf("find user by email: %w", err)
    }
    return &u, nil
}
```

- Always parameterized queries — no string concatenation
- Always wrap errors with `fmt.Errorf("context: %w", err)`
- Always `defer rows.Close()` after `Query`
- Use `pgx/v5` pool directly; `sqlx` only for scan helpers

### Error Handling

- Wrap with context: `fmt.Errorf("create user: %w", err)`
- Never swallow errors
- HTTP errors: `http.Error(w, "internal error", http.StatusInternalServerError)` or render error template

### Migrations (Goose)

```sql
-- +goose Up
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE users;
```

- Embed via `//go:embed migrations/*.sql`
- Always include Down migration
- Never modify existing migrations — add new ones

### Templ Components

```go
templ UserCard(user models.User) {
    <div class="card">
        <p>{ user.Email }</p>
    </div>
}
```

- Components in `internal/ui/components/`
- Pages in `internal/ui/pages/`
- Layouts in `internal/ui/layouts/`
- Always run `templ generate` after editing `.templ` files
- Never use `templ.Raw()` on user input — XSS risk

### HTMX Patterns

- Use `hx-boost` on `<body>` for page-level transitions
- Prefer `hx-target` + `hx-swap` over full page reloads
- For forms: `hx-post`, `hx-swap="outerHTML"` to replace form with success/error state
- OOB swaps for updating multiple regions: `hx-swap-oob="true"`
- Loading states: `hx-indicator` with a spinner element

### Tailwind v4

- Config in `assets/app.css`:
  ```css
  @import "tailwindcss";
  @import "templui/styles";
  ```
- No `tailwind.config.js` in v4
- Use templUI utility classes where available

### Auth (JWT)

- Short-lived access token (15 min) + long-lived refresh token (7 days)
- Store tokens in HttpOnly cookies, not localStorage
- Magic link: time-limited token in DB, one-use
- OAuth: PKCE flow with state parameter
- TOTP: `pquerna/otp` library, QR code via `skip2/go-qrcode`

### SSE Streaming

```go
func (h *Handler) Events(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")

    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "streaming not supported", http.StatusInternalServerError)
        return
    }

    // subscribe to broker, send events, handle disconnect via r.Context().Done()
}
```

### Config

- All config from environment variables
- Single `config.Config` struct loaded at startup
- Never hardcode secrets or URLs

### Context

- Always propagate `context.Context` as first parameter
- Check `ctx.Err()` in long-running operations
- Pass request context to all DB calls: `r.Context()`
