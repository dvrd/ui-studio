---
description: Go repository layer — sqlx queries, parameterized SQL, connection management, and error wrapping.
---

# Go Repositories

## Repository Struct Pattern

```go
type CampaignRepository struct {
    db *sqlx.DB
}

func NewCampaignRepository(db *sqlx.DB) *CampaignRepository {
    return &CampaignRepository{db: db}
}
```

## CRUD Operations

```go
func (r *CampaignRepository) ListByUser(ctx context.Context, userID string) ([]models.Campaign, error) {
    var campaigns []models.Campaign
    err := r.db.SelectContext(ctx, &campaigns,
        "SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC", userID)
    if err != nil {
        return nil, fmt.Errorf("list campaigns by user: %w", err)
    }
    return campaigns, nil
}

func (r *CampaignRepository) GetByID(ctx context.Context, id, userID string) (*models.Campaign, error) {
    var campaign models.Campaign
    err := r.db.GetContext(ctx, &campaign,
        "SELECT * FROM campaigns WHERE id = $1 AND user_id = $2", id, userID)
    if err != nil {
        return nil, fmt.Errorf("get campaign by id: %w", err)
    }
    return &campaign, nil
}

func (r *CampaignRepository) Create(ctx context.Context, userID string, input services.CreateCampaignInput) (*models.Campaign, error) {
    var campaign models.Campaign
    err := r.db.GetContext(ctx, &campaign,
        `INSERT INTO campaigns (user_id, title, status) VALUES ($1, $2, $3)
         RETURNING *`,
        userID, input.Title, input.Status)
    if err != nil {
        return nil, fmt.Errorf("create campaign: %w", err)
    }
    return &campaign, nil
}

func (r *CampaignRepository) Update(ctx context.Context, id, userID string, input services.UpdateCampaignInput) (*models.Campaign, error) {
    var campaign models.Campaign
    err := r.db.GetContext(ctx, &campaign,
        `UPDATE campaigns SET title = $1, status = $2, updated_at = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        input.Title, input.Status, id, userID)
    if err != nil {
        return nil, fmt.Errorf("update campaign: %w", err)
    }
    return &campaign, nil
}

func (r *CampaignRepository) Delete(ctx context.Context, id, userID string) error {
    _, err := r.db.ExecContext(ctx,
        "DELETE FROM campaigns WHERE id = $1 AND user_id = $2", id, userID)
    if err != nil {
        return fmt.Errorf("delete campaign: %w", err)
    }
    return nil
}
```

## Connection Setup

```go
// In main.go
pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
if err != nil {
    log.Fatal(err)
}
defer pool.Close()

db := sqlx.NewDb(stdlib.OpenDBFromPool(pool), "pgx")
```

## Rules

- Always use `Context` variants: `SelectContext`, `GetContext`, `ExecContext`
- Always parameterized queries: `$1`, `$2` — never string concatenation
- Always wrap errors: `fmt.Errorf("operation: %w", err)`
- Always `defer rows.Close()` after `QueryContext`
- Use `RETURNING *` for insert/update to get the full record
- Repositories receive `*sqlx.DB`, not `*pgxpool.Pool`
