"""
Mo's Burritos - User Schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"
    CUSTOMER = "customer"


class LocationRole(str, Enum):
    MANAGER = "manager"
    STAFF = "staff"


# Auth schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    """Response for login endpoint - compatible with frontend"""
    user: "UserResponse"
    accessToken: str
    refreshToken: str
    assignedLocations: List["LocationAssignment"] = []
    currentLocation: Optional[dict] = None

    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    """Request body for token refresh"""
    refreshToken: str


class TokenData(BaseModel):
    user_id: str
    email: str
    role: UserRole


# Phone auth schemas
class PhoneOTPRequest(BaseModel):
    """Request to send OTP to phone number"""
    phone: str = Field(..., description="Phone number in E.164 format, e.g., +15551234567")


class PhoneVerifyRequest(BaseModel):
    """Request to verify phone OTP code"""
    phone: str = Field(..., description="Phone number in E.164 format")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class PhoneLoginResponse(BaseModel):
    """Response for phone OTP login"""
    user: "UserResponse"
    accessToken: str
    refreshToken: str
    isNewUser: bool = False

    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6)
    role: UserRole = UserRole.CUSTOMER


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserWithLocations(UserResponse):
    locations: List["LocationAssignment"] = []


# Location assignment schemas
class LocationAssignment(BaseModel):
    location_id: str
    location_name: str
    role: LocationRole
    assigned_at: datetime
    
    class Config:
        from_attributes = True


class AssignUserToLocation(BaseModel):
    user_id: str
    location_id: str
    role: LocationRole = LocationRole.STAFF


# Update forward references
LoginResponse.model_rebuild()
UserWithLocations.model_rebuild()
PhoneLoginResponse.model_rebuild()

