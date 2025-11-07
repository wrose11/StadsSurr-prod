# app/main.py
from fastapi import FastAPI, HTTPException, Depends, Cookie, Response, Request, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import OperationalError
from pydantic import BaseModel, EmailStr
import logging
import json
import os
from datetime import datetime, timedelta
from typing import Optional, List
from jose import jwt, JWTError

from .database import Base, engine, SessionLocal
from .models import User, Project, Comment, Vote, CommentLike, Consultation, Post, PostComment, PostCommentLike, PostVote, NewsArticle, UserFollow
from .schemas import RegisterBody, LoginBody, UserPublic, CommentCreate, UserUpdate, VoteCreate, ConsultationCreate, ConsultationPublic, PostCreate, PostCommentCreate, PostVoteCreate, NewsArticleOut, NewsArticleCreate, FollowerPublic, PostPublic
from .auth import hash_password, verify_password
from .settings import settings


logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("stadsurr")

# ---- Loaders----------

def load_projects_from_json(db: Session):
    json_path = os.path.join(os.path.dirname(__file__), "..", "data_scraped", "projects.json")

    if not os.path.exists(json_path):
        print(f"⚠️  projects.json not found at {json_path}")
        return
    
    with open(json_path, "r", encoding="utf-8") as f:
        projects_data = json.load(f)

    for proj in projects_data:
        new_project = Project(
            title=proj["name"],
            widget_text=proj.get("widget_text"),
            preamble=proj.get("preamble"),
            location=proj.get("location"),
            phase=proj.get("current_stage"),
            tidplan_html=proj.get("tidplan_html"),
            coordinates=proj.get("coordinates"),
            image_url=proj.get("image_url"),
            url=proj.get("url"),
            upvotes=proj.get("upvotes", 0),
            downvotes=proj.get("downvotes",0)
        )
        db.add(new_project)
    db.commit()
    log.info(f"✅ Loaded {len(projects_data)} projects into the database.")


def load_users_from_json(db: Session):
    json_path = os.path.join(os.path.dirname(__file__), "..", "mock_data", "users.json")
    if not os.path.exists(json_path):
        log.warning(f"⚠️  users.json not found at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        users = json.load(f)

    inserted = 0
    for u in users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                name=u["name"],
                email=u["email"],
                password_hash=hash_password(u["email"]),  # mock
            )
            db.add(user)
            inserted += 1

    if inserted:
        db.commit()
        log.info(f"✅ Loaded {inserted} users from JSON")


