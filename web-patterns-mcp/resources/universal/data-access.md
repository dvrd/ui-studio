---
description: Repository pattern, ORM vs raw SQL, connection management, migrations, and query safety.
---

# Data Access

## Layered Architecture

```
Handler/Controller → Service → Repository/Model → Database
```

- **Handlers** never touch the database directly
- **Services** call repositories, contain business logic
- **Repositories** execute queries, return typed data

## Repository Pattern

Each domain entity has a repository with standard operations:

```
Repository<Entity>:
    List(ctx, filters)    → []Entity
    GetByID(ctx, id)      → Entity
    Create(ctx, input)    → Entity
    Update(ctx, id, input)→ Entity
    Delete(ctx, id)       → void
```

**Rules:**
- Always accept context (for cancellation, timeouts, tracing)
- Always use parameterized queries — NEVER string concatenation
- Always wrap errors with context: "create campaign: {underlying error}"
- Always return typed data, not raw rows

## Connection Management

- Use connection pooling (pgx pool, Prisma connection pool, etc.)
- Set reasonable pool limits (max 20 connections for typical apps)
- Always release connections back to pool (defer close / using block)
- Set query timeouts (30s default)

```
# Pool configuration (universal)
pool:
  max_connections: 20
  min_connections: 5
  idle_timeout: 300s
  max_lifetime: 3600s
  connect_timeout: 5s
```

## Migrations

- Forward-only in production — never edit existing migrations
- Always include rollback (down migration)
- Number migrations sequentially: `001_initial.sql`, `002_add_auth.sql`
- Embed migrations in the application binary where possible

### Migration Structure

```sql
-- Up: create
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);

-- Down: rollback
DROP TABLE campaigns;
```

**Rules:**
- Always include primary key (UUID preferred)
- Always include created_at, updated_at
- Index foreign keys and frequently queried columns
- Use CHECK constraints for enums: `CHECK (status IN ('draft', 'active', 'paused'))`

## Query Safety

- **Parameterized queries only**: `WHERE id = $1` not `WHERE id = '${id}'`
- **Error wrapping**: every query error gets context
- **Close resources**: always close rows/cursors after use
- **Context propagation**: pass request context to all DB calls
- **N+1 prevention**: use JOINs or batch loading, never loop queries

## ORM vs Raw SQL

| When to use | Approach |
|---|---|
| Simple CRUD | ORM (Prisma, ActiveRecord, sqlx) |
| Complex queries, performance-critical | Raw SQL with parameterized queries |
| Migrations | Always use migration tool (Prisma Migrate, Goose, Rails migrations) |

The choice between ORM and raw SQL is stack-dependent. See stack-specific patterns.

## Transaction Pattern

Wrap multi-step operations in transactions:

```
transaction(ctx):
    create order
    deduct inventory
    charge payment
    → commit all or rollback all
```

Rules:
- Keep transactions short (avoid network calls inside)
- Always rollback on error
- Use appropriate isolation level (Read Committed default)
