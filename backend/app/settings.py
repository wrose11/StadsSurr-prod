# app/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "change-me"         # put in .env for real
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60*24*7
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:8080",           # Local dev
        "https://stadssurr.onrender.com" # Replace with your production domain
    ]
    DB_URL: str = "sqlite:///./app.db"

settings = Settings()

