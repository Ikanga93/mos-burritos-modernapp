"""
Mo's Burritos FastAPI Backend - Database Connection
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Create engine based on environment
if settings.is_development and "sqlite" in settings.db_url:
    # SQLite configuration for development
    engine = create_engine(
        settings.db_url,
        connect_args={"check_same_thread": False}  # SQLite specific
    )
else:
    # PostgreSQL configuration for production (Supabase)
    # Optimized for serverless environments (Vercel Functions)
    # Each function invocation creates its own engine, so we minimize pooling
    engine = create_engine(
        settings.db_url,
        pool_pre_ping=True,  # Verify connections before using them
        pool_size=2,  # Minimal pool size for serverless (was 10)
        max_overflow=3,  # Limited overflow for serverless (was 20)
        pool_recycle=300,  # Recycle connections after 5 minutes (was 3600)
        pool_timeout=10,  # Timeout for getting connection from pool
        echo=False,  # Set to True for SQL query logging in debug
        connect_args={
            "sslmode": "require",  # Require SSL for Supabase connections
            "connect_timeout": 10,  # Connection timeout in seconds
        } if "postgresql" in settings.db_url else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
