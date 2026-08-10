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