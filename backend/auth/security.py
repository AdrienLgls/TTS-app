import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# Configuration sécurité
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-development")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "30"))

# Context pour hasher les mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier un mot de passe"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hasher un mot de passe"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Créer un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Vérifier et décoder un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_token_from_cookie(request: Request) -> Optional[str]:
    """Extraire le token du cookie"""
    return request.cookies.get("access_token")

def get_token_from_header(credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    """Extraire le token du header Authorization"""
    if credentials:
        return credentials.credentials
    return None

async def get_current_user_token(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[str]:
    """Obtenir le token de l'utilisateur actuel (cookie ou header)"""
    # Essayer d'abord le cookie (plus sécurisé)
    token = get_token_from_cookie(request)

    # Si pas de cookie, essayer le header
    if not token:
        token = get_token_from_header(credentials)

    return token

async def verify_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Vérifier l'utilisateur actuel"""
    token = await get_current_user_token(request, credentials)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token manquant",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"user_id": user_id, "email": payload.get("email")}

async def get_current_user_optional(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Obtenir l'utilisateur actuel (optionnel, ne lève pas d'erreur si non connecté)"""
    try:
        token = await get_current_user_token(request, credentials)
        if not token:
            return None

        payload = verify_token(token)
        if not payload:
            return None

        user_id: str = payload.get("sub")
        if not user_id:
            return None

        return {"user_id": user_id, "email": payload.get("email")}
    except Exception:
        return None

def create_secure_cookie_config():
    """Configuration pour les cookies sécurisés"""
    return {
        "max_age": ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # en secondes
        "httponly": True,  # Crucial pour la sécurité
        "secure": False,   # True en production avec HTTPS
        "samesite": "lax"  # Protection CSRF
    }