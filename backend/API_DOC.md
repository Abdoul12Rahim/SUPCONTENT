# SUPCONTENT Backend API — Documentation rapide

## Auth
- POST /api/auth/register
  - Payload: { "username": "user", "email": "a@b.com", "password": "Secret123" }
  - Response: 201 { user, token }

- POST /api/auth/login
  - Payload: { "email": "a@b.com", "password": "Secret123" }
  - Response: 200 { user, token }

- POST /api/auth/logout
  - Headers: `Authorization: Bearer <token>`
  - Response: 200 { message: 'Logged out' }

## Messaging (private)
- GET /api/messages/conversations
  - Returns paginated conversations for authenticated user

- GET /api/messages/conversations/with/:userId
  - Behavior: returns or creates a conversation ONLY if both users follow each other (mutual follow). Returns 403 otherwise.

- POST /api/messages/conversations/:conversationId/messages
  - Payload: { "content": "Hello" }
  - Validation: non-empty content
  - Responses: 201 created, 400 validation error, 403 forbidden

Notes:
- Access requires `Authorization: Bearer <token>`.
- Errors provide meaningful HTTP status codes (400/401/403/404/500).

## Reviews Moderation (Admin-only)
All admin routes require `Authorization` and that the user is admin.

- GET /api/admin/reports/reviews?page=1&limit=10
  - Lists reported reviews (default: unresolved)

- POST /api/admin/reports/reviews/:reviewId/resolve
  - Payload: { "deleteReview": true }
  - Action: resolves a report; if `deleteReview` true, deletes review + its likes/comments.

- POST /api/admin/users/:userId/ban
  - Action: bans a user (sets `isBanned=true`)

- POST /api/admin/users/:userId/unban
  - Action: unbans a user (sets `isBanned=false`)

- POST /api/admin/reviews/:reviewId/feature
  - Action: marks review as `isFeatured=true`

- POST /api/admin/reviews/:reviewId/unfeature
  - Action: sets `isFeatured=false`

## Example cURL — Feature a review (admin)
```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/admin/reviews/605c.../feature
```

## Error format
All errors return JSON: `{ "message": "Description" }` and appropriate status code.

## Notes for local QA
- Build: `npm run build`
- Tests: `npm test`
- Docker: `docker compose up --build` (requires Docker daemon running)

