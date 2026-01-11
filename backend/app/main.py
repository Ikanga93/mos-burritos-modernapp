"""
Mo's Burritos FastAPI Backend - Main Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import Base, engine
from .models import User, Location, MenuCategory, MenuItem, Order, UserLocation, LiveLocation
from .routers import (
    auth_router,
    locations_router,
    menu_router,
    orders_router,
    users_router,
    payment_router,
    live_locations_router,
)
from .services import get_password_hash
from .models.user import UserRole


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    # Startup
    print("🚀 Starting Mo's Burritos Backend...")
    print(f"   Environment: {settings.environment}")
    print(f"   Database: {'SQLite (dev)' if settings.is_development else 'PostgreSQL'}")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
    
    # Create default admin user if not exists
    await create_default_admin()
    
    yield
    
    # Shutdown
    print("👋 Shutting down Mo's Burritos Backend...")


async def create_default_admin():
    """Create default admin/owner user on first run"""
    from .database import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if any owner exists
        existing_owner = db.query(User).filter(User.role == UserRole.OWNER).first()
        
        if not existing_owner:
            print("🔧 Creating default owner user...")
            
            admin_user = User(
                email=settings.admin_email,
                password_hash=get_password_hash(settings.admin_password),
                role=UserRole.OWNER,
                first_name="Admin",
                last_name="Owner",
                is_active=True
            )
            
            db.add(admin_user)
            db.commit()
            
            print(f"✅ Default owner created:")
            print(f"   Email: {settings.admin_email}")
            print(f"   Password: {settings.admin_password}")
            print("   ⚠️  Please change the default password!")
        else:
            print("✅ Owner user already exists")
    finally:
        db.close()


# Create FastAPI application
app = FastAPI(
    title="Mo's Burritos API",
    description="Backend API for Mo's Burritos multi-location restaurant management",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(locations_router, prefix="/api")
app.include_router(menu_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(payment_router)
app.include_router(live_locations_router, prefix="/api")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Mo's Burritos API",
        "version": "1.0.0",
        "environment": settings.environment
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Mo's Burritos API",
        "docs": "/docs",
        "health": "/health"
    }
