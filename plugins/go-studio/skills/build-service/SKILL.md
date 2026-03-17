---
description: Add a new domain service with handler, service layer, repository, and Goose migration.
user-invocable: true
agent: go-studio:go-builder
---

# Build Service

Adds a complete domain feature: migration, repository, service, and HTTP handlers.

## Inputs

Confirm with user:
- `serviceName` — Go package/file name in snake_case (e.g. `campaign`, `lead`, `subscription`)
- Resource fields — what data does this entity have?
- Auth required? (default yes — protected by RequireAuth middleware)
- Which HTTP methods? (list, get, create, update, delete — default all)

## Steps

1. Read patterns:
   - `go-stack: pattern://database.md`
   - `go-stack: pattern://handlers.md`
   - `go-stack: pattern://migrations.md`

2. Write migration `internal/migrations/NNN_{serviceName}.sql`:
   - Table with id (UUID), user_id (FK), standard fields, created_at, updated_at
   - Index on user_id
   - Down migration

3. Write `internal/models/{serviceName}.go`:
   - Go struct with `db:` tags for sqlx scanning
   - Input structs for create/update

4. Write `internal/repositories/{serviceName}.go`:
   - `List(ctx, userID)` → `[]models.X`
   - `GetByID(ctx, id, userID)` → `*models.X`
   - `Create(ctx, input)` → `*models.X`
   - `Update(ctx, id, userID, input)` → `*models.X`
   - `Delete(ctx, id, userID)` → `error`

5. Write `internal/services/{serviceName}.go`:
   - Wraps repository with business logic
   - Validation, authorization checks, derived fields

6. Write `internal/handlers/{serviceName}.go`:
   - `GET /{plural}` — list (with pagination)
   - `GET /{plural}/{id}` — get one
   - `POST /{plural}` — create
   - `PUT /{plural}/{id}` — update
   - `DELETE /{plural}/{id}` — delete
   - HTMX-aware: return partial template for HX-Request, full page otherwise

7. Write Templ templates:
   - `internal/ui/pages/{serviceName}_list.templ`
   - `internal/ui/components/{serviceName}_card.templ`
   - `internal/ui/components/{serviceName}_form.templ`

8. Register subrouter in `cmd/server/main.go`:
   ```go
   r.Route("/{plural}", func(r chi.Router) {
       r.Use(middleware.RequireAuth)
       // mount handler methods
   })
   ```

9. Run `go build ./...` + `templ generate`

## Success Criteria

- `go build ./...` passes
- All 5 HTTP routes registered
- CRUD operations work through handler → service → repository chain
- Routes protected by RequireAuth middleware
