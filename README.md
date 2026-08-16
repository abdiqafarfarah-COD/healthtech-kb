# Healthtech Knowledge Base & Embedded HMIS Chatbot

A centralized knowledge base for troubleshooting documentation, paired with a lightweight, embeddable chatbot widget that healthcare workers can use to query the knowledge base directly from within external clinical applications (e.g. an HMIS).

Built as a full-stack capstone project.

## Live Deployment

- **Frontend:** https://healthtech-kb-frontend-u83w.onrender.com
- **Backend API docs:** https://healthtech-kb-backend-7d64.onrender.com/docs

Note: both services run on Render's free tier. The backend spins down after periods of inactivity, so the first request after idle time may take up to 50 seconds to respond while it wakes up.

### Test Accounts (Live)

| Name | Role | Email | Password |
|---|---|---|---|
| Amina Hassan | viewer | amina@example.com | SecurePass123 |
| David Mwangi | editor | david@example.com | EditorPass123 |
| Grace Wanjiru | admin | grace@example.com | AdminPass123 |

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Recharts
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL, SQLAlchemy ORM
- **Auth:** JWT (python-jose), bcrypt password hashing
- **Containerization:** Docker, Docker Compose
- **Deployment:** Render (backend as a Docker web service, frontend as a static site, managed PostgreSQL)

## Project Structure

```
healthtech-kb/
  backend/
    main.py           - FastAPI app, all API routes
    models.py         - SQLAlchemy database models
    schemas.py        - Pydantic request/response schemas
    auth.py           - JWT, password hashing, RBAC dependency
    database.py       - Database engine/session setup
    Dockerfile
    .dockerignore
    requirements.txt
    .env               (local secrets, not committed)
  frontend/
    src/
      pages/           - Home, Login, Register, ArticleView, Editor,
                          AdminDashboard, CategoryManager, MockHMIS
      components/       - Navbar, ChatWidget, ProtectedRoute
      context/          - AuthContext (login state)
      services/         - api.js (Axios instance with auth interceptor)
    Dockerfile
    nginx.conf
    .dockerignore
  docs/
    ERD.md                    - Database entity-relationship diagram
    ARCHITECTURE.md           - System architecture diagram
    API_CONTRACT.md           - Full endpoint documentation
    postman_collection.json   - Importable Postman collection
  docker-compose.yml   - Runs both services together locally
```

## Features

- **Authentication and RBAC** - JWT-based login/register with three roles: viewer, editor, admin
- **Knowledge base articles** - create (draft), publish, search, and view articles with category organization
- **Full-text search** - searches article titles and content, logs every query
- **Feedback** - logged-in users can rate articles 1-5 with an optional comment
- **Homepage dashboard** - sidebar/center/right-panel layout with live stats, category filtering, a category-distribution pie chart, most-viewed articles, and a feedback-trends bar chart
- **Admin dashboard** - sidebar/center/right-panel layout with content stats, users by role, chatbot activity, a productivity bar chart (articles by author), a 7-day chat-volume line chart, drafts awaiting publish, top/low-rated articles, recent searches, and audit log
- **Category management** - admins can create nested categories, with a summary panel showing the largest category and categories needing content
- **Embeddable chatbot widget** - floating chat bubble that answers questions by matching against published articles, cites its source, and gracefully falls back with an escalation offer when no match is found
- **Mock HMIS demo page** (`/hmis-demo`) - a separately styled mock external application demonstrating the chat widget embedded outside the KB's own UI

## Running Locally

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a .env file inside backend/ with:
```
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/healthtech_kb
SECRET_KEY=<a long random string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

Then run:
```
python -m uvicorn main:app --reload
```

API docs available at http://127.0.0.1:8000/docs

### Frontend

```
cd frontend
npm install
npm run dev
```

App available at http://localhost:5173

### Running with Docker Compose

From the project root, with a local PostgreSQL server running:

```
docker compose up --build
```

Frontend available at http://127.0.0.1:8080, backend at http://127.0.0.1:8000.

## Test Accounts (Local)

| Name | Role | Email | Password |
|---|---|---|---|
| Amina Hassan | viewer | amina@example.com | SecurePass123 |
| David Mwangi | editor | david@example.com | EditorPass123 |
| Grace Wanjiru | admin | grace@example.com | AdminPass123 |

## Documentation

See the docs/ folder for the database ERD, system architecture diagram, full API contract, and an importable Postman collection.