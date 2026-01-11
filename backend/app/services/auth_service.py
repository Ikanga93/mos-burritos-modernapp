"""
Mo's Burritos - Authentication Service
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from ..config import settings
from ..models import User, UserRole, UserLocation
from ..schemas import TokenData


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None:
            return None
        
        return TokenData(user_id=user_id, email=email, role=UserRole(role))
    except JWTError:
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user


def get_user_locations(db: Session, user_id: str) -> list:
    """Get all locations assigned to a user"""
    assignments = db.query(UserLocation).filter(
        UserLocation.user_id == user_id,
        UserLocation.is_active == True
    ).all()
    return [a.location_id for a in assignments]


def can_access_location(db: Session, user: User, location_id: str) -> bool:
    """Check if a user can access a specific location"""
    # Owner can access all locations
    if user.role == UserRole.OWNER:
        return True
    
    # Check if user is assigned to this location
    assignment = db.query(UserLocation).filter(
        UserLocation.user_id == user.id,
        UserLocation.location_id == location_id,
        UserLocation.is_active == True
    ).first()
    
    return assignment is not None
