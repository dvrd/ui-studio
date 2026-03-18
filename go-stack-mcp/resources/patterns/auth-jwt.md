---
description: JWT access + refresh token pattern with HttpOnly cookies.
---

# JWT Auth Pattern

## Token Pair Strategy

- **Access token**: 15 min expiry, contains user claims
- **Refresh token**: 7 day expiry, stored in DB for rotation
- Both stored as HttpOnly cookies (not localStorage)

## JWT Claims

```go
type Claims struct {
    UserID uuid.UUID `json:"sub"`
    Email  string    `json:"email"`
    jwt.RegisteredClaims
}
```

## Generate Token Pair

```go
func (s *AuthService) generateTokenPair(user *models.User) (access, refresh string, err error) {
    now := time.Now()

    // Access token
    accessClaims := &Claims{
        UserID: user.ID,
        Email:  user.Email,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(now),
        },
    }
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    access, err = accessToken.SignedString([]byte(s.cfg.JWTSecret))
    if err != nil {
        return "", "", fmt.Errorf("sign access token: %w", err)
    }

    // Refresh token (random, stored in DB)
    refreshBytes := make([]byte, 32)
    if _, err := rand.Read(refreshBytes); err != nil {
        return "", "", fmt.Errorf("generate refresh token: %w", err)
    }
    refresh = base64.URLEncoding.EncodeToString(refreshBytes)

    return access, refresh, nil
}
```

## Validate Access Token

```go
func (s *AuthService) ValidateAccessToken(tokenStr string) (*Claims, error) {
    claims := &Claims{}
    token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
        }
        return []byte(s.cfg.JWTSecret), nil
    })
    if err != nil || !token.Valid {
        return nil, fmt.Errorf("invalid token: %w", err)
    }
    return claims, nil
}
```

## Set Cookies

```go
func setAuthCookies(w http.ResponseWriter, access, refresh string, cfg *config.Config) {
    http.SetCookie(w, &http.Cookie{
        Name:     "access_token",
        Value:    access,
        Path:     "/",
        HttpOnly: true,
        Secure:   cfg.IsProduction,
        SameSite: http.SameSiteLaxMode,
        MaxAge:   int((15 * time.Minute).Seconds()),
    })
    http.SetCookie(w, &http.Cookie{
        Name:     "refresh_token",
        Value:    refresh,
        Path:     "/auth/refresh",
        HttpOnly: true,
        Secure:   cfg.IsProduction,
        SameSite: http.SameSiteLaxMode,
        MaxAge:   int((7 * 24 * time.Hour).Seconds()),
    })
}
```

## RequireAuth Middleware

```go
func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        cookie, err := r.Cookie("access_token")
        if err != nil {
            if r.Header.Get("HX-Request") == "true" {
                w.Header().Set("HX-Redirect", "/auth/login")
                w.WriteHeader(http.StatusUnauthorized)
                return
            }
            http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
            return
        }

        claims, err := m.authService.ValidateAccessToken(cookie.Value)
        if err != nil {
            http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
            return
        }

        user, err := m.userRepo.GetByID(r.Context(), claims.UserID)
        if err != nil {
            http.Redirect(w, r, "/auth/login", http.StatusSeeOther)
            return
        }

        ctx := context.WithValue(r.Context(), userContextKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```
