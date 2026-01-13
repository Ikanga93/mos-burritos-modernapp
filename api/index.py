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

# Add backend to path so we can import the FastAPI app
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Set production environment if not already set
if not os.getenv("ENVIRONMENT"):
    os.environ["ENVIRONMENT"] = "production"

from app.main import app

# Vercel serverless handler
# This is the entry point that Vercel will call
# The FastAPI app is automatically adapted to ASGI/WSGI interface
handler = app
