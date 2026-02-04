"""
Mo's Burritos FastAPI Backend - Main Application Entry Point
"""
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import uuid

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
    admin_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    # Startup
    print("🚀 Starting Mo's Burritos Backend...")
    print(f"   Environment: {settings.environment}")
    print(f"   Database: {'SQLite (dev)' if settings.is_development else 'PostgreSQL'}")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified")
    except Exception as e:
        print(f"⚠️  Database connection failed (this is expected on Render free tier with Supabase): {e}")
        print("   App will start but database operations may fail")
        print("   Consider upgrading Render plan or switching to Fly.io")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Mo's Burritos Backend...")


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
app.include_router(admin_router, prefix="/api")
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


@app.get("/api/debug/cors")
async def debug_cors():
    """Debug endpoint to check CORS configuration"""
    return {
        "cors_origins_raw": settings.cors_origins,
        "cors_origins_list": settings.cors_origins_list,
        "environment": settings.environment,
        "frontend_url": settings.frontend_url
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Mo's Burritos API",
        "docs": "/docs",
        "health": "/health"
    }


@app.post("/api/upload-menu-image")
async def upload_menu_image(
    image: UploadFile = File(...),
):
    """Upload a menu item image"""
    from .middleware import get_current_user
    from .database import get_db

    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )

    # Generate a unique filename
    file_ext = Path(image.filename).suffix if image.filename else '.jpg'
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # For now, return a placeholder URL
    # TODO: Implement actual file upload to Supabase Storage or S3
    image_url = f"/uploads/menu/{unique_filename}"

    return {
        "success": True,
        "url": image_url,
        "message": "Image received (cloud storage not configured yet)"
    }
