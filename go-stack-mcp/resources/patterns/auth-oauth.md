---
description: OAuth 2.0 PKCE flow for Google and GitHub — token exchange, user upsert, JWT issuance.
---

# OAuth Pattern

## Flow

1. User clicks "Sign in with Google/GitHub" → redirect to provider authorization URL with PKCE challenge
2. Provider redirects back to `/auth/oauth/{provider}/callback?code=...&state=...`
3. Exchange code for access token → fetch user profile → find or create user → issue JWT pair

## Dependencies

```go
// go.mod
golang.org/x/oauth2 v0.25.0
```

## Config

```go
// internal/config/config.go
type Config struct {
    // ...
    GoogleClientID     string
    GoogleClientSecret string
    GitHubClientID     string
    GitHubClientSecret string
    BaseURL            string
}
```

## OAuth Config Setup

```go
// internal/services/auth_oauth.go
package services

import (
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/github"
    "golang.org/x/oauth2/google"
)

func googleOAuthConfig(cfg *config.Config) *oauth2.Config {
    return &oauth2.Config{
        ClientID:     cfg.GoogleClientID,
        ClientSecret: cfg.GoogleClientSecret,
        RedirectURL:  cfg.BaseURL + "/auth/oauth/google/callback",
        Scopes:       []string{"openid", "email", "profile"},
        Endpoint:     google.Endpoint,
    }
}

func githubOAuthConfig(cfg *config.Config) *oauth2.Config {
    return &oauth2.Config{
        ClientID:     cfg.GitHubClientID,
        ClientSecret: cfg.GitHubClientSecret,
        RedirectURL:  cfg.BaseURL + "/auth/oauth/github/callback",
        Scopes:       []string{"user:email"},
        Endpoint:     github.Endpoint,
    }
}
```

## Handler: Initiate

```go
// GET /auth/oauth/{provider}
func (h *Handler) OAuthBegin(w http.ResponseWriter, r *http.Request) {
    provider := chi.URLParam(r, "provider")
    cfg := h.oauthConfigFor(provider)
    if cfg == nil {
        http.Error(w, "unsupported provider", http.StatusBadRequest)
        return
    }

    // PKCE + state stored in session cookie
    state := generateState()
    http.SetCookie(w, &http.Cookie{
        Name: "oauth_state", Value: state,
        HttpOnly: true, Secure: h.cfg.IsProduction,
        MaxAge: 300, Path: "/",
    })

    url := cfg.AuthCodeURL(state, oauth2.AccessTypeOnline)
    http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}
```

## Handler: Callback

```go
// GET /auth/oauth/{provider}/callback
func (h *Handler) OAuthCallback(w http.ResponseWriter, r *http.Request) {
    provider := chi.URLParam(r, "provider")

    // Verify state
    stateCookie, err := r.Cookie("oauth_state")
    if err != nil || stateCookie.Value != r.URL.Query().Get("state") {
        http.Redirect(w, r, "/auth/login?error=invalid_state", http.StatusSeeOther)
        return
    }

    access, refresh, err := h.authService.OAuthCallback(r.Context(), provider, r.URL.Query().Get("code"))
    if err != nil {
        http.Redirect(w, r, "/auth/login?error=oauth_failed", http.StatusSeeOther)
        return
    }

    setAuthCookies(w, access, refresh, h.cfg)
    http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
}
```

## Service: OAuthCallback

```go
func (s *AuthService) OAuthCallback(ctx context.Context, provider, code string) (string, string, error) {
    cfg := s.oauthConfigFor(provider)
    if cfg == nil {
        return "", "", fmt.Errorf("unsupported provider: %s", provider)
    }

    token, err := cfg.Exchange(ctx, code)
    if err != nil {
        return "", "", fmt.Errorf("exchange code: %w", err)
    }

    email, name, err := s.fetchUserInfo(ctx, provider, token)
    if err != nil {
        return "", "", fmt.Errorf("fetch user info: %w", err)
    }

    user, err := s.userRepo.FindOrCreateByEmail(ctx, email, name)
    if err != nil {
        return "", "", fmt.Errorf("find or create user: %w", err)
    }

    return s.generateTokenPair(user)
}
```

## Routes in main.go

```go
r.Get("/auth/oauth/{provider}", authHandler.OAuthBegin)
r.Get("/auth/oauth/{provider}/callback", authHandler.OAuthCallback)
```
