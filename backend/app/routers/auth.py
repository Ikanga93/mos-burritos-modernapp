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
    Customer login - automatically uses:
    - JWT in development
    - Supabase in production
    """
    try:
        print(f"[DEBUG] Customer login attempt for email: {credentials.email}")
        print(f"[DEBUG] Environment: {settings.environment}")
        print(f"[DEBUG] Use Supabase Auth: {settings.use_supabase_auth}")

        if settings.use_supabase_auth:
            # Production: Use Supabase
            print(f"[DEBUG] Using Supabase authentication")
            return await supabase_login(credentials, db)
        else:
            # Development: Use JWT
            print(f"[DEBUG] Using JWT authentication")
            user = authenticate_user(db, credentials.email, credentials.password)

            if not user:
                print(f"[DEBUG] Authentication failed - user not found or password incorrect")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            print(f"[DEBUG] User authenticated successfully: {user.id}, role: {user.role.value}")

            token_data = {
                "sub": user.id,
                "email": user.email,
                "role": user.role.value
            }

            access_token = create_access_token(token_data)
            refresh_token = create_refresh_token(token_data)

            print(f"[DEBUG] Tokens created successfully")

            return PhoneLoginResponse(
                user=user,
                accessToken=access_token,
                refreshToken=refresh_token,
                isNewUser=False
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


@router.post("/customer/register", response_model=PhoneLoginResponse)
async def customer_register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Customer registration - automatically uses:
    - JWT in development
    - Supabase in production
    """
    try:
        print(f"[DEBUG] Customer registration attempt for email: {user_data.email}")
        print(f"[DEBUG] Environment: {settings.environment}")
        print(f"[DEBUG] Use Supabase Auth: {settings.use_supabase_auth}")

        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            print(f"[DEBUG] Email already registered: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        if settings.use_supabase_auth:
            # Production: Use Supabase
            print(f"[DEBUG] Using Supabase registration")
            return await supabase_register(user_data, db)
        else:
            # Development: Use JWT
            print(f"[DEBUG] Using JWT registration")
            new_user = User(
                email=user_data.email,
                password_hash=get_password_hash(user_data.password),
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                phone=user_data.phone,
                role=ModelUserRole.CUSTOMER,
                is_active=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            print(f"[DEBUG] User created successfully: {new_user.id}")

            token_data = {
                "sub": new_user.id,
                "email": new_user.email,
                "role": new_user.role.value
            }

            access_token = create_access_token(token_data)
            refresh_token = create_refresh_token(token_data)

            print(f"[DEBUG] Tokens created for new user")

            return PhoneLoginResponse(
                user=new_user,
                accessToken=access_token,
                refreshToken=refresh_token,
                isNewUser=True
            )
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
    Customer token refresh - automatically uses:
    - JWT in development
    - Supabase in production
    """
    if settings.use_supabase_auth:
        # Production: Use Supabase
        return await supabase_refresh(request)
    else:
        # Development: Use JWT
        token_data = decode_token(request.refreshToken)

        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        new_token_data = {
            "sub": token_data.user_id,
            "email": token_data.email,
            "role": token_data.role
        }

        new_access_token = create_access_token(new_token_data)
        new_refresh_token = create_refresh_token(new_token_data)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        }


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    try:
        print(f"[DEBUG] Staff/Admin login attempt for email: {credentials.email}")

        user = authenticate_user(db, credentials.email, credentials.password)

        # Check if user is an OAuth/Google Sign In user
        if user == "OAUTH_USER":
            print(f"[DEBUG] OAuth user tried to login with password: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account uses Google Sign In. Please use the 'Sign in with Google' button instead.",
            )

        if not user:
            print(f"[DEBUG] Authentication failed for email: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        print(f"[DEBUG] User authenticated: {user.id}, role: {user.role.value}")

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
    """Register a new customer account"""
    print(f"[REGISTER] New registration attempt for: {user_data.email}")
    
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        print(f"[REGISTER] Email already exists: {user_data.email}")
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
    
    print(f"[REGISTER] User created successfully: {new_user.id}")
    
    # Generate tokens for immediate login
    token_data = {
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    print(f"[REGISTER] Registration complete - returning tokens")
    
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

    # Find or create user in our database
    user = db.query(User).filter(
        (User.supabase_id == supabase_user["id"]) |
        (User.email == supabase_user["email"])
    ).first()

    if not user:
        # Create new user
        user = User(
            supabase_id=supabase_user["id"],
            email=supabase_user["email"],
            role=ModelUserRole.CUSTOMER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.supabase_id:
        # Link existing user to Supabase
        user.supabase_id = supabase_user["id"]
        db.commit()

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

