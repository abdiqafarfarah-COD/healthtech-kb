# Entity-Relationship Diagram — Healthtech Knowledge Base

```mermaid
erDiagram
    USERS ||--o{ ARTICLES : authors
    USERS ||--o{ FEEDBACK : submits
    USERS ||--o{ SEARCH_LOGS : generates
    USERS ||--o{ CHAT_LOGS : starts
    USERS ||--o{ AUDIT_LOGS : performs
    CATEGORIES ||--o{ ARTICLES : contains
    ARTICLES ||--o{ ARTICLE_TAGS : has
    TAGS ||--o{ ARTICLE_TAGS : has
    ARTICLES ||--o{ FEEDBACK : receives
    ARTICLES ||--o{ MEDIA : includes
    ARTICLES ||--o{ CHAT_LOGS : cited_in

    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role
        string department
        datetime created_at
    }

    ARTICLES {
        int id PK
        string title
        string slug
        text content
        int category_id FK
        int author_id FK
        string status
        string product_version
        datetime created_at
        datetime updated_at
        int views
    }

    CATEGORIES {
        int id PK
        string name
        string slug
        int parent_id FK
        string description
    }

    TAGS {
        int id PK
        string name
        string slug
    }

    ARTICLE_TAGS {
        int article_id FK
        int tag_id FK
    }

    FEEDBACK {
        int id PK
        int article_id FK
        int user_id FK
        int rating
        string comment
        datetime created_at
    }

    MEDIA {
        int id PK
        int article_id FK
        string filename
        string url
        string type
        int uploaded_by FK
    }

    SEARCH_LOGS {
        int id PK
        string query
        int results_count
        int user_id FK
        datetime created_at
    }

    CHAT_LOGS {
        int id PK
        int user_id FK
        string session_id
        text question
        text answer
        int cited_article_id FK
        boolean helpful
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string target_type
        int target_id
        string details
        datetime created_at
    }
```

**Note:** `tags`, `article_tags`, and `media` tables exist in the schema but do not yet have corresponding API endpoints or frontend UI. They are reserved for future iterations beyond the current capstone scope.