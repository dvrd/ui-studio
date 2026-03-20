---
description: Go service layer — business logic, validation, dependency injection, and error handling.
---

# Go Services

## Service Struct Pattern

```go
type CampaignService struct {
    repo *repositories.CampaignRepository
    cfg  *config.Config
}

func NewCampaignService(repo *repositories.CampaignRepository, cfg *config.Config) *CampaignService {
    return &CampaignService{repo: repo, cfg: cfg}
}
```

## CRUD Operations

```go
func (s *CampaignService) List(ctx context.Context, userID string) ([]models.Campaign, error) {
    campaigns, err := s.repo.ListByUser(ctx, userID)
    if err != nil {
        return nil, fmt.Errorf("list campaigns: %w", err)
    }
    return campaigns, nil
}

func (s *CampaignService) Create(ctx context.Context, userID string, input CreateCampaignInput) (*models.Campaign, error) {
    // Validate
    if errs := input.Validate(); len(errs) > 0 {
        return nil, &ValidationError{Errors: errs}
    }

    campaign, err := s.repo.Create(ctx, userID, input)
    if err != nil {
        return nil, fmt.Errorf("create campaign: %w", err)
    }
    return campaign, nil
}

func (s *CampaignService) GetByID(ctx context.Context, id, userID string) (*models.Campaign, error) {
    campaign, err := s.repo.GetByID(ctx, id, userID)
    if err != nil {
        return nil, fmt.Errorf("get campaign: %w", err)
    }
    return campaign, nil
}
```

## Validation

```go
type CreateCampaignInput struct {
    Title  string
    Status string
}

func (i CreateCampaignInput) Validate() map[string]string {
    errs := map[string]string{}
    if i.Title == "" {
        errs["title"] = "Title is required"
    } else if len(i.Title) > 200 {
        errs["title"] = "Title must be under 200 characters"
    }
    if i.Status != "" && i.Status != "draft" && i.Status != "active" && i.Status != "paused" {
        errs["status"] = "Status must be draft, active, or paused"
    }
    return errs
}

type ValidationError struct {
    Errors map[string]string
}

func (e *ValidationError) Error() string {
    return "validation failed"
}
```

## Rules

- Services contain ALL business logic
- No HTTP concerns (no `http.Request`, no `http.ResponseWriter`)
- No direct DB access (use repository)
- Always wrap errors: `fmt.Errorf("context: %w", err)`
- Always propagate `context.Context` as first parameter
- Validation happens in service, not handler
