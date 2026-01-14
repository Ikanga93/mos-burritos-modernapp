"""
Mo's Burritos FastAPI Backend - Database Connection
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# PostgreSQL configuration for all environments (Supabase)
# Optimized for both local development and serverless production
engine = create_engine(
    settings.db_url,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5 if settings.is_development else 2,  # Larger pool for dev, minimal for serverless
    max_overflow=10 if settings.is_development else 3,  # More overflow for dev
    pool_recycle=300,  # Recycle connections after 5 minutes
    pool_timeout=10,  # Timeout for getting connection from pool
    echo=False,  # Set to True for SQL query logging in debug
    connect_args={
        "sslmode": "require",  # Require SSL for Supabase connections
        "connect_timeout": 10,  # Connection timeout in seconds
    }
)

# # SQLite configuration (DISABLED - using PostgreSQL only)
# if settings.is_development and "sqlite" in settings.db_url:
#     engine = create_engine(
#         settings.db_url,
#         connect_args={"check_same_thread": False}
#     )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