def load_comments_from_json(db: Session):
    json_path = os.path.join(os.path.dirname(__file__), "..", "mock_data", "comments.json")
    if not os.path.exists(json_path):
        log.warning(f"⚠️  comments.json not found at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        comments = json.load(f)

    for c in comments:
        project = db.query(Project).filter(Project.title == c["project_title"]).first()
        user = db.query(User).filter(User.email == c["user_email"]).first()
        if not project or not user:
            continue

        exists = db.query(Comment).filter(
            Comment.project_id == project.id,
            Comment.user_id == user.id,
            Comment.content == c["content"]
        ).first()

        if exists:
            continue

        comment = Comment(
            project_id=project.id,
            user_id=user.id,
            content=c["content"],
            created_at=c["created_at"],
        )
        db.add(comment)
        db.flush()

        if c.get("likes", 0) > 0:
            users = db.query(User).all()
            for i, u in enumerate(users[:c["likes"]]):
                db.add(CommentLike(user_id=u.id, comment_id=comment.id))

    
    db.commit()
    log.info(f"✅ Loaded {len(comments)} comments from JSON")


def load_posts_from_json(db: Session):
    json_path = os.path.join(os.path.dirname(__file__), "..", "mock_data", "posts.json")
    if not os.path.exists(json_path):
        log.warning(f"⚠️  posts.json not found at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        posts = json.load(f)

    inserted = 0
    for p in posts:
        user = db.query(User).filter(User.email == p["user_email"]).first()
        if not user:
            log.warning(f"⚠️  User with email {p['user_email']} not found, skipping post")
            continue

        # Check if post already exists (by title and user)
        existing = db.query(Post).filter(
            Post.title == p["title"],
            Post.user_id == user.id
        ).first()
        
        if existing:
            continue

        post = Post(
            title=p["title"],
            content=p["content"],
            user_id=user.id,
            created_at=p["created_at"],
            coordinates=p.get("coordinates"),
            image_url=p.get("image_url"),
            upvotes=0,
            downvotes=0
        )
        db.add(post)
        inserted += 1

    if inserted:
        db.commit()
        log.info(f"✅ Loaded {inserted} posts from JSON")


def load_news_from_json(db: Session):
    path = os.path.join(os.path.dirname(__file__), "..", "mock_data", "news.json")
    if not os.path.exists(path):
        log.warning(f"news.json not found at {path}")
        return

    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)

    for it in items:
        db.add(NewsArticle(
            project_id=it["project_id"],
            title=it["title"].strip(),
            url=it["url"],
            source=it.get("source"),
            date=it.get("date"),
            summary=it.get("summary"),
        ))
    db.commit()
    log.info(f"✅ Loaded {len(items)} news items from JSON")

# ----- Lifespan-------------------

@asynccontextmanager
async def lifespann(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            has_projects = db.query(Project).first()
            if has_projects:
                log.info("ℹ️ Database already initialized — skipping JSON import.")
            else:
                log.info("🆕 No database found — initializing from JSON...")
                load_projects_from_json(db)
                load_users_from_json(db)
                load_comments_from_json(db)
                load_posts_from_json(db)
                load_news_from_json(db)
        except OperationalError as e:
            log.error(f"⚠️ Database error: {e}. Recreating DB...")
            Base.metadata.create_all(bind=engine)
            load_projects_from_json(db)
            load_users_from_json(db)
            load_comments_from_json(db)
            load_posts_from_json(db)
            load_news_from_json(db)
        finally:
            db.close()  
    except Exception as e:
        log.error(f"❌ Critical startup error: {e}")
    yield

# ---- APP---------
app = FastAPI(title="StadsSurr API", lifespan=lifespann)

#CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",                    # Local dev
        "https://stadssurr.onrender.com",         # Replace with your production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
# --------DB ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Helper Function ---------
# Get current user from session (simple version without JWT for now)
# def get_current_user_id(user_id: Optional[str] = Cookie(None)) -> Optional[int]:
#     if user_id:
#         try:
#             return int(user_id)
#         except:
#             return None
#     return None

# JWT token functions
def create_access_token(user_id: int) -> str:
    """Generate JWT token for user"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return token

def verify_access_token(token: str) -> Optional[int]:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except JWTError:
        return None

def get_current_user_id(request: Request, user_id_cookie: Optional[str] = Cookie(None, alias="user_id")) -> Optional[int]:
    """Check both JWT token (Authorization header) and cookie for user_id"""
    
    # Try JWT token first (Authorization: Bearer <token>)
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
        user_id = verify_access_token(token)
        if user_id:
            log.info(f"✅ Authenticated via JWT: user_id={user_id}")
            return user_id
        log.warning("⚠️ Invalid JWT token in Authorization header")
    
    # Fallback to cookie
    has_cookie = user_id_cookie is not None
    all_cookies = request.cookies
    log.info(f"🍪 Cookie check: has_user_id={has_cookie}, all_cookies={list(all_cookies.keys())}, user_id_value={user_id_cookie}")
    
    if user_id_cookie:
        try:
            user_id = int(user_id_cookie)
            log.info(f"✅ Authenticated via cookie: user_id={user_id}")
            return user_id
        except Exception as e:
            log.error(f"❌ Failed to parse user_id cookie: {e}")
            return None
    
    log.warning("⚠️ No user_id found in JWT or cookie")
    return None

#-------------- Routes---------------------------

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/auth/register", response_model=UserPublic)
def register(body: RegisterBody, request: Request, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()

    # Duplicate check
    exists = db.query(User).filter(User.email == email).first()
    if exists:
        raise HTTPException(status_code=400, detail="E-post används redan")

    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),  # hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-login: Set user_id cookie with origin-aware security settings
    origin = request.headers.get("origin", "")
    is_localhost = "localhost" in origin or "127.0.0.1" in origin
    
    response.set_cookie(
        key="user_id",
        value=str(user.id),
        httponly=True,
        secure=not is_localhost,
        samesite="lax" if is_localhost else "none",
        max_age=60*60*24*7,  # 7 days
        path="/",  # Explicit path
        domain=None,  # Let browser set domain automatically
    )
    
    log.info(f"🍪 REGISTER: Set cookie for user_id={user.id}, secure={not is_localhost}, samesite={'lax' if is_localhost else 'none'}")

    # Generate JWT token
    access_token = create_access_token(user.id)
    
    log.info("REGISTER ok: id=%s name=%r email=%r", user.id, user.name, user.email)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/login")
def login(body: LoginBody, request: Request, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(body.password, user.password_hash):
        log.info("LOGIN fail: email=%r", email)
        raise HTTPException(status_code=401, detail="Fel e-post eller lösenord")

    # Set user_id cookie with origin-aware security settings
    # Check if request is from localhost (HTTP) or production (HTTPS)
    origin = request.headers.get("origin", "")
    is_localhost = "localhost" in origin or "127.0.0.1" in origin
    
    # For localhost: secure=False, samesite="lax"
    # For HTTPS: secure=True, samesite="none" (required for cross-site)
    response.set_cookie(
        key="user_id",
        value=str(user.id),
        httponly=True,
        secure=not is_localhost,  # True for HTTPS, False for localhost
        samesite="lax" if is_localhost else "none",  # "lax" for localhost, "none" for cross-site HTTPS
        max_age=60*60*24*7,  # 7 days
        path="/",  # Explicit path
        domain=None,  # Let browser set domain automatically
    )
    
    # Generate JWT token
    access_token = create_access_token(user.id)
    
    log.info(f"🍪 LOGIN ok: id={user.id} name={user.name!r} email={user.email!r}, secure={not is_localhost}, samesite={'lax' if is_localhost else 'none'}")
    return {
        "ok": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    # Delete cookie with origin-aware parameters to ensure proper deletion
    origin = request.headers.get("origin", "")
    is_localhost = "localhost" in origin or "127.0.0.1" in origin
    
    response.delete_cookie(
        key="user_id",
        path="/",
        secure=not is_localhost,
        samesite="lax" if is_localhost else "none"
    )
    return {"ok": True}

# GeoJSON endpoint
@app.get("/api/projects/geojson")
def projects_geojson(phase: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    
    # Filter by phase if provided
    if phase:
        query = query.filter(Project.phase == phase)
    
    projects = query.all()
    features = []
    for project in projects:
        if not project.coordinates:
            continue
        lng = project.coordinates.get('longitude')
        lat = project.coordinates.get('latitude')
        
        if lng is None or lat is None:
            continue
    
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "id": project.id,
                "title": project.title,
                "phase": project.phase,
                "location": project.location,
                "widget_text": project.widget_text,
                "thumbnail": project.image_url if project.image_url else None
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }


#likes endopoint
@app.post("/api/comments/{comment_id}/like")
def toggle_comment_like(comment_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user_id)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att gilla en kommentar")

    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Users cannot like their own comments
    if comment.user_id == current_user:
        raise HTTPException(status_code=400, detail="Du kan inte gilla din egen kommentar")

    existing_like = (
        db.query(CommentLike)
        .filter(CommentLike.comment_id == comment_id, CommentLike.user_id == current_user)
        .first()
    )

    if existing_like:
        # Unlike (remove)
        db.delete(existing_like)
        db.commit()
        like_count = db.query(CommentLike).filter(CommentLike.comment_id == comment_id).count()
        return {"liked": False, "likes": like_count}
    else:
        # Add new like
        new_like = CommentLike(user_id=current_user, comment_id=comment_id)
        db.add(new_like)
        db.commit()
        like_count = db.query(CommentLike).filter(CommentLike.comment_id == comment_id).count()
        return {"liked": True, "likes": like_count}

# Projects endpoints
@app.get("/api/projects")
def get_projects(db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    projects = db.query(Project).all()
    result = []
    for project in projects:
        comments_count = db.query(Comment).filter(Comment.project_id == project.id).count()
        upvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "upvote").count()
        downvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "downvote").count()
        
        user_vote = None
        if user_id:
            vote = db.query(Vote).filter(Vote.project_id == project.id, Vote.user_id == user_id).first()
            if vote:
                user_vote = vote.vote_type
        
        # Safely extract coordinates (may be None)
        lng = None
        lat = None
        if project.coordinates:
            lng = project.coordinates.get('longitude')
            lat = project.coordinates.get('latitude')

        result.append({
            "id": project.id,
            "title": project.title,
            "description": project.preamble,
            "location": project.location,
            "phase": project.phase,
            "comments_count": comments_count,
            "upvotes": upvotes,
            "downvotes": downvotes,
            "user_vote": user_vote,
            "latitude": lat,
            "longitude": lng,
            "images": project.image_url,
        })
    return result

@app.get("/api/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    comments_count = db.query(Comment).filter(Comment.project_id == project.id).count()
    upvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "upvote").count()
    downvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "downvote").count()
    
    user_vote = None
    if user_id:
        vote = db.query(Vote).filter(Vote.project_id == project.id, Vote.user_id == user_id).first()
        if vote:
            user_vote = vote.vote_type
    
    # Safely extract coordinates (may be None)
    lng = None
    lat = None
    if project.coordinates:
        lng = project.coordinates.get('longitude')
        lat = project.coordinates.get('latitude')
    
    return {
        "id": project.id,
        "title": project.title,
        "location": project.location,
        "description": project.preamble,
        "phase": project.phase,
        "comments_count": comments_count,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "user_vote": user_vote,
        "latitude": lat,
        "longitude": lng,
        "images": project.image_url,
        "tidplan_html": project.tidplan_html,
        "url": project.url

    }

@app.get("/api/projects/{project_id}/comments")
def get_comments(project_id: int, db: Session = Depends(get_db), current_user: Optional[int]=Depends(get_current_user_id)):
    comments = db.query(Comment).filter(Comment.project_id == project_id).order_by(Comment.created_at.desc()).all()
    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()

        like_count = db.query(CommentLike).filter(CommentLike.comment_id == comment.id).count()
        
        liked_by_user = False
        if current_user:
            liked_by_user = (
                db.query(CommentLike)
                .filter(CommentLike.comment_id == comment.id, CommentLike.user_id == current_user)
                .first()
                is not None
            )

        result.append({
            "id": comment.id,
            "project_id": comment.project_id,
            "user_id": comment.user_id,
            "user_name": user.name if user else "Unknown",
            "content": comment.content,
            "created_at": comment.created_at,
            "likes": like_count,
            "liked_by_user": liked_by_user
        })
    return result

@app.post("/api/comments")
def create_comment(body: CommentCreate, db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att kommentera")
    
    project = db.query(Project).filter(Project.id == body.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    comment = Comment(
        project_id=body.project_id,
        user_id=user_id,
        content=body.content.strip(),
        created_at=datetime.now().isoformat(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    user = db.query(User).filter(User.id == user_id).first()
    return {
        "id": comment.id,
        "project_id": comment.project_id,
        "user_id": comment.user_id,
        "user_name": user.name if user else "Unknown",
        "content": comment.content,
        "created_at": comment.created_at,
    }

@app.post("/api/votes")
def create_vote(body: VoteCreate, db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att rösta")
    
    if body.vote_type not in ["upvote", "downvote"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    project = db.query(Project).filter(Project.id == body.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user already voted
    existing_vote = db.query(Vote).filter(Vote.project_id == body.project_id, Vote.user_id == user_id).first()
    
    if existing_vote:
        if existing_vote.vote_type == body.vote_type:
            # Remove vote if clicking same button
            db.delete(existing_vote)
            db.commit()
            return {"ok": True, "action": "removed"}
        else:
            # Change vote
            existing_vote.vote_type = body.vote_type
            db.commit()
            return {"ok": True, "action": "changed"}
    else:
        # New vote
        vote = Vote(
            project_id=body.project_id,
            user_id=user_id,
            vote_type=body.vote_type,
        )
        db.add(vote)
        db.commit()
        return {"ok": True, "action": "created"}


@app.get("/api/users/{user_id}/activity")
def get_user_activity(user_id: int, db: Session = Depends(get_db)):
    """Get all projects a user has commented on or voted for"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get projects with comments
    commented_project_ids = db.query(Comment.project_id).filter(Comment.user_id == user_id).distinct().all()
    commented_ids = [pid[0] for pid in commented_project_ids]
    
    # Get projects with votes
    voted_project_ids = db.query(Vote.project_id).filter(Vote.user_id == user_id).distinct().all()
    voted_ids = [pid[0] for pid in voted_project_ids]
    
    # Combine unique project IDs
    all_project_ids = list(set(commented_ids + voted_ids))
    
    # Fetch full project details
    projects = db.query(Project).filter(Project.id.in_(all_project_ids)).all()
    
    result = []
    for project in projects:
        comments_count = db.query(Comment).filter(Comment.project_id == project.id).count()
        upvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "upvote").count()
        downvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "downvote").count()
        
        user_vote = None
        vote = db.query(Vote).filter(Vote.project_id == project.id, Vote.user_id == user_id).first()
        if vote:
            user_vote = vote.vote_type
        
        user_comment_count = db.query(Comment).filter(Comment.project_id == project.id, Comment.user_id == user_id).count()
        
        lng = project.coordinates.get('longitude') if project.coordinates else None
        lat = project.coordinates.get('latitude') if project.coordinates else None
        
        result.append({
            "id": project.id,
            "title": project.title,
            "description": project.preamble,
            "location": project.location,
            "phase": project.phase,
            "comments_count": comments_count,
            "upvotes": upvotes,
            "downvotes": downvotes,
            "user_vote": user_vote,
            "user_comment_count": user_comment_count,
            "latitude": lat,
            "longitude": lng,
            "images": project.image_url,
        })
    
    # Count followers
    followers_count = db.query(UserFollow).filter(UserFollow.followed_id == user_id).count()
    
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "bio": user.bio,
            "followers_count": followers_count
        },
        "projects": result
    }


