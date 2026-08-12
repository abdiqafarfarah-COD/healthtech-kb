import re
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Healthtech Knowledge Base API")


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