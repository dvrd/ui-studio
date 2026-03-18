---
description: Complete guide to scaffolding a new Go SaaS app from zero.
---

# Project Scaffold Guide

## Standard go.mod Dependencies

```go
module github.com/username/appname

go 1.25

require (
    github.com/go-chi/chi/v5 v5.2.1
    github.com/jackc/pgx/v5 v5.7.2
    github.com/jmoiron/sqlx v1.3.5
    github.com/pressly/goose/v3 v3.24.1
    github.com/a-h/templ v0.3.833
    github.com/golang-jwt/jwt/v5 v5.2.1
    github.com/resendlabs/resend-go v1.3.0
    github.com/google/uuid v1.6.0
    golang.org/x/crypto v0.32.0
)
```

## Config Struct

```go
// internal/config/config.go
package config

import (
    "os"
    "strconv"
)

type Config struct {
    // Server
    Port        string
    BaseURL     string
    IsProduction bool

    // Database
    DatabaseURL string

    // Auth
    JWTSecret       string
    MagicLinkExpiry int // minutes

    // Email
    ResendAPIKey string
    Domain       string

    // Optional — add as needed
    StripeSecretKey      string
    StripeWebhookSecret  string
    OpenRouterAPIKey     string
    S3Bucket             string
    S3Endpoint           string
    S3AccessKey          string
    S3SecretKey          string
}

func Load() *Config {
    return &Config{
        Port:            getEnv("PORT", "8080"),
        BaseURL:         getEnv("BASE_URL", "http://localhost:8080"),
        IsProduction:    getEnv("ENV", "development") == "production",
        DatabaseURL:     mustEnv("DATABASE_URL"),
        JWTSecret:       mustEnv("JWT_SECRET"),
        MagicLinkExpiry: getEnvInt("MAGIC_LINK_EXPIRY_MINUTES", 15),
        ResendAPIKey:    getEnv("RESEND_API_KEY", ""),
        Domain:          getEnv("DOMAIN", "localhost"),
        // Stripe, OpenRouter, S3 loaded same way
    }
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}

func mustEnv(key string) string {
    v := os.Getenv(key)
    if v == "" {
        panic("required env var not set: " + key)
    }
    return v
}

func getEnvInt(key string, fallback int) int {
    if v := os.Getenv(key); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            return n
        }
    }
    return fallback
}
```

## main.go Skeleton

```go
// cmd/server/main.go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/jackc/pgx/v5/stdlib"
    "github.com/jmoiron/sqlx"
    "github.com/pressly/goose/v3"

    "yourapp/internal/config"
    "yourapp/internal/migrations"
)

func main() {
    ctx := context.Background()
    cfg := config.Load()

    // Database
    pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
    if err != nil {
        log.Fatalf("connect to database: %v", err)
    }
    defer pool.Close()

    db := sqlx.NewDb(stdlib.OpenDBFromPool(pool), "pgx")

    // Migrations
    goose.SetBaseFS(migrations.Files)
    if err := goose.SetDialect("postgres"); err != nil {
        log.Fatalf("set goose dialect: %v", err)
    }
    if err := goose.Up(db.DB, "."); err != nil {
        log.Fatalf("run migrations: %v", err)
    }

    // Router
    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.RealIP)

    // Static files
    r.Handle("/assets/*", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets/dist"))))

    // Health check
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("ok"))
    })

    // TODO: mount feature handlers here

    log.Printf("server starting on :%s", cfg.Port)
    if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
        log.Fatalf("server error: %v", err)
    }
}
```

## Initial Users Migration

```sql
-- internal/migrations/001_initial.sql
-- +goose Up
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE users;
```

## .env Template

```bash
PORT=8080
BASE_URL=http://localhost:8080
ENV=development

DATABASE_URL=postgres://postgres:postgres@localhost:5432/appname_dev?sslmode=disable

JWT_SECRET=change-me-in-production-use-long-random-string
MAGIC_LINK_EXPIRY_MINUTES=15

RESEND_API_KEY=
DOMAIN=localhost

# Optional
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENROUTER_API_KEY=
```
