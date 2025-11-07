# app/schemas.py
from pydantic import BaseModel, EmailStr, StringConstraints, HttpUrl, AnyHttpUrl
from typing import Optional, List, Annotated

class RegisterBody(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    bio: str | None = None
    is_following: bool = False

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    bio: str | None = None 

class Coordinates(BaseModel):
    latitude: float
    longitude: float

class ProjectPublic(BaseModel):
    id: int
    title: str
    widget_text: Optional[str] = None
    preamble: Optional[str] = None
    location: Optional[str] = None
    phase: str
    tidplan_html: Optional[str] = None
    comments_count: int = 0
    upvotes: int = 0
    downvotes: int = 0
    user_vote: Optional[str] = None
    image_url: Optional[HttpUrl]
    coordinates: Optional[Coordinates]

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    project_id: int
    content: str
    likes: int=0

class CommentPublic(BaseModel):
    id: int
    project_id: int
    user_id: int
    content: str
    created_at: str
    user_name: str
    likes: int=0

    class Config:
        from_attributes = True

class VoteCreate(BaseModel):
    project_id: int
    vote_type: str  # 'upvote' or 'downvote'

class ConsultationCreate(BaseModel):
    project_id: int
    phase: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    content: Annotated[str, StringConstraints(min_length=3, max_length=5000)]

class ConsultationPublic(BaseModel):
    id: int
    project_id: int
    user_id: int
    phase: str
    content: str
    consent_at: str
    created_at: str

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)]
    content: Annotated[str, StringConstraints(min_length=10, max_length=5000)]
    image_url: Optional[str] = None
    coordinates: Optional[Coordinates] = None

class PostCommentCreate(BaseModel):
    post_id: int
    content: Annotated[str, StringConstraints(min_length=1, max_length=2000)]

class PostVoteCreate(BaseModel):
    post_id: int
    vote_type: str  # 'upvote' or 'downvote'

class NewsArticleOut(BaseModel):
    title: str
    url: AnyHttpUrl
    source: Optional[str] = None
    date: Optional[str] = None      # ISO
    summary: Optional[str] = None

    model_config = {"from_attributes": True}  # Pydantic v2

class NewsArticleCreate(BaseModel):
    title: str
    url: AnyHttpUrl
    source: Optional[str] = None
    date: Optional[str] = None
    summary: Optional[str] = None

class FollowerPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    bio: str | None = None
    is_following: bool = False
    
    class Config:
        from_attributes = True

class PostPublic(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    created_at: str
    user_id: int
    user_name: str
    upvotes: int = 0
    downvotes: int = 0
    comments_count: int = 0
    user_vote: Optional[str] = None
    
    class Config:
        from_attributes = True