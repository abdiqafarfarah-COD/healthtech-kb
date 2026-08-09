from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
from auth import hash_password, verify_password, create_access_token

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