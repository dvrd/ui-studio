---
description: Go+Templ+HTMX project structure — directories, entry point, dependency wiring, and file naming.
---

# Go+Templ+HTMX Project Structure

```
{appName}/
├── cmd/server/
│   └── main.go                 ← entry point, wires everything
├── internal/
│   ├── config/config.go        ← env-based config struct
│   ├── handlers/               ← HTTP handlers (one file per feature)
│   ├── services/               ← business logic (one file per feature)
│   ├── repositories/           ← DB queries (one file per feature)
│   ├── middleware/              ← auth, logging, rate limiting
│   ├── models/                 ← shared data types
│   ├── migrations/             ← Goose SQL files (embedded)
│   └── ui/
│       ├── components/         ← reusable Templ components
│       ├── pages/              ← full-page Templ templates
│       └── layouts/            ← base layouts (HTML head, nav, footer)
├── assets/
│   └── app.css                 ← Tailwind v4 entry
├── go.mod
├── go.sum
└── package.json                ← Tailwind build script
```

## Entry Point: `cmd/server/main.go`

```go
func main() {
    cfg := config.Load()

    // Database
    pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
    if err != nil { log.Fatal(err) }
    defer pool.Close()
    db := sqlx.NewDb(stdlib.OpenDBFromPool(pool), "pgx")

    // Run migrations
    goose.SetBaseFS(migrations.FS)
    goose.Up(db.DB, ".")

    // Wire dependencies
    authRepo := repositories.NewAuthRepository(db)
    authService := services.NewAuthService(authRepo, cfg)
    authHandler := handlers.NewAuthHandler(authService, cfg)

    // Router
    r := chi.NewRouter()
    r.Use(middleware.Logger, middleware.Recoverer)

    // Public routes
    r.Get("/", homeHandler)
    r.Route("/auth", authHandler.Routes)

    // Protected routes
    r.Group(func(r chi.Router) {
        r.Use(middleware.RequireAuth(cfg))
        r.Route("/dashboard", dashboardHandler.Routes)
    })

    // Static files
    r.Handle("/assets/*", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets/dist"))))

    log.Printf("Starting on :%s", cfg.Port)
    http.ListenAndServe(":"+cfg.Port, r)
}
```

## Dependencies

```
github.com/go-chi/chi/v5         — HTTP router
github.com/jackc/pgx/v5          — PostgreSQL driver
github.com/jmoiron/sqlx           — SQL extensions (scanning)
github.com/pressly/goose/v3       — migrations
github.com/a-h/templ              — HTML templates
github.com/golang-jwt/jwt/v5      — JWT tokens
github.com/resendlabs/resend-go   — email (Resend)
```

## Build & Run

```bash
# Generate templ files
templ generate

# Build CSS
npx @tailwindcss/cli -i assets/app.css -o assets/dist/app.css

# Build
go build -o bin/server cmd/server/main.go

# Run
go run cmd/server/main.go

# Verify
go build ./...
go vet ./...
```
