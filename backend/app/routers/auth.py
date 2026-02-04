"""
Mo's Burritos - Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import traceback

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
    sign_in_with_email,
    sign_up_with_email,
    refresh_supabase_session,
    get_supabase_user_from_token,
)
from ..middleware import get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ==================== Unified Customer Auth (Environment-based) ====================

@router.post("/customer/login", response_model=PhoneLoginResponse)
async def customer_login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Customer login using Supabase Auth
    """
    try:
        print(f"[AUTH] Customer login attempt for email: {credentials.email}")
        return await supabase_login(credentials, db)
    except HTTPException:
        raise
    except Exception as e:
        error_detail = f"Login error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        print(f"[ERROR] {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


@router.post("/customer/register", response_model=PhoneLoginResponse)
async def customer_register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Customer registration using Supabase Auth
    """
    try:
        print(f"[AUTH] Customer registration attempt for email: {user_data.email}")
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            print(f"[AUTH] Email already registered: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        return await supabase_register(user_data, db)
    except HTTPException:
        raise
    except Exception as e:
        error_detail = f"Registration error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        print(f"[ERROR] {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


@router.post("/customer/refresh")
async def customer_refresh(request: RefreshTokenRequest):
    """
    Customer token refresh using Supabase
    """
    return await supabase_refresh(request)


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Admin/Staff login using Supabase Auth"""
    try:
        print(f"[AUTH] Staff/Admin login attempt for email: {credentials.email}")
        
        # Authenticate with Supabase
        result = await sign_in_with_email(credentials.email, credentials.password)
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result.get("error", "Incorrect email or password")
            )
        
        supabase_user = result["user"]
        session = result["session"]
        
        # Find or create user in our database
        user = db.query(User).filter(
            (User.supabase_id == supabase_user["id"]) |
            (User.email == supabase_user["email"])
        ).first()
        
        if not user:
            # Auto-create user (will be CUSTOMER by default, can be promoted later)
            user = User(
                supabase_id=supabase_user["id"],
                email=supabase_user["email"],
                role=ModelUserRole.CUSTOMER,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[AUTH] Auto-created user: {user.email}")
        elif not user.supabase_id:
            # Link existing user to Supabase
            user.supabase_id = supabase_user["id"]
            db.commit()
            print(f"[AUTH] Linked user to Supabase: {user.email}")
        
        access_token = session["access_token"]
        refresh_token = session["refresh_token"]
        
        print(f"[AUTH] User authenticated: {user.id}, role: {user.role.value}")

        # Get user's assigned locations
        user_locations = db.query(UserLocation).filter(
            UserLocation.user_id == user.id,
            UserLocation.is_active == True
        ).all()

        print(f"[DEBUG] Found {len(user_locations)} assigned locations for user")

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

        print(f"[DEBUG] Login successful, returning tokens and {len(assigned_locations)} locations")

        return LoginResponse(
            user=user,
            accessToken=access_token,
            refreshToken=refresh_token,
            assignedLocations=assigned_locations,
            currentLocation=current_location
        )
    except HTTPException:
        raise
    except Exception as e:
        error_detail = f"Login error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        print(f"[ERROR] {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


@router.post("/register", response_model=LoginResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new account using Supabase Auth"""
    print(f"[AUTH] New registration attempt for: {user_data.email}")
    
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        print(f"[AUTH] Email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Register with Supabase
    metadata = {
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone
    }
    result = await sign_up_with_email(user_data.email, user_data.password, metadata)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create account")
        )
    
    supabase_user = result["user"]
    session = result["session"]
    
    # Create user in our database
    new_user = User(
        supabase_id=supabase_user["id"],
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=ModelUserRole.CUSTOMER,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = session["access_token"]
    refresh_token = session["refresh_token"]
    
    print(f"[AUTH] Registration complete for: {new_user.email}")
    
    return LoginResponse(
        user=new_user,
        accessToken=access_token,
        refreshToken=refresh_token,
        assignedLocations=[],
        currentLocation=None
    )


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


# ==================== Supabase Email Auth Endpoints ====================

@router.post("/supabase/login", response_model=PhoneLoginResponse)
async def supabase_login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login with email and password using Supabase Auth"""
    result = await sign_in_with_email(credentials.email, credentials.password)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error", "Invalid credentials")
        )

    supabase_user = result["user"]
    session = result["session"]

    # Find user by supabase_id FIRST (most reliable)
    user = db.query(User).filter(User.supabase_id == supabase_user["id"]).first()

    # If not found by supabase_id, try email (for legacy users)
    if not user and supabase_user.get("email"):
        user = db.query(User).filter(User.email == supabase_user["email"]).first()
        if user and not user.supabase_id:
            # Link existing user to Supabase
            print(f"[AUTH] Linking existing user to Supabase: {user.email}")
            user.supabase_id = supabase_user["id"]
            db.commit()

    # If still not found, create new user
    if not user:
        print(f"[AUTH] Creating new user from login: {supabase_user['email']}")
        user = User(
            supabase_id=supabase_user["id"],
            email=supabase_user["email"],
            role=ModelUserRole.CUSTOMER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return PhoneLoginResponse(
        user=user,
        accessToken=session["access_token"],
        refreshToken=session["refresh_token"],
        isNewUser=False
    )


@router.post("/supabase/register", response_model=PhoneLoginResponse)
async def supabase_register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register new user with email and password using Supabase Auth"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user in Supabase
    metadata = {
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone
    }

    result = await sign_up_with_email(user_data.email, user_data.password, metadata)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create account")
        )

    supabase_user = result["user"]
    session = result["session"]

    # Create user in our database
    new_user = User(
        supabase_id=supabase_user["id"],
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=ModelUserRole.CUSTOMER,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return PhoneLoginResponse(
        user=new_user,
        accessToken=session["access_token"],
        refreshToken=session["refresh_token"],
        isNewUser=True
    )


@router.post("/supabase/refresh")
async def supabase_refresh(request: RefreshTokenRequest):
    """Refresh Supabase session"""
    result = await refresh_supabase_session(request.refreshToken)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error", "Failed to refresh session")
        )

    return {
        "access_token": result["session"]["access_token"],
        "refresh_token": result["session"]["refresh_token"]
    }


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

