---
description: HTTP handler conventions for chi router — struct-based, service-injected, HTMX-aware.
---

# Handler Patterns

## Handler Struct

```go
package handlers

import (
    "net/http"
    "github.com/go-chi/chi/v5"
    "yourapp/internal/config"
    "yourapp/internal/services"
)

type Handler struct {
    auth    *services.AuthService
    cfg     *config.Config
}

func New(auth *services.AuthService, cfg *config.Config) *Handler {
    return &Handler{auth: auth, cfg: cfg}
}

func (h *Handler) Routes() chi.Router {
    r := chi.NewRouter()
    r.Get("/", h.List)
    r.Post("/", h.Create)
    r.Get("/{id}", h.Get)
    r.Put("/{id}", h.Update)
    r.Delete("/{id}", h.Delete)
    return r
}
```

## HTMX-Aware Rendering

```go
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
    items, err := h.svc.List(r.Context(), userIDFromContext(r))
    if err != nil {
        http.Error(w, "failed to load", http.StatusInternalServerError)
        return
    }

    // HTMX request: return partial template
    if r.Header.Get("HX-Request") == "true" {
        ui.ItemList(items).Render(r.Context(), w)
        return
    }

    // Full page request: wrap in layout
    ui.ItemListPage(items).Render(r.Context(), w)
}
```

## Form Handling

```go
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
    if err := r.ParseForm(); err != nil {
        http.Error(w, "bad request", http.StatusBadRequest)
        return
    }

    input := services.CreateInput{
        Name:  r.FormValue("name"),
        Email: r.FormValue("email"),
    }

    item, err := h.svc.Create(r.Context(), input)
    if err != nil {
        // Return form with error for HTMX swap
        if r.Header.Get("HX-Request") == "true" {
            ui.ItemForm(input, err.Error()).Render(r.Context(), w)
            return
        }
        http.Redirect(w, r, "/?error=create_failed", http.StatusSeeOther)
        return
    }

    // HTMX: redirect via HX-Redirect header
    if r.Header.Get("HX-Request") == "true" {
        w.Header().Set("HX-Redirect", "/items/"+item.ID.String())
        w.WriteHeader(http.StatusOK)
        return
    }

    http.Redirect(w, r, "/items/"+item.ID.String(), http.StatusSeeOther)
}
```

## Path Parameters

```go
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    // parse UUID if needed
    itemID, err := uuid.Parse(id)
    if err != nil {
        http.Error(w, "invalid id", http.StatusBadRequest)
        return
    }
    // ...
}
```

## User Context

```go
// Set in RequireAuth middleware
type contextKey string
const userContextKey contextKey = "user"

func userIDFromContext(r *http.Request) uuid.UUID {
    user, _ := r.Context().Value(userContextKey).(*models.User)
    if user == nil {
        return uuid.Nil
    }
    return user.ID
}
```

## Wiring in main.go

```go
authHandler := handlers.NewAuthHandler(authService, cfg)
campaignHandler := handlers.NewCampaignHandler(campaignService, cfg)

r.Route("/auth", func(r chi.Router) {
    r.Mount("/", authHandler.Routes())
})
r.Route("/campaigns", func(r chi.Router) {
    r.Use(middleware.RequireAuth)
    r.Mount("/", campaignHandler.Routes())
})
```
