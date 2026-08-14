# API Contract — Healthtech Knowledge Base

Base URL (local dev): `http://127.0.0.1:8000/api/v1`

All protected endpoints require header: `Authorization: Bearer <JWT>`

Roles, from least to most privileged: `viewer` < `editor` < `admin`. Each endpoint below lists the minimum role required, unless "No" (public).

## Auth

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /auth/register | No | Create a new user account (always created as `viewer`) |
| POST | /auth/login | No | Authenticate user, returns JWT + role |

**POST /auth/register**
Request:
```json
{ "name": "Amina Hassan", "email": "amina@example.com", "password": "SecurePass123", "department": "Radiology" }
```
Response (200):
```json
{ "id": 1, "name": "Amina Hassan", "email": "amina@example.com", "role": "viewer", "department": "Radiology" }
```
Response (400): `{ "detail": "Email already registered" }`

**POST /auth/login**
Request:
```json
{ "email": "amina@example.com", "password": "SecurePass123" }
```
Response (200):
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer", "role": "viewer" }
```
Response (401): `{ "detail": "Invalid email or password" }`

## Articles

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /articles | editor, admin | Create a new article (always starts as `draft`) |
| GET | /articles | No | List all **published** articles only |
| GET | /articles/{slug} | No | Fetch a single article by slug (any status) |
| POST | /articles/{article_id}/publish | admin | Change article status from `draft` to `published`, logs to audit_logs |

Note: there is currently no edit or delete endpoint for articles. Once published, an article's content cannot be changed through the API.

## Categories

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /categories | admin | Create a category (optionally nested under a parent), logs to audit_logs |
| GET | /categories | No | List all categories with live article counts |

## Search

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /search?q={query} | No | Case-insensitive match against published article titles and content; logs query + result count to search_logs |

## Feedback

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /feedback | Any logged-in user | Submit a 1-5 rating with optional comment for an article |

Request:
```json
{ "article_id": 1, "rating": 5, "comment": "Very clear instructions." }
```

## Chat (Widget)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /chat | No | Send a question, receive a grounded answer with citation if a match is found; logs every exchange to chat_logs |

Request:
```json
{ "question": "How do I reset a patient record?", "session_id": "session-abc123" }
```
Response (match found):
```json
{
  "answer": "Based on our knowledge base: Step-by-step guide on resetting a patient record in the HMIS.",
  "cited_article_id": 1,
  "cited_article_title": "How to Reset a Patient Record",
  "cited_article_slug": "how-to-reset-a-patient-record",
  "session_id": "session-abc123"
}
```
Response (no match found):
```json
{
  "answer": "I couldn't find an answer to that in our knowledge base. Would you like to escalate this to support?",
  "cited_article_id": null,
  "cited_article_title": null,
  "cited_article_slug": null,
  "session_id": "session-abc123"
}
```

## Admin

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /admin/dashboard | admin | Article/user/category counts, top 5 articles by views, articles with average rating ≤ 2, 10 most recent searches, 10 most recent audit log entries |

## Other

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | / | No | Health check, confirms API is running |
| GET | /db-check | No | Confirms database connectivity |

## Error Format

All error responses follow FastAPI's default shape:
```json
{ "detail": "Human-readable error message" }
```

Common status codes: `400` (bad request, e.g. duplicate email), `401` (missing/invalid token), `403` (valid token, insufficient role), `404` (resource not found).