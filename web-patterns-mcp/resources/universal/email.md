---
description: Transactional email — welcome, password reset, magic link — provider integration, templates, and delivery.
---

# Email

## Provider Selection

| Provider | Best for | Setup complexity |
|---|---|---|
| **Resend** | Modern API, great DX, React email templates | Low |
| **SendGrid** | High volume, legacy systems | Medium |
| **AWS SES** | Cost-effective at scale, AWS ecosystem | Medium |
| **Postmark** | Deliverability focus | Low |

## Email Service Pattern

```
EmailService:
    provider: EmailProvider  // Resend, SendGrid, etc.
    fromEmail: string        // "noreply@yourapp.com"

    SendWelcome(user) → void
    SendMagicLink(email, token, url) → void
    SendPasswordReset(email, token, url) → void
    SendNotification(user, subject, body) → void
```

Implementation:

```
send(to, subject, html, text):
    provider.send({
        from: fromEmail,
        to: to,
        subject: subject,
        html: html,
        text: text   // Always include plain text fallback
    })
```

## Email Types

### Welcome Email
```
Subject: Welcome to {appName}!
Trigger: After successful registration
Content: Greeting, what they can do, CTA to dashboard
```

### Magic Link
```
Subject: Your login link for {appName}
Trigger: Magic link login request
Content: "Click here to log in" button with tokenized URL
Note: Link expires in 15 minutes, single-use
```

### Password Reset
```
Subject: Reset your {appName} password
Trigger: Forgot password request
Content: "Reset Password" button with tokenized URL
Note: Link expires in 1 hour, single-use
```

### Notification
```
Subject: {event description}
Trigger: App event (new message, status change, etc.)
Content: What happened, CTA to see details
```

## Template Pattern

Structure every email the same way:

```html
<div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
    <!-- Header: logo -->
    <div style="padding: 20px; text-align: center;">
        <img src="{logo_url}" alt="{appName}" height="32">
    </div>

    <!-- Body: content -->
    <div style="padding: 20px;">
        <h1 style="font-size: 24px;">Subject line here</h1>
        <p>Body text here.</p>

        <!-- CTA button -->
        <a href="{action_url}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
            Action Text
        </a>
    </div>

    <!-- Footer -->
    <div style="padding: 20px; color: #666; font-size: 12px;">
        <p>You're receiving this because you have an account at {appName}.</p>
    </div>
</div>
```

**Rules:**
- Inline CSS only (email clients strip `<style>` tags)
- Always include plain text version
- Max width 600px
- Test on Gmail, Outlook, Apple Mail
- Include unsubscribe link for marketing emails (not required for transactional)

## Config

Required environment variables:
- `RESEND_API_KEY` (or equivalent for chosen provider)
- `FROM_EMAIL` — verified sender address
- `APP_URL` — base URL for links in emails

## Error Handling

- Queue emails for retry if provider is down
- Don't block user actions on email failure (registration should succeed even if welcome email fails)
- Log email send attempts and failures
- Set up bounce/complaint handling webhooks with provider
