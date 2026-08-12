from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "viewer"
    department: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    department: Optional[str] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class ArticleCreate(BaseModel):
    title: str
    content: str
    category_id: Optional[int] = None
    product_version: Optional[str] = None


class ArticleOut(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    status: str
    category_id: Optional[int] = None
    author_id: Optional[int] = None

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: Optional[int] = None
    description: Optional[str] = None
    article_count: int = 0

    class Config:
        from_attributes = True