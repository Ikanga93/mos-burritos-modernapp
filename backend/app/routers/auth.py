"""
Mo's Burritos - Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole as ModelUserRole, UserLocation, Location
from ..schemas import (
    UserLogin, UserRegister, Token, LoginResponse, RefreshTokenRequest,
    UserResponse, UserRole, PhoneOTPRequest, PhoneVerifyRequest, PhoneLoginResponse
)
from ..services import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    decode_token,
    send_phone_otp,
    verify_phone_otp,
)
from ..middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = authenticate_user(db, credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Get user's assigned locations
    user_locations = db.query(UserLocation).filter(
        UserLocation.user_id == user.id,
        UserLocation.is_active == True
    ).all()

    # Format assigned locations
    assigned_locations = []
    for ul in user_locations:
        if ul.location:
            assigned_locations.append({
                "location_id": ul.location_id,
                "location_name": ul.location.name,
                "role": ul.role.value,
                "assigned_at": ul.assigned_at
            })

    # Set current location (first assigned location or None)
    current_location = None
    if assigned_locations:
        current_location = {
            "id": assigned_locations[0]["location_id"],
            "name": assigned_locations[0]["location_name"]
        }

    return LoginResponse(
        user=user,
        accessToken=access_token,
        refreshToken=refresh_token,
        assignedLocations=assigned_locations,
        currentLocation=current_location
    )


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new customer account"""
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=ModelUserRole.CUSTOMER
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    token_data = decode_token(request.refreshToken)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Verify user still exists and is active
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    new_token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value
    }

    new_access_token = create_access_token(new_token_data)
    new_refresh_token = create_refresh_token(new_token_data)

    # Get user's assigned locations
    user_locations = db.query(UserLocation).filter(
        UserLocation.user_id == user.id,
        UserLocation.is_active == True
    ).all()

    # Format assigned locations
    assigned_locations = []
    for ul in user_locations:
        if ul.location:
            assigned_locations.append({
                "location_id": ul.location_id,
                "location_name": ul.location.name,
                "role": ul.role.value,
                "assigned_at": ul.assigned_at
            })

    # Set current location (first assigned location or None)
    current_location = None
    if assigned_locations:
        current_location = {
            "id": assigned_locations[0]["location_id"],
            "name": assigned_locations[0]["location_name"]
        }

    return LoginResponse(
        user=user,
        accessToken=new_access_token,
        refreshToken=new_refresh_token,
        assignedLocations=assigned_locations,
        currentLocation=current_location
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint - token invalidation handled client-side"""
    # In a production system, you might want to blacklist the token here
    # For now, we rely on client-side token removal
    return {"message": "Logged out successfully"}


# ==================== Phone Auth Endpoints ====================

@router.post("/phone/send-otp")
async def send_phone_otp_endpoint(request: PhoneOTPRequest):
    """
    Send OTP code to phone number via Supabase Auth.
    Phone should be in E.164 format (e.g., +15551234567)
    """
    result = await send_phone_otp(request.phone)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to send OTP")
        )
    
    return {"message": "OTP sent successfully", "phone": request.phone}


@router.post("/phone/verify", response_model=PhoneLoginResponse)
async def verify_phone_otp_endpoint(
    request: PhoneVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify phone OTP code and return session tokens.
    Creates a new user if this is first login with this phone.
    """
    result = await verify_phone_otp(request.phone, request.code)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error", "Invalid or expired OTP code")
        )
    
    supabase_user = result["user"]
    session = result["session"]
    is_new_user = False
    
    # Find or create user
    user = db.query(User).filter(
        (User.supabase_id == supabase_user["id"]) |
        (User.phone == request.phone)
    ).first()
    
    if not user:
        # Create new user
        user = User(
            supabase_id=supabase_user["id"],
            phone=request.phone,
            role=ModelUserRole.CUSTOMER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    elif not user.supabase_id:
        # Link existing user to Supabase
        user.supabase_id = supabase_user["id"]
        db.commit()
    
    return PhoneLoginResponse(
        user=user,
        accessToken=session["access_token"],
        refreshToken=session["refresh_token"],
        isNewUser=is_new_user
    )

