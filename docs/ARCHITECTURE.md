# System Architecture — Healthtech Knowledge Base & HMIS Chatbot Widget

```mermaid
flowchart TB
    subgraph Client_Apps["Client Applications"]
        KBApp["KB Web App (React)<br/>Search, Articles, Admin Dashboard"]
        Widget["Chat Widget (React, embedded via script/iframe)"]
        HMIS["External HMIS App<br/>(mock page, hosts the widget)"]
    end

    HMIS -->|"embeds via script tag / iframe"| Widget

    subgraph Backend["Backend (FastAPI)"]
        Auth["Auth Service<br/>JWT login, RBAC middleware"]
        ArticlesAPI["Articles API<br/>CRUD + versioning"]
        SearchAPI["Search API<br/>full-text search + ranking"]
        ChatAPI["Chat API (/api/v1/chat)<br/>retrieves KB content, returns grounded answer"]
        FeedbackAPI["Feedback API"]
    end

    subgraph Data["Data Layer"]
        DB[("PostgreSQL<br/>users, articles, categories,<br/>tags, feedback, media, logs")]
    end

    KBApp -->|"HTTPS + JWT"| Auth
    KBApp -->|"HTTPS + JWT"| ArticlesAPI
    KBApp -->|"HTTPS"| SearchAPI
    KBApp -->|"HTTPS"| FeedbackAPI

    Widget -->|"HTTPS (CORS-enabled)"| ChatAPI

    Auth --> DB
    ArticlesAPI --> DB
    SearchAPI --> DB
    ChatAPI --> DB
    FeedbackAPI --> DB

    ChatAPI -->|"cites source article"| ArticlesAPI
```

## CORS Flow Notes
- The Widget is loaded inside the HMIS app's origin (a different domain than the KB backend).
- The FastAPI backend must explicitly allow the HMIS app's origin in its CORS configuration (`allow_origins`) so the browser permits the Widget to call `ChatAPI`.
- Only the Chat API and read-only endpoints needed by the widget are exposed to the external origin; admin endpoints remain restricted to the KB App's own origin.

## Auth Flow Notes
- Login issues a JWT (JSON Web Token) containing the user's id and role.
- Every protected request sends this JWT in the `Authorization: Bearer <token>` header.
- RBAC middleware on the backend checks the role in the JWT before allowing access to Editor/Admin routes.
- Sessions expire after 8 hours of inactivity (per PRD FR-3.5).