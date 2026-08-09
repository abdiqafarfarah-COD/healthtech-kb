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