---
description: PostgreSQL patterns using pgx/v5 connection pool and sqlx for scanning.
---

# Database Patterns

## Connection Pool Setup

```go
// internal/config/config.go
type Config struct {
    DatabaseURL string // DATABASE_URL env var
    // ...
}

// cmd/server/main.go
pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
if err != nil {
    log.Fatalf("connect to database: %v", err)
}
defer pool.Close()

// Wrap for sqlx scanning
db := sqlx.NewDb(stdlib.OpenDBFromPool(pool), "pgx")
```

## Repository Struct

```go
package repositories

import (
    "context"
    "fmt"
    "github.com/jmoiern/sqlx"
    "yourapp/internal/models"
)

type CampaignRepository struct {
    db *sqlx.DB
}

func NewCampaignRepository(db *sqlx.DB) *CampaignRepository {
    return &CampaignRepository{db: db}
}
```

## Query Patterns

```go
// List
func (r *CampaignRepository) List(ctx context.Context, userID uuid.UUID) ([]models.Campaign, error) {
    var campaigns []models.Campaign
    err := r.db.SelectContext(ctx, &campaigns,
        "SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC", userID)
    if err != nil {
        return nil, fmt.Errorf("list campaigns: %w", err)
    }
    return campaigns, nil
}

// Get by ID
func (r *CampaignRepository) GetByID(ctx context.Context, id, userID uuid.UUID) (*models.Campaign, error) {
    var c models.Campaign
    err := r.db.GetContext(ctx, &c,
        "SELECT * FROM campaigns WHERE id = $1 AND user_id = $2", id, userID)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, fmt.Errorf("get campaign: %w", err)
    }
    return &c, nil
}

// Create
func (r *CampaignRepository) Create(ctx context.Context, userID uuid.UUID, input models.CreateCampaignInput) (*models.Campaign, error) {
    var c models.Campaign
    err := r.db.GetContext(ctx, &c, `
        INSERT INTO campaigns (user_id, name, status)
        VALUES ($1, $2, $3)
        RETURNING *`,
        userID, input.Name, "draft")
    if err != nil {
        return nil, fmt.Errorf("create campaign: %w", err)
    }
    return &c, nil
}

// Update
func (r *CampaignRepository) Update(ctx context.Context, id, userID uuid.UUID, input models.UpdateCampaignInput) (*models.Campaign, error) {
    var c models.Campaign
    err := r.db.GetContext(ctx, &c, `
        UPDATE campaigns SET name = $3, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
        id, userID, input.Name)
    if err != nil {
        return nil, fmt.Errorf("update campaign: %w", err)
    }
    return &c, nil
}

// Delete
func (r *CampaignRepository) Delete(ctx context.Context, id, userID uuid.UUID) error {
    result, err := r.db.ExecContext(ctx,
        "DELETE FROM campaigns WHERE id = $1 AND user_id = $2", id, userID)
    if err != nil {
        return fmt.Errorf("delete campaign: %w", err)
    }
    n, _ := result.RowsAffected()
    if n == 0 {
        return ErrNotFound
    }
    return nil
}
```

## Model Struct Tags

```go
type Campaign struct {
    ID        uuid.UUID  `db:"id"`
    UserID    uuid.UUID  `db:"user_id"`
    Name      string     `db:"name"`
    Status    string     `db:"status"`
    CreatedAt time.Time  `db:"created_at"`
    UpdatedAt time.Time  `db:"updated_at"`
}
```

## Common Errors

```go
var (
    ErrNotFound = errors.New("not found")
    ErrConflict = errors.New("already exists")
)
```

## Transactions

```go
func (r *Repository) TransferCredits(ctx context.Context, fromID, toID uuid.UUID, amount int) error {
    tx, err := r.db.BeginTxx(ctx, nil)
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }
    defer tx.Rollback()

    if _, err := tx.ExecContext(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID); err != nil {
        return fmt.Errorf("debit: %w", err)
    }
    if _, err := tx.ExecContext(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID); err != nil {
        return fmt.Errorf("credit: %w", err)
    }

    return tx.Commit()
}
```
