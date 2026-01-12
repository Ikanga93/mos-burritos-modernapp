"""
Mo's Burritos - Authentication Middleware
Environment-aware authentication supporting:
- Development: JWT tokens
- Production: Supabase Auth tokens
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..config import settings
from ..models import User, UserRole as ModelUserRole
from ..schemas import UserRole
from ..services import decode_token, get_supabase_user_from_token

# HTTP Bearer token security
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from token.
    Uses environment-aware authentication:
    - Development: JWT tokens only
    - Production: Supabase Auth tokens
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    user = None
    
    if settings.is_production and settings.use_supabase_auth:
        # Production: Use Supabase Auth
        supabase_user = await get_supabase_user_from_token(token)
        if supabase_user:
            # Find user by supabase_id or email/phone
            user = db.query(User).filter(
                (User.supabase_id == supabase_user["id"]) |
                (User.email == supabase_user.get("email")) |
                (User.phone == supabase_user.get("phone"))
            ).first()
            
            # Auto-sync user from Supabase on first login
            if not user and (supabase_user.get("email") or supabase_user.get("phone")):
                user = User(
                    supabase_id=supabase_user["id"],
                    email=supabase_user.get("email"),
                    phone=supabase_user.get("phone"),
                    role=ModelUserRole.CUSTOMER,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            elif user and not user.supabase_id:
                # Link existing user to Supabase account
                user.supabase_id = supabase_user["id"]
                db.commit()
    else:
        # Development: Use local JWT tokens
        token_data = decode_token(token)
        if token_data:
            user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if not user:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure the current user is active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def require_role(allowed_roles: List[UserRole]):
    """Dependency factory for role-based access control"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = UserRole(current_user.role.value)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


# Pre-built role dependencies
require_owner = require_role([UserRole.OWNER])
require_manager_or_above = require_role([UserRole.OWNER, UserRole.MANAGER])
require_staff_or_above = require_role([UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF])

# Convenience alias for admin users (owner, manager, staff)
get_current_admin_user = require_staff_or_above

