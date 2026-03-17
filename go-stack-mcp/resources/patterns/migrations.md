---
description: Goose migration patterns — naming, embedding, and running at startup.
---

# Goose Migration Patterns

## File Naming

```
internal/migrations/
  001_initial.sql
  002_auth.sql
  003_campaigns.sql
  004_billing.sql
```

Always sequential integers. Never skip numbers. Never modify existing migrations.

## SQL Migration Format

```sql
-- +goose Up
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);

-- +goose Down
DROP TABLE campaigns;
```

## Embed and Run at Startup

```go
// internal/migrations/embed.go
package migrations

import "embed"

//go:embed *.sql
var Files embed.FS
```

```go
// cmd/server/main.go
import (
    "github.com/pressly/goose/v3"
    "yourapp/internal/migrations"
)

// Run migrations at startup
goose.SetBaseFS(migrations.Files)
if err := goose.SetDialect("postgres"); err != nil {
    log.Fatalf("set goose dialect: %v", err)
}
if err := goose.Up(db.DB, "."); err != nil {
    log.Fatalf("run migrations: %v", err)
}
```

## Common Column Patterns

```sql
-- Standard ID + timestamps
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- Soft delete
deleted_at TIMESTAMPTZ

-- User ownership
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE

-- JSON data
metadata JSONB NOT NULL DEFAULT '{}'

-- Status enum (use TEXT + CHECK constraint, not ENUM type)
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled'))
```

## Adding Columns (new migration)

```sql
-- +goose Up
ALTER TABLE campaigns ADD COLUMN description TEXT;
ALTER TABLE campaigns ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';

-- +goose Down
ALTER TABLE campaigns DROP COLUMN tags;
ALTER TABLE campaigns DROP COLUMN description;
```

## Updated At Trigger

```sql
-- +goose Up
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```
