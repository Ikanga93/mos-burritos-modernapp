"""
Mo's Burritos - Authentication Service
NOW USING SUPABASE AUTH EXCLUSIVELY - JWT functions deprecated
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from ..config import settings
from ..models import User, UserRole, UserLocation
from ..schemas import TokenData


# ============================================================================
# DEPRECATED FUNCTIONS - Using Supabase Auth only
# Kept for backward compatibility, will be removed in future versions
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    DEPRECATED: Use Supabase Auth instead
    Verify a password against a hash
    """
    print("[WARNING] verify_password is deprecated - use Supabase Auth")
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"[AUTH] Password verification error: {str(e)}")
        return False


def get_password_hash(password: str) -> str:
    """
    DEPRECATED: Use Supabase Auth instead
    Hash a password
    """
    print("[WARNING] get_password_hash is deprecated - use Supabase Auth")
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    DEPRECATED: Use Supabase tokens instead
    Create a JWT access token
    """
    print("[WARNING] create_access_token is deprecated - use Supabase tokens")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    """
    DEPRECATED: Use Supabase tokens instead
    Create a JWT refresh token
    """
    print("[WARNING] create_refresh_token is deprecated - use Supabase tokens")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[TokenData]:
    """
    DEPRECATED: Use Supabase token validation instead
    Decode and validate a JWT token
    """
    print("[WARNING] decode_token is deprecated - use Supabase token validation")
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None:
            return None
        
        return TokenData(user_id=user_id, email=email, role=UserRole(role))
    except JWTError as e:
        print(f"[AUTH] JWT decode error: {str(e)}")
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    DEPRECATED: Use Supabase Auth sign_in_with_email instead
    Authenticate a user by email and password
    """
    print("[WARNING] authenticate_user is deprecated - use Supabase Auth")
    return None


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
