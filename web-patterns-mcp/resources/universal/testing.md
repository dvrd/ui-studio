---
description: Unit, integration, e2e, and visual regression testing strategy for web applications.
---

# Testing

## Testing Pyramid

```
          /  E2E  \           ← Few: critical user flows
         /  Integ  \          ← Medium: API routes, DB queries
        /   Unit    \         ← Many: services, utilities, components
```

## Unit Tests

Test business logic in isolation:

```
// Service test
test("create campaign validates title length"):
    service = new CampaignService(mockRepo)
    err = service.Create({ title: "" })
    assert err.field == "title"
    assert err.message == "Title is required"

// Utility test
test("formatCurrency returns correct format"):
    assert formatCurrency(1234.5) == "$1,234.50"
```

**What to unit test:**
- Service methods (business rules, validation)
- Utility functions (formatting, parsing, calculations)
- Component rendering (given props → expected output)

**What NOT to unit test:**
- Database queries (use integration tests)
- Framework internals
- Trivial getters/setters

## Integration Tests

Test API routes with a real database:

```
test("POST /campaigns creates campaign"):
    setup: seed test user, get auth token

    response = POST /campaigns {
        headers: { Authorization: "Bearer {token}" },
        body: { title: "Test Campaign", status: "draft" }
    }

    assert response.status == 201
    assert response.body.title == "Test Campaign"

    // Verify in DB
    campaign = db.findById(response.body.id)
    assert campaign.userId == testUser.id
```

**What to integration test:**
- All API endpoints (CRUD operations)
- Auth flows (login, register, protected routes)
- Webhook handlers
- Database migrations (up and down)

## E2E Tests

Test critical user flows in a real browser:

```
test("user can register and create campaign"):
    navigate to /register
    fill email, password
    click "Register"
    assert redirected to /dashboard

    click "New Campaign"
    fill title: "My Campaign"
    click "Save"
    assert campaign appears in list
```

**What to E2E test:**
- Registration → login → first action
- Payment flow (with Stripe test mode)
- Critical CRUD operations
- Error states (invalid form, unauthorized access)

**Keep E2E tests minimal** — they're slow and fragile. Test the happy path and critical error paths.

## Visual Regression

Compare screenshots across changes:

```
test("dashboard matches baseline"):
    navigate to /dashboard
    screenshot = take_screenshot()
    compare with baseline (allow 0.1% diff)
```

Use Chrome DevTools MCP for screenshot capture at standard viewports.

## Test Data

- Use factories/fixtures to create test data
- Each test creates its own data (no shared state between tests)
- Clean up after tests (use transactions that rollback)
- Use realistic but fake data (no production data)

## Test Environment

- Separate test database (created fresh per test run)
- Mock external services (Stripe, email, OAuth) in tests
- Use test API keys for Stripe (`sk_test_...`)
- Run migrations before test suite

## Stack-Specific Testing

| Stack | Test runner | Framework |
|---|---|---|
| Go | `go test ./...` | testing + testify |
| Next.js | `npx vitest` or `npx jest` | Vitest/Jest + Testing Library |
| SvelteKit | `npx vitest` | Vitest + @testing-library/svelte |
| Nuxt | `npx vitest` | Vitest + @vue/test-utils |
| Rails | `bundle exec rspec` | RSpec |
