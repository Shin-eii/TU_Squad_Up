# API Contract — Issue #4

All endpoints use JSON and are mounted under `/api`. Successful login uses the HTTP-only `tu.sid` session cookie. The application never stores a TU password.

## Error shape

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Check the activity details.",
    "fields": { "title": "Title is required." }
  }
}
```

## Authentication

### `POST /api/auth/mock-login`

Request: `{ "memberId": 1 }`

Response `200`: `{ "member": { "memberId": "1", "universityEmail": "...", "displayName": "...", "memberType": "STUDENT", "isAdministrator": false } }`

### `GET /api/auth/me`

Response `200`: same member wrapper. Response `401`: `AUTH_REQUIRED`.

### `POST /api/auth/logout`

Response `204` with no body.

## Activities

### `POST /api/activities`

Requires a valid session. The server ignores any client host field and uses the session member.

Request fields: `title`, `description`, `category`, `startAt`, `endAt`, `registrationDeadline`, `minParticipants`, `maxParticipants`, and `joinMode`.

Response `201`: `{ "activity": { ...savedDraft } }`.

Issue #4 accepts free drafts only. Paid costs, rules, location, host participation, and publishing are separate transactions in later Issues.

## Jigsaw traceability

| Endpoint | Route | Controller function | MySQL tables | Test |
|---|---|---|---|---|
| `POST /api/auth/mock-login` | `routes/auth.routes.js` | `mockLogin` | `members` | `tests/auth.test.js` |
| `GET /api/auth/me` | `routes/auth.routes.js` | `getCurrentMember` | `members` | `tests/auth.test.js` |
| `POST /api/auth/logout` | `routes/auth.routes.js` | `logout` | Session only | `tests/auth.test.js` |
| `POST /api/activities` | `routes/activities.routes.js` | `createActivity` | `activity_categories`, `activities` | `tests/activities.test.js` |
