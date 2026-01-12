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
    engine = create_engine(
        settings.db_url,
        pool_pre_ping=True,  # Verify connections before using them
        pool_size=10,  # Number of connections to maintain
        max_overflow=20,  # Maximum overflow connections beyond pool_size
        pool_recycle=3600,  # Recycle connections after 1 hour
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