@app.post("/api/users/{user_id}/bio", response_model=UserPublic)
def update_user_bio(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):

    if not current_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Du måste vara inloggad")

    if current_user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Du får inte uppdatera någon annans profil")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.bio = data.bio
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/projects/{project_id}/consultations", response_model=ConsultationPublic, status_code=201)
def create_consultation(
    project_id: int,
    body: ConsultationCreate,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att lämna synpunkter")

    if body.project_id != project_id:
        raise HTTPException(status_code=400, detail="project_id i body måste matcha :project_id i URL")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content får inte vara tomt")

    now_iso = datetime.now().isoformat()

    c = Consultation(
        project_id=project_id,
        user_id=user_id,
        phase=body.phase,
        content=content,
        consent_at=now_iso,
        created_at=now_iso,
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    return c

@app.get("/api/projects/{project_id}/news", response_model=List[NewsArticleOut])
def list_project_news(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    items = (
        db.query(NewsArticle)
        .filter(NewsArticle.project_id == project_id)
        .order_by(NewsArticle.date.desc().nullslast(), NewsArticle.id.desc())
        .all()
    )
    return items

# admin/seed endpoint for dev
@app.post("/api/projects/{project_id}/news", response_model=NewsArticleOut)
def create_project_news(project_id: int, body: NewsArticleCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    item = NewsArticle(
        project_id=project_id,
        title=body.title.strip(),
        url=str(body.url),
        source=(body.source or None),
        date=(body.date or None),
        summary=(body.summary or None),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

# ============= POSTS ENDPOINTS =============

@app.get("/api/posts")
def get_posts(db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    result = []
    
    for post in posts:
        author = db.query(User).filter(User.id == post.user_id).first()
        comments_count = db.query(PostComment).filter(PostComment.post_id == post.id).count()
        upvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "upvote").count()
        downvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "downvote").count()
        
        user_vote = None
        if user_id:
            vote = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.user_id == user_id).first()
            if vote:
                user_vote = vote.vote_type
        
        lng = None
        lat = None
        if post.coordinates:
            lng = post.coordinates.get('longitude')
            lat = post.coordinates.get('latitude')
        
        result.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "author_id": post.user_id,
            "author_name": author.name if author else "Unknown",
            "comments_count": comments_count,
            "upvotes": upvotes,
            "downvotes": downvotes,
            "user_vote": user_vote,
            "latitude": lat,
            "longitude": lng,
        })
    
    return result

@app.get("/api/posts/geojson")
def posts_geojson(db: Session = Depends(get_db)):
    posts = db.query(Post).all()
    features = []
    
    for post in posts:
        if not post.coordinates:
            continue
        lng = post.coordinates.get('longitude')
        lat = post.coordinates.get('latitude')
        
        if lng is None or lat is None:
            continue
        
        author = db.query(User).filter(User.id == post.user_id).first()
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "id": post.id,
                "title": post.title,
                "author_name": author.name if author else "Unknown",
                "created_at": post.created_at,
                "thumbnail": post.image_url if post.image_url else None
            }
        }
        features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

