"""
Vercel Serverless Function Entry Point for FastAPI
This file adapts the FastAPI app to run on Vercel's serverless platform

IMPORTANT: Ensure these environment variables are set in Vercel:
- ENVIRONMENT=production
- DATABASE_URL (Supabase PostgreSQL connection string with pooling)
- JWT_SECRET_KEY
- STRIPE_SECRET_KEY (if using payments)
- STRIPE_WEBHOOK_SECRET (if using payments)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- CORS_ORIGINS (comma-separated, e.g., https://yourdomain.com)
"""
import sys
import os
from pathlib import Path

# Set production environment BEFORE any imports
os.environ["ENVIRONMENT"] = os.getenv("ENVIRONMENT", "production")

# Add backend to path so we can import the FastAPI app
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import FastAPI app
try:
    from app.main import app
    handler = app
except Exception as e:
    # If import fails, create a minimal FastAPI app that shows the error
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.get("/health")
    @app.get("/api/health")
    async def health_error():
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to initialize app: {str(e)}",
                "error_type": type(e).__name__
            }
        )

    handler = app
