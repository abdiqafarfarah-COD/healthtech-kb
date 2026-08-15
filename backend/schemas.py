from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "viewer"
    department: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class ArticleCreate(BaseModel):
    title: str
    content: str
    category_id: Optional[int] = None
    product_version: Optional[str] = None


class ArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    content: str
    category_id: Optional[int] = None
    author_id: int
    status: str
    product_version: Optional[str] = None
    views: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    article_count: int = 0


class FeedbackCreate(BaseModel):
    article_id: int
    rating: int
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    article_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime


class ChatRequest(BaseModel):
    question: str
    session_id: str


class ChatResponse(BaseModel):
    answer: str
    cited_article_id: Optional[int] = None
    cited_article_title: Optional[str] = None
    cited_article_slug: Optional[str] = None
    session_id: str


class PublicStats(BaseModel):
    total_articles: int
    total_categories: int
    total_feedback: int
    average_rating: float
    recent_articles: list[dict]
    top_viewed: list[dict]
    categories_breakdown: list[dict]
    feedback_distribution: dict[str, int]
    recent_feedback: list[dict]


class DashboardStats(BaseModel):
    total_articles: int
    published_articles: int
    draft_articles: int
    total_users: int
    total_categories: int
    top_articles: list[dict]
    low_rated_articles: list[dict]
    recent_searches: list[dict]
    recent_audit_log: list[dict]
    users_by_role: dict[str, int]
    total_chats: int
    unanswered_chats: int
    articles_by_author: list[dict]
    pending_drafts: list[dict]
    chat_volume_by_day: list[dict]