@app.get("/api/posts/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    author = db.query(User).filter(User.id == post.user_id).first()
    comments_count = db.query(PostComment).filter(PostComment.post_id == post.id).count()
    upvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "upvote").count()
    downvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "downvote").count()
    
    user_vote = None
    if user_id:
        vote = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.user_id == user_id).first()
        if vote:
            user_vote = vote.vote_type
    
    lng = None
    lat = None
    if post.coordinates:
        lng = post.coordinates.get('longitude')
        lat = post.coordinates.get('latitude')
    
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "image_url": post.image_url,
        "created_at": post.created_at,
        "author_id": post.user_id,
        "author_name": author.name if author else "Unknown",
        "comments_count": comments_count,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "user_vote": user_vote,
        "latitude": lat,
        "longitude": lng,
    }

@app.post("/api/posts", status_code=201)
def create_post(body: PostCreate, db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att skapa ett inlägg")
    
    coords_dict = body.coordinates.model_dump() if body.coordinates else None

    post = Post(
        title=body.title.strip(),
        content=body.content.strip(),
        image_url=body.image_url,
        coordinates=coords_dict,
        created_at=datetime.now().isoformat(),
        user_id=user_id,
        upvotes=0,
        downvotes=0,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    
    author = db.query(User).filter(User.id == user_id).first()
    
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "image_url": post.image_url,
        "created_at": post.created_at,
        "author_id": post.user_id,
        "author_name": author.name if author else "Unknown",
    }

@app.get("/api/posts/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(get_db), current_user: Optional[int] = Depends(get_current_user_id)):
    comments = db.query(PostComment).filter(PostComment.post_id == post_id).order_by(PostComment.created_at.desc()).all()
    result = []
    
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        like_count = db.query(PostCommentLike).filter(PostCommentLike.comment_id == comment.id).count()
        
        liked_by_user = False
        if current_user:
            liked_by_user = (
                db.query(PostCommentLike)
                .filter(PostCommentLike.comment_id == comment.id, PostCommentLike.user_id == current_user)
                .first()
                is not None
            )
        
        result.append({
            "id": comment.id,
            "post_id": comment.post_id,
            "user_id": comment.user_id,
            "user_name": user.name if user else "Unknown",
            "content": comment.content,
            "created_at": comment.created_at,
            "likes": like_count,
            "liked_by_user": liked_by_user
        })
    
    return result

@app.post("/api/posts/{post_id}/comments")
def create_post_comment(post_id: int, body: PostCommentCreate, db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att kommentera")
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = PostComment(
        post_id=post_id,
        user_id=user_id,
        content=body.content.strip(),
        created_at=datetime.now().isoformat(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    user = db.query(User).filter(User.id == user_id).first()
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "user_id": comment.user_id,
        "user_name": user.name if user else "Unknown",
        "content": comment.content,
        "created_at": comment.created_at,
    }

@app.post("/api/post-comments/{comment_id}/like")
def toggle_post_comment_like(comment_id: int, db: Session = Depends(get_db), current_user: Optional[int] = Depends(get_current_user_id)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att gilla en kommentar")
    
    comment = db.query(PostComment).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id == current_user:
        raise HTTPException(status_code=400, detail="Du kan inte gilla din egen kommentar")
    
    existing_like = (
        db.query(PostCommentLike)
        .filter(PostCommentLike.comment_id == comment_id, PostCommentLike.user_id == current_user)
        .first()
    )
    
    if existing_like:
        db.delete(existing_like)
        db.commit()
        like_count = db.query(PostCommentLike).filter(PostCommentLike.comment_id == comment_id).count()
        return {"liked": False, "likes": like_count}
    else:
        new_like = PostCommentLike(user_id=current_user, comment_id=comment_id)
        db.add(new_like)
        db.commit()
        like_count = db.query(PostCommentLike).filter(PostCommentLike.comment_id == comment_id).count()
        return {"liked": True, "likes": like_count}

@app.post("/api/posts/{post_id}/vote")
def vote_on_post(post_id: int, body: PostVoteCreate, db: Session = Depends(get_db), user_id: Optional[int] = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att rösta")
    
    if body.vote_type not in ["upvote", "downvote"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_vote = db.query(PostVote).filter(PostVote.post_id == post_id, PostVote.user_id == user_id).first()
    
    if existing_vote:
        if existing_vote.vote_type == body.vote_type:
            db.delete(existing_vote)
            db.commit()
            return {"ok": True, "action": "removed"}
        else:
            existing_vote.vote_type = body.vote_type
            db.commit()
            return {"ok": True, "action": "changed"}
    else:
        vote = PostVote(
            post_id=post_id,
            user_id=user_id,
            vote_type=body.vote_type,
        )
        db.add(vote)
        db.commit()
        return {"ok": True, "action": "created"}

@app.get("/api/users/{user_id}/posts")
def get_user_posts(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = db.query(Post).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).all()
    result = []
    
    for post in posts:
        comments_count = db.query(PostComment).filter(PostComment.post_id == post.id).count()
        upvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "upvote").count()
        downvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "downvote").count()
        
        result.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "comments_count": comments_count,
            "upvotes": upvotes,
            "downvotes": downvotes,
        })
    
    return result

# ============= FOLLOW ENDPOINTS =============

@app.post("/api/users/{user_id}/follow")
def api_follow_user(user_id: int, db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad för att följa användare")
    
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Du kan inte följa dig själv")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    existing_follow = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user_id,
        UserFollow.followed_id == user_id
    ).first()
    
    if existing_follow:
        raise HTTPException(status_code=400, detail="Du följer redan denna användare")
    
    follow = UserFollow(
        follower_id=current_user_id,
        followed_id=user_id,
        created_at=datetime.now().isoformat()
    )
    db.add(follow)
    db.commit()
    
    return {"ok": True, "message": "Följer nu användaren"}

@app.delete("/api/users/{user_id}/follow")
def api_unfollow_user(user_id: int, db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad")
    
    follow = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user_id,
        UserFollow.followed_id == user_id
    ).first()
    
    if not follow:
        raise HTTPException(status_code=400, detail="Du följer inte denna användare")
    
    db.delete(follow)
    db.commit()
    
    return {"ok": True, "message": "Slutade följa användaren"}

@app.get("/api/users/{user_id}/followers")
def api_get_user_followers(user_id: int, db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    followers = db.query(User).join(
        UserFollow, UserFollow.follower_id == User.id
    ).filter(UserFollow.followed_id == user_id).all()
    
    result = []
    for follower in followers:
        is_following = False
        if current_user_id:
            is_following = db.query(UserFollow).filter(
                UserFollow.follower_id == current_user_id,
                UserFollow.followed_id == follower.id
            ).first() is not None
        
        result.append({
            "id": follower.id,
            "name": follower.name,
            "email": follower.email,
            "bio": follower.bio,
            "is_following": is_following
        })
    
    return result

@app.get("/api/users/{user_id}/following")
def api_get_user_following(user_id: int, db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    following = db.query(User).join(
        UserFollow, UserFollow.followed_id == User.id
    ).filter(UserFollow.follower_id == user_id).all()
    
    result = []
    for followed in following:
        is_following = False
        if current_user_id:
            is_following = db.query(UserFollow).filter(
                UserFollow.follower_id == current_user_id,
                UserFollow.followed_id == followed.id
            ).first() is not None
        
        result.append({
            "id": followed.id,
            "name": followed.name,
            "email": followed.email,
            "bio": followed.bio,
            "is_following": is_following
        })
    
    return result

@app.get("/api/users/{user_id}/is-following")
def api_check_is_following(user_id: int, db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):
    """Check if the current user is following the specified user"""
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Du måste vara inloggad")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    is_following = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user_id,
        UserFollow.followed_id == user_id
    ).first() is not None
    
    return {"is_following": is_following}

@app.get("/api/users")
def api_get_all_users(db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):
    users = db.query(User).all()
    
    result = []
    for user in users:
        is_following = False
        if current_user_id:
            is_following = db.query(UserFollow).filter(
                UserFollow.follower_id == current_user_id,
                UserFollow.followed_id == user.id
            ).first() is not None
        
        # Count followers for each user
        followers_count = db.query(UserFollow).filter(UserFollow.followed_id == user.id).count()
        
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "bio": user.bio,
            "is_following": is_following,
            "followers_count": followers_count
        })
    
    return result

@app.get("/api/for_you")
def api_get_for_you_feed(request: Request, db: Session = Depends(get_db), current_user_id: Optional[int] = Depends(get_current_user_id)):
    log.info(f"📋 /for_you called: user_id={current_user_id}, origin={request.headers.get('origin')}")
    if not current_user_id:
        log.error("❌ /for_you: No user_id - returning 401")
        raise HTTPException(status_code=401, detail="Du måste vara inloggad")
    
    # Get users that current user follows
    following_ids = db.query(UserFollow.followed_id).filter(
        UserFollow.follower_id == current_user_id
    ).all()
    following_ids = [f[0] for f in following_ids]
    
    feed_items = []
    
    if following_ids:
        # Get posts from followed users
        posts = db.query(Post).filter(Post.user_id.in_(following_ids)).order_by(Post.created_at.desc()).limit(20).all()
        
        for post in posts:
            user = db.query(User).filter(User.id == post.user_id).first()
            comments_count = db.query(PostComment).filter(PostComment.post_id == post.id).count()
            upvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "upvote").count()
            downvotes = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.vote_type == "downvote").count()
            
            feed_items.append({
                "type": "post",
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "comments_count": comments_count,
                "upvotes": upvotes,
                "downvotes": downvotes,
                "created_at": post.created_at,
                "user_id": post.user_id,
                "user_name": user.name if user else "Unknown"
            })
        
        # Get projects where followed users have commented or voted
        project_ids = set()
        
        # Projects with comments from followed users
        comments = db.query(Comment).filter(Comment.user_id.in_(following_ids)).all()
        for comment in comments:
            project_ids.add(comment.project_id)
        
        # Projects with votes from followed users
        votes = db.query(Vote).filter(Vote.user_id.in_(following_ids)).all()
        for vote in votes:
            project_ids.add(vote.project_id)
        
        # Get project details
        if project_ids:
            projects = db.query(Project).filter(Project.id.in_(project_ids)).limit(10).all()
            
            for project in projects:
                comments_count = db.query(Comment).filter(Comment.project_id == project.id).count()
                upvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "upvote").count()
                downvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "downvote").count()
                
                feed_items.append({
                    "type": "project",
                    "id": project.id,
                    "title": project.title,
                    "description": project.preamble or project.widget_text or "",
                    "location": project.location,
                    "phase": project.phase,
                    "comments_count": comments_count,
                    "upvotes": upvotes,
                    "downvotes": downvotes
                })
    
    # If feed is empty, return recommended projects (most active)
    if not feed_items:
        projects = db.query(Project).order_by(Project.upvotes.desc()).limit(10).all()
        
        for project in projects:
            comments_count = db.query(Comment).filter(Comment.project_id == project.id).count()
            upvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "upvote").count()
            downvotes = db.query(Vote).filter(Vote.project_id == project.id, Vote.vote_type == "downvote").count()
            
            feed_items.append({
                "type": "project",
                "id": project.id,
                "title": project.title,
                "description": project.preamble or project.widget_text or "",
                "location": project.location,
                "phase": project.phase,
                "comments_count": comments_count,
                "upvotes": upvotes,
                "downvotes": downvotes
            })
    
    return feed_items