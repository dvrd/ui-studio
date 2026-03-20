---
description: Visual verification procedure — navigate route, screenshot desktop + mobile, check console and network.
---

# Smoke Test Procedure

Execute this procedure for each route being verified.

## Prerequisites

1. Chrome DevTools MCP connected (`chrome-devtools: list_pages`)
2. Dev server running (health check passes)

## Steps

1. **Navigate**: `chrome-devtools: navigate_page({ url: "{url}" })`

2. **Wait**: `chrome-devtools: wait_for({ timeout: 10000 })` for content to load

3. **Desktop screenshot**:
   ```
   chrome-devtools: take_screenshot({
       filePath: ".ui-studio/screenshots/{name}-v{N}.png",
       fullPage: true
   })
   ```

4. **Console check**:
   ```
   chrome-devtools: list_console_messages()
   ```
   - FAIL if any `error` level messages (ignore WebGL, analytics warnings)

5. **Network check**:
   ```
   chrome-devtools: list_network_requests()
   ```
   - FAIL if any 5xx responses

6. **Mobile viewport**:
   ```
   chrome-devtools: resize_page({ width: 375, height: 812 })
   chrome-devtools: take_screenshot({
       filePath: ".ui-studio/screenshots/{name}-mobile-v{N}.png",
       fullPage: true
   })
   chrome-devtools: resize_page({ width: 1440, height: 900 })
   ```

## Pass Criteria

- Page loads (no blank screen)
- No console errors
- No 5xx network responses
- Content is visible in both desktop and mobile screenshots

## On Failure

Stop immediately. Report:
- Which check failed
- Error details (console message, HTTP status, etc.)
- Screenshot of the failing state
