---
description: Go JWT auth implementation — token generation, middleware, cookie handling, magic link, and OAuth.
---

# Go Auth Implementation

## JWT Token Generation

```go
func generateAccessToken(userID string, secret string) (string, error) {
    claims := jwt.MapClaims{
        "sub": userID,
        "exp": time.Now().Add(15 * time.Minute).Unix(),
        "iat": time.Now().Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}

func generateRefreshToken(userID string, secret string) (string, error) {
    claims := jwt.MapClaims{
        "sub": userID,
        "exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
        "iat": time.Now().Unix(),
        "typ": "refresh",
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}
```

## Auth Middleware

```go
func RequireAuth(cfg *config.Config) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            cookie, err := r.Cookie("access_token")
            if err != nil {
                http.Redirect(w, r, "/login", http.StatusSeeOther)
                return
            }

            token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
                return []byte(cfg.JWTSecret), nil
            })
            if err != nil || !token.Valid {
                http.Redirect(w, r, "/login", http.StatusSeeOther)
                return
            }

            claims := token.Claims.(jwt.MapClaims)
            ctx := context.WithValue(r.Context(), userIDKey, claims["sub"].(string))
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

## Cookie Handling

```go
func setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string) {
    http.SetCookie(w, &http.Cookie{
        Name:     "access_token",
        Value:    accessToken,
        Path:     "/",
        HttpOnly: true,
        Secure:   true,
        SameSite: http.SameSiteLaxMode,
        MaxAge:   900, // 15 minutes
    })
    http.SetCookie(w, &http.Cookie{
        Name:     "refresh_token",
        Value:    refreshToken,
        Path:     "/",
        HttpOnly: true,
        Secure:   true,
        SameSite: http.SameSiteLaxMode,
        MaxAge:   604800, // 7 days
    })
}

func clearAuthCookies(w http.ResponseWriter) {
    http.SetCookie(w, &http.Cookie{Name: "access_token", Path: "/", MaxAge: -1})
    http.SetCookie(w, &http.Cookie{Name: "refresh_token", Path: "/", MaxAge: -1})
}
```

## Password Hashing

```go
import "golang.org/x/crypto/bcrypt"

func hashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
    return string(bytes), err
}

func checkPassword(hash, password string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
```

## Config Fields

```go
type Config struct {
    JWTSecret          string `env:"JWT_SECRET,required"`
    GoogleClientID     string `env:"GOOGLE_CLIENT_ID"`
    GoogleClientSecret string `env:"GOOGLE_CLIENT_SECRET"`
    ResendAPIKey       string `env:"RESEND_API_KEY"`
    AppURL             string `env:"APP_URL" default:"http://localhost:8080"`
}
```
