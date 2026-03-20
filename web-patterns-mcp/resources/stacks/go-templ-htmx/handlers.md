---
description: Go HTTP handler patterns — chi subrouters, request parsing, HTMX-aware responses, error handling.
---

# Go Handlers

## Handler Struct Pattern

```go
type CampaignHandler struct {
    service *services.CampaignService
    cfg     *config.Config
}

func NewCampaignHandler(service *services.CampaignService, cfg *config.Config) *CampaignHandler {
    return &CampaignHandler{service: service, cfg: cfg}
}

func (h *CampaignHandler) Routes(r chi.Router) {
    r.Get("/", h.List)
    r.Post("/", h.Create)
    r.Get("/{id}", h.Get)
    r.Put("/{id}", h.Update)
    r.Delete("/{id}", h.Delete)
}
```

## Request Parsing

```go
func (h *CampaignHandler) Create(w http.ResponseWriter, r *http.Request) {
    // Parse form or JSON
    if err := r.ParseForm(); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    input := services.CreateCampaignInput{
        Title:  r.FormValue("title"),
        Status: r.FormValue("status"),
    }

    // Get authenticated user from context
    userID := middleware.UserIDFromContext(r.Context())

    campaign, err := h.service.Create(r.Context(), userID, input)
    if err != nil {
        // Handle validation errors
        var validErr *services.ValidationError
        if errors.As(err, &validErr) {
            // Re-render form with errors
            pages.CampaignForm(input, validErr.Errors).Render(r.Context(), w)
            return
        }
        http.Error(w, "Internal error", http.StatusInternalServerError)
        return
    }

    // HTMX-aware redirect
    if r.Header.Get("HX-Request") == "true" {
        w.Header().Set("HX-Redirect", fmt.Sprintf("/campaigns/%s", campaign.ID))
        w.WriteHeader(http.StatusOK)
        return
    }
    http.Redirect(w, r, fmt.Sprintf("/campaigns/%s", campaign.ID), http.StatusSeeOther)
}
```

## HTMX-Aware Responses

```go
func (h *CampaignHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    userID := middleware.UserIDFromContext(r.Context())

    if err := h.service.Delete(r.Context(), id, userID); err != nil {
        http.Error(w, "Internal error", http.StatusInternalServerError)
        return
    }

    // HTMX: return empty to remove element via hx-swap="delete"
    if r.Header.Get("HX-Request") == "true" {
        w.WriteHeader(http.StatusOK)
        return
    }
    http.Redirect(w, r, "/campaigns", http.StatusSeeOther)
}
```

## URL Parameters

```go
id := chi.URLParam(r, "id")         // path parameter
page := r.URL.Query().Get("page")   // query parameter
```

## Rules

- Always take `(w http.ResponseWriter, r *http.Request)`
- Use chi subrouters for feature grouping
- Check `HX-Request` header for partial vs full page response
- Parse form data with `r.ParseForm()`, not manual body reading
- Get user from context (set by auth middleware)
- Wrap errors with context before logging
- Never expose internal errors to the user
