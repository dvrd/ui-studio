---
description: Build a Flutter mobile screen that consumes the Go REST API.
user-invocable: true
agent: go-studio:flutter-builder
---

# Build Flutter Screen

Creates a Flutter screen that integrates with the Go backend.

## Inputs

Confirm with user:
- `screenName` — PascalCase screen name (e.g. `CampaignsScreen`, `DashboardScreen`)
- Which API endpoint does this screen consume?
- What actions can the user take?

## Steps

1. Read the Go handler for the target API endpoint to get request/response types

2. Read `templui: list_resources()` to understand the design tokens and color palette (for visual parity with web)

3. Write `lib/models/{snake_name}.dart`:
   - Dart class with `json_serializable` annotations
   - `fromJson` factory constructor

4. Write `lib/repositories/{snake_name}_repository.dart`:
   - `Dio` HTTP client with JWT bearer token
   - Methods matching the Go API endpoints
   - Error handling: throws typed exceptions for 4xx/5xx

5. Write `lib/providers/{snake_name}_provider.dart`:
   - `AsyncNotifier` (Riverpod)
   - Calls repository methods
   - Handles loading/error/data states

6. Write `lib/screens/{snake_name}_screen.dart`:
   - `ConsumerWidget` or `ConsumerStatefulWidget`
   - Loading: `CircularProgressIndicator` skeleton
   - Error: inline error message with retry button
   - Data: list/detail view using Material 3 components

7. Register route in `lib/router.dart` (GoRouter)

8. Run `dart analyze` — fix all errors
9. Run `dart format .`

## Auth Integration

```dart
// Read JWT from secure storage
final storage = FlutterSecureStorage();
final token = await storage.read(key: 'access_token');

// Attach to all requests
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final token = await storage.read(key: 'access_token');
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  },
  onError: (error, handler) async {
    if (error.response?.statusCode == 401) {
      // refresh token or redirect to login
    }
    handler.next(error);
  },
));
```

## Success Criteria

- `dart analyze` passes with 0 errors
- Screen handles all three states: loading, error, data
- API integration matches Go handler signatures
