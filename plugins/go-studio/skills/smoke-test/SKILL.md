---
description: Smoke test the running Go app via Chrome DevTools MCP — screenshot, console errors, network check.
user-invocable: true
---

# Smoke Test

Verifies the app renders correctly using Chrome DevTools.

## Prerequisites

1. **Chrome DevTools MCP must be connected** — verify with `chrome-devtools: list_pages`. If it fails, user needs to restart Claude Code.
2. **Go server must be running** — `go run cmd/server/main.go` or `air` in a separate terminal.

## STOP on Chrome Failure

If ANY Chrome DevTools call fails, STOP immediately and report the error. Do NOT skip and proceed.

## Steps

1. Check server is up:
   ```
   curl -s http://localhost:8080/health
   ```
   If this fails → report "Server not running" and stop.

2. Navigate Chrome to the target URL:
   ```
   chrome-devtools: navigate_page({ url: "http://localhost:8080/" })
   ```

3. Wait for page to load:
   ```
   chrome-devtools: wait_for({ text: "[expected heading or content]", timeout: 15000 })
   ```

4. Take screenshot:
   ```
   chrome-devtools: take_screenshot({
     filePath: "screenshots/{feature}-iter{N}.png",
     fullPage: true
   })
   ```

5. Check console:
   ```
   chrome-devtools: list_console_messages()
   ```
   Fail if any `error` level messages (ignore WebGL, analytics warnings).

6. Check network:
   ```
   chrome-devtools: list_network_requests()
   ```
   Fail if any 5xx responses.

7. Mobile viewport check (375x812):
   ```
   chrome-devtools: resize_page({ width: 375, height: 812 })
   chrome-devtools: take_screenshot({ filePath: "screenshots/{feature}-mobile-iter{N}.png", fullPage: true })
   chrome-devtools: resize_page({ width: 1440, height: 900 })
   ```

## Screenshot Naming

- Desktop: `screenshots/{feature}-iter{N}.png`
- Mobile: `screenshots/{feature}-mobile-iter{N}.png`
- N starts at 1, increments with each rebuild

## Report

```
Smoke test: [feature]

Server: ✓ running at localhost:8080
Desktop screenshot: screenshots/auth-iter1.png
Mobile screenshot: screenshots/auth-mobile-iter1.png
Console errors: 0
Network errors: 0

Result: PASS / FAIL
```
