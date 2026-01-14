"""
Mo's Burritos FastAPI Backend - Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Environment
    environment: str = "development"

    # Database - PostgreSQL only (Supabase)
    database_url: str = ""

    # JWT Settings (DEPRECATED - kept for backward compatibility only)
    # Now using Supabase Auth tokens exclusively
    jwt_secret_key: str = "deprecated-use-supabase-auth"
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
        """Always use Supabase auth - must be configured"""
        if not (self.supabase_url and self.supabase_anon_key):
            raise ValueError("Supabase credentials must be set. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env")
        return True
    
    @property
    def db_url(self) -> str:
        """Returns PostgreSQL database URL (Supabase) - required for all environments"""
        if not self.database_url:
            raise ValueError(
                "DATABASE_URL must be set in .env for all environments.\n"
                "Get your connection string from: Supabase Dashboard -> Settings -> Database -> Connection string"
            )
        
        # # SQLite fallback (DISABLED - using PostgreSQL only)
        # if self.is_development:
        #     db_path = os.path.join(os.path.dirname(__file__), "..", "mos_burritos.db")
        #     return f"sqlite:///{db_path}"
        
        return self.database_url
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
