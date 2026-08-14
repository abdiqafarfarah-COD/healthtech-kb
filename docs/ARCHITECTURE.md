# System Architecture — Healthtech Knowledge Base & HMIS Chatbot Widget

```mermaid
flowchart TB
    subgraph Client_Apps["Client Applications (React, Vite)"]
        KBApp["KB Web App<br/>Home, Article Viewer, Editor,<br/>Category Manager, Admin Dashboard"]
        Widget["Chat Widget Component<br/>(floating, session-based)"]
        HMIS["Mock HMIS Page (/hmis-demo)<br/>demonstrates external embedding"]
    end

    HMIS -->|"renders as embedded component"| Widget
    KBApp -->|"renders on every page"| Widget

    subgraph Backend["Backend (FastAPI, port 8000)"]
        CORS["CORS Middleware<br/>allow_origins: localhost:5173"]
        Auth["Auth Service<br/>JWT login/register, bcrypt hashing"]
        RBAC["RBAC Dependency<br/>require_role(viewer/editor/admin)"]
        ArticlesAPI["Articles API<br/>create draft, list, get by slug, publish"]
        CategoriesAPI["Categories API<br/>create, list with counts"]
        SearchAPI["Search API<br/>title + body ILIKE match, logs query"]
        ChatAPI["Chat API (/api/v1/chat)<br/>keyword match, cites source, logs exchange"]
        FeedbackAPI["Feedback API<br/>1-5 rating + comment"]
        DashboardAPI["Admin Dashboard API<br/>stats, top/low-rated, recent activity"]
    end

    subgraph Data["Data Layer"]
        DB[("PostgreSQL<br/>10 tables: users, articles, categories,<br/>tags, article_tags, feedback, media,<br/>search_logs, chat_logs, audit_logs")]
    end

    KBApp -->|"HTTPS + JWT (Authorization: Bearer)"| CORS
    Widget -->|"HTTPS, no auth required"| CORS

    CORS --> Auth
    CORS --> ArticlesAPI
    CORS --> CategoriesAPI
    CORS --> SearchAPI
    CORS --> ChatAPI
    CORS --> FeedbackAPI
    CORS --> DashboardAPI

    Auth --> RBAC
    RBAC -->|"gates create/publish/dashboard"| ArticlesAPI
    RBAC --> CategoriesAPI
    RBAC --> DashboardAPI

    Auth --> DB
    ArticlesAPI --> DB
    CategoriesAPI --> DB
    SearchAPI --> DB
    ChatAPI --> DB
    FeedbackAPI --> DB
    DashboardAPI --> DB

    ChatAPI -->|"cites matched article (id, title, slug)"| ArticlesAPI
```

## CORS Flow Notes
- The backend explicitly allows requests from `http://localhost:5173` (the Vite dev server origin) via FastAPI's `CORSMiddleware`.
- The Chat Widget and public read endpoints (articles, search, categories) work without authentication, so they function correctly even when embedded in a third-party origin like the mock HMIS page.
- Write/admin endpoints (create article, publish, create category, admin dashboard) require a valid JWT and the correct role, regardless of which origin the request comes from.

## Auth Flow Notes
- Login (`POST /auth/login`) verifies the password with bcrypt and issues a JWT containing the user's `id` and `role`, valid for 480 minutes (8 hours) by default.
- The frontend stores the token in `localStorage` via `AuthContext`, and an Axios interceptor (`services/api.js`) automatically attaches it to every outgoing request as `Authorization: Bearer <token>`.
- Backend routes use a `require_role(...)` dependency to enforce RBAC: `viewer` can read and submit feedback; `editor`/`admin` can create articles; `admin` alone can publish, create categories, and view the dashboard.
- The frontend additionally guards routes client-side with a `ProtectedRoute` component that redirects unauthenticated or under-privileged users before the page even renders, as a UX layer on top of the backend's own enforcement.

## Chat Widget Flow
1. User opens the chat bubble (available on every KB page and on the mock HMIS page).
2. A random `session_id` is generated per browser session.
3. Each question is sent to `POST /api/v1/chat` with the question text and session ID.
4. The backend searches published article titles first, then falls back to content keyword matching.
5. If a match is found, the response includes the article's `id`, `title`, and `slug`, which the widget renders as a clickable "View source" link.
6. If no match is found, the widget shows a fallback message offering escalation.
7. Every exchange (question, answer, cited article if any) is logged to `chat_logs` for later review.