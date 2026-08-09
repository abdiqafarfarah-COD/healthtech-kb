# API Contract — Healthtech Knowledge Base

Base URL (local dev): `http://localhost:8000/api/v1`

All protected endpoints require header: `Authorization: Bearer <JWT>`

## Auth
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /auth/login | No | Authenticate user, returns JWT |
| POST | /auth/register | No (Admin-created in prod) | Create a new user account |

## Articles
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /articles | No | List published articles (pagination, filters) |
| GET | /articles/{slug} | No | Fetch single article by slug |
| POST | /articles | Editor/Admin | Create a new article (draft) |
| PUT | /articles/{id} | Editor/Admin | Update an article |
| DELETE | /articles/{id} | Admin | Soft-delete an article |
| POST | /articles/{id}/publish | Admin | Publish a draft article |

## Categories
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /categories | No | List all categories with article counts |

## Search
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /search?q={query} | No | Full-text search across articles |

## Feedback
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /feedback | Viewer+ | Submit article rating/comment |

## Chat (Widget)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /chat | Optional (role-aware if logged in) | Send a question, receive grounded answer + citation |
| POST | /chat/{session_id}/feedback | No | Mark a chat answer helpful/not helpful |

## Admin
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /admin/dashboard | Admin | View stats: views, searches, top articles |
| GET | /admin/chat-logs | Admin | Review low-confidence/unanswered chat questions |

## Example Request/Response

**POST /auth/login**
Request:
\`\`\`json
{ "email": "amina@example.com", "password": "secret123" }
\`\`\`
Response:
\`\`\`json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer", "role": "viewer" }
\`\`\`

**POST /chat**
Request:
\`\`\`json
{ "question": "How do I reverse a discharge entry?", "session_id": "abc-123" }
\`\`\`
Response:
\`\`\`json
{
  "answer": "To reverse a discharge entry, go to Patient Management > Discharge > Reverse...",
  "cited_article": { "id": 14, "title": "Reversing a Discharge Entry", "slug": "reverse-discharge-entry" },
  "session_id": "abc-123"
}
\`\`\`