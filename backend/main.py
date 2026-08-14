import re
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Healthtech Knowledge Base API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Healthtech Knowledge Base API is running"}


@app.get("/db-check")
def db_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"database_connected": True, "result": result.scalar()}


@app.post("/api/v1/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        department=user.department,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/v1/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


@app.post("/api/v1/articles", response_model=schemas.ArticleOut)
def create_article(
    article: schemas.ArticleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("editor", "admin")),
):
    slug = slugify(article.title)

    existing = db.query(models.Article).filter(models.Article.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="An article with a similar title already exists")

    new_article = models.Article(
        title=article.title,
        slug=slug,
        content=article.content,
        category_id=article.category_id,
        author_id=current_user.id,
        product_version=article.product_version,
        status="draft",
    )
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return new_article


@app.get("/api/v1/articles", response_model=list[schemas.ArticleOut])
def list_articles(db: Session = Depends(get_db)):
    return db.query(models.Article).filter(models.Article.status == "published").all()


@app.get("/api/v1/articles/{slug}", response_model=schemas.ArticleOut)
def get_article(slug: str, db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(models.Article.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article.views = article.views + 1
    db.commit()
    db.refresh(article)

    return article


@app.post("/api/v1/articles/{article_id}/publish", response_model=schemas.ArticleOut)
def publish_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article.status = "published"

    audit_entry = models.AuditLog(
        user_id=current_user.id,
        action="publish_article",
        target_type="article",
        target_id=article.id,
        details=f"Published article '{article.title}'",
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(article)
    return article


@app.post("/api/v1/categories", response_model=schemas.CategoryOut)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    slug = slugify(category.name)

    existing = db.query(models.Category).filter(models.Category.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="A category with a similar name already exists")

    new_category = models.Category(
        name=category.name,
        slug=slug,
        description=category.description,
        parent_id=category.parent_id,
    )
    db.add(new_category)
    db.flush()

    audit_entry = models.AuditLog(
        user_id=current_user.id,
        action="create_category",
        target_type="category",
        target_id=new_category.id,
        details=f"Created category '{new_category.name}'",
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(new_category)

    result = schemas.CategoryOut.model_validate(new_category)
    result.article_count = 0
    return result


@app.get("/api/v1/categories", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    output = []
    for cat in categories:
        count = db.query(models.Article).filter(models.Article.category_id == cat.id).count()
        item = schemas.CategoryOut.model_validate(cat)
        item.article_count = count
        output.append(item)
    return output


@app.get("/api/v1/search", response_model=list[schemas.ArticleOut])
def search_articles(q: str, db: Session = Depends(get_db)):
    query = f"%{q.lower()}%"

    title_matches = db.query(models.Article).filter(
        models.Article.status == "published",
        models.Article.title.ilike(query)
    ).all()

    body_matches = db.query(models.Article).filter(
        models.Article.status == "published",
        models.Article.content.ilike(query)
    ).all()

    seen_ids = set()
    results = []
    for article in title_matches + body_matches:
        if article.id not in seen_ids:
            seen_ids.add(article.id)
            results.append(article)

    log_entry = models.SearchLog(query=q, results_count=len(results))
    db.add(log_entry)
    db.commit()

    return results


@app.post("/api/v1/feedback", response_model=schemas.FeedbackOut)
def submit_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if feedback.rating < 1 or feedback.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    article = db.query(models.Article).filter(models.Article.id == feedback.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    new_feedback = models.Feedback(
        article_id=feedback.article_id,
        user_id=current_user.id,
        rating=feedback.rating,
        comment=feedback.comment,
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    return new_feedback


@app.post("/api/v1/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    query = f"%{request.question.lower()}%"

    match = db.query(models.Article).filter(
        models.Article.status == "published",
        models.Article.title.ilike(query)
    ).first()

    if not match:
        words = [w for w in request.question.lower().split() if len(w) > 3]
        for word in words:
            match = db.query(models.Article).filter(
                models.Article.status == "published",
                models.Article.content.ilike(f"%{word}%")
            ).first()
            if match:
                break

    if match:
        answer = f"Based on our knowledge base: {match.content}"
        cited_id = match.id
        cited_title = match.title
        cited_slug = match.slug
    else:
        answer = "I couldn't find an answer to that in our knowledge base. Would you like to escalate this to support?"
        cited_id = None
        cited_title = None
        cited_slug = None

    log_entry = models.ChatLog(
        session_id=request.session_id,
        question=request.question,
        answer=answer,
        cited_article_id=cited_id,
    )
    db.add(log_entry)
    db.commit()

    return schemas.ChatResponse(
        answer=answer,
        cited_article_id=cited_id,
        cited_article_title=cited_title,
        cited_article_slug=cited_slug,
        session_id=request.session_id,
    )


@app.get("/api/v1/stats/public", response_model=schemas.PublicStats)
def public_stats(db: Session = Depends(get_db)):
    total_articles = db.query(models.Article).filter(models.Article.status == "published").count()
    total_categories = db.query(models.Category).count()
    total_feedback = db.query(models.Feedback).count()

    avg_rating_result = db.query(sqlfunc.avg(models.Feedback.rating)).scalar()
    avg_rating = round(float(avg_rating_result), 1) if avg_rating_result else 0.0

    recent_articles_query = (
        db.query(models.Article)
        .filter(models.Article.status == "published")
        .order_by(models.Article.created_at.desc())
        .limit(5)
        .all()
    )
    recent_articles = [
        {"id": a.id, "title": a.title, "slug": a.slug, "views": a.views}
        for a in recent_articles_query
    ]

    top_viewed_query = (
        db.query(models.Article)
        .filter(models.Article.status == "published")
        .order_by(models.Article.views.desc())
        .limit(5)
        .all()
    )
    top_viewed = [
        {"id": a.id, "title": a.title, "slug": a.slug, "views": a.views}
        for a in top_viewed_query
    ]

    categories_query = db.query(models.Category).all()
    categories_breakdown = []
    for cat in categories_query:
        count = db.query(models.Article).filter(
            models.Article.category_id == cat.id,
            models.Article.status == "published",
        ).count()
        categories_breakdown.append({"id": cat.id, "name": cat.name, "article_count": count})

    return schemas.PublicStats(
        total_articles=total_articles,
        total_categories=total_categories,
        total_feedback=total_feedback,
        average_rating=avg_rating,
        recent_articles=recent_articles,
        top_viewed=top_viewed,
        categories_breakdown=categories_breakdown,
    )


@app.get("/api/v1/admin/dashboard", response_model=schemas.DashboardStats)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    total_articles = db.query(models.Article).count()
    published_articles = db.query(models.Article).filter(models.Article.status == "published").count()
    draft_articles = db.query(models.Article).filter(models.Article.status == "draft").count()
    total_users = db.query(models.User).count()
    total_categories = db.query(models.Category).count()

    top_articles_query = db.query(models.Article).order_by(models.Article.views.desc()).limit(5).all()
    top_articles = [{"id": a.id, "title": a.title, "views": a.views} for a in top_articles_query]

    low_rated = (
        db.query(
            models.Article.id,
            models.Article.title,
            sqlfunc.avg(models.Feedback.rating).label("avg_rating")
        )
        .join(models.Feedback, models.Feedback.article_id == models.Article.id)
        .group_by(models.Article.id, models.Article.title)
        .having(sqlfunc.avg(models.Feedback.rating) <= 2)
        .all()
    )
    low_rated_articles = [{"id": a.id, "title": a.title, "avg_rating": float(a.avg_rating)} for a in low_rated]

    recent_searches_query = db.query(models.SearchLog).order_by(models.SearchLog.created_at.desc()).limit(10).all()
    recent_searches = [{"query": s.query, "results_count": s.results_count} for s in recent_searches_query]

    recent_audit_query = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(10).all()
    recent_audit_log = [{"action": a.action, "details": a.details, "user_id": a.user_id} for a in recent_audit_query]

    role_counts_query = db.query(models.User.role, sqlfunc.count(models.User.id)).group_by(models.User.role).all()
    users_by_role = {role: count for role, count in role_counts_query}

    total_chats = db.query(models.ChatLog).count()
    unanswered_chats = db.query(models.ChatLog).filter(models.ChatLog.cited_article_id.is_(None)).count()

    return schemas.DashboardStats(
        total_articles=total_articles,
        published_articles=published_articles,
        draft_articles=draft_articles,
        total_users=total_users,
        total_categories=total_categories,
        top_articles=top_articles,
        low_rated_articles=low_rated_articles,
        recent_searches=recent_searches,
        recent_audit_log=recent_audit_log,
        users_by_role=users_by_role,
        total_chats=total_chats,
        unanswered_chats=unanswered_chats,
    )