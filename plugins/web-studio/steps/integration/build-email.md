---
agent: web-builder
requires: [projectDir, stackId]
resources:
  - universal://email.md
  - stack://{stackId}/email-impl.md
---

# Build Email

Add transactional email capability (welcome, password reset, notifications).

## Phase 1 — Analyze

Launch **web-architect** subagent:
- Read universal email pattern and stack-specific implementation
- Read existing project code (auth for password reset, config)
- Confirm with user: email provider (Resend, SendGrid, SES), email types needed
- Return manifest:

```json
{
  "found": true,
  "provider": "resend",
  "emails": [
    { "type": "welcome", "trigger": "after registration" },
    { "type": "magic-link", "trigger": "login request" },
    { "type": "password-reset", "trigger": "forgot password" }
  ],
  "files": {
    "create": ["email service", "email templates"],
    "modify": ["config (RESEND_API_KEY, FROM_EMAIL)", "auth service (trigger emails)"]
  }
}
```

## Phase 2 — Do

Launch **web-builder** subagent:
- Create email service with send method
- Create email templates (HTML + plain text)
- Wire into existing features (auth registration, password reset)
- Add config fields
- Run build command

Commit: `feat(email): add transactional email via {provider}`

## Phase 3 — Verify

1. **Build check**: Run stack build command — must pass
2. **Structure check**: Email service and templates exist
3. **Integration check**: Auth service calls email service on registration

**Pass criteria**: Build passes AND email service wired into auth.
**Fail criteria**: Build fails OR email not integrated.
