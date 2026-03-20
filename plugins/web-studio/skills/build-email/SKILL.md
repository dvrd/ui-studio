---
description: Add transactional email (welcome, password reset, notifications).
user-invocable: true
agent: web-studio:web-builder
---

# Build Email

Adds transactional email capability using Resend, SendGrid, or SES.

## Inputs

Confirm with user:
- Email provider (Resend recommended)
- Which emails: welcome, magic link, password reset, notifications

## Steps

1. `steps/integration/build-email.md` — Build email service, templates, wire into auth

## Success Criteria

- Build passes
- Email service created with send method
- Templates exist for each email type
- Auth service triggers emails on registration/reset
