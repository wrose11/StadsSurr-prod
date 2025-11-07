# app/models.py
from sqlalchemy import Column, Integer, String, Text, UniqueConstraint, ForeignKey, JSON
from sqlalchemy.orm import relationship, backref
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    bio = Column(Text, nullable=True)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False) # maps to name
    widget_text = Column(String, nullable=True)
    preamble = Column(String, nullable=True)
    location = Column(String, nullable=True)
    tidplan_html = Column(String, nullable=True) # static name
    phase = Column(String, nullable=True) # maps to current stage
    coordinates = Column(JSON, nullable=False)
    image_url = Column(String, nullable=True) # image url to Stockholm.växer
    url = Column(String, nullable=True) # URL to stockholm.växer
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(String, nullable=False)
    user = relationship("User")
    project = relationship("Project")


class CommentLike(Base):
    __tablename__ = "comment_likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "comment_id", name="unique_user_comment_like"),)

class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_vote_project_user"),)
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vote_type = Column(String, nullable=False)  # 'upvote' or 'downvote'
    
    user = relationship("User")
    project = relationship("Project")

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    phase = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)

    # Vi följer din stil och lagrar ISO-strängar som i Comment.created_at
    consent_at = Column(String, nullable=False)   # t.ex. "2025-10-22T12:34:56.789012"
    created_at = Column(String, nullable=False)

    project = relationship("Project")
    user = relationship("User")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    coordinates = Column(JSON, nullable=True)
    created_at = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    
    user = relationship("User")

class PostComment(Base):
    __tablename__ = "post_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(String, nullable=False)
    
    user = relationship("User")
    post = relationship("Post")

class PostCommentLike(Base):
    __tablename__ = "post_comment_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=False)
    
    __table_args__ = (UniqueConstraint("user_id", "comment_id", name="unique_user_post_comment_like"),)

class PostVote(Base):
    __tablename__ = "post_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vote_type = Column(String, nullable=False)  # 'upvote' or 'downvote'
    
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_vote_post_user"),)
    
    user = relationship("User")
    post = relationship("Post")


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)

    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    source = Column(String, nullable=True)         # e.g. "DN", "SVT"
    date = Column(String, nullable=True)           # ISO date (YYYY-MM-DD) or ISO datetime
    summary = Column(Text, nullable=True)

    created_at = Column(String, default=lambda: datetime.utcnow().isoformat(), nullable=False)

    project = relationship(
        "Project",
        backref=backref("news", cascade="all, delete-orphan")
    )

class UserFollow(Base):
    __tablename__ = "user_follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat(), nullable=False)
    
    __table_args__ = (UniqueConstraint("follower_id", "followed_id", name="uq_user_follow"),)
    
    follower = relationship("User", foreign_keys=[follower_id])
    followed = relationship("User", foreign_keys=[followed_id])