"""
Mo's Burritos FastAPI Backend - Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Environment
    environment: str = "development"

    # Database
    database_url: str = ""

    # JWT Settings
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Frontend URL for redirects
    frontend_url: str = "http://localhost:5173"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def use_supabase_auth(self) -> bool:
        """Use Supabase auth in production, JWT in development"""
        return self.is_production
    
    @property
    def db_url(self) -> str:
        """Returns database URL - SQLite for dev, PostgreSQL for production"""
        if self.database_url:
            return self.database_url
        if self.is_development:
            # SQLite for development
            db_path = os.path.join(os.path.dirname(__file__), "..", "mos_burritos.db")
            return f"sqlite:///{db_path}"
        raise ValueError("DATABASE_URL must be set in production")
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
