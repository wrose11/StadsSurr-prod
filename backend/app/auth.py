# app/auth.py
from passlib.hash import pbkdf2_sha256

def hash_password(pw: str) -> str:
    return pbkdf2_sha256.hash(pw)

def verify_password(pw: str, pw_hash: str) -> bool:
    return pbkdf2_sha256.verify(pw, pw_hash)
