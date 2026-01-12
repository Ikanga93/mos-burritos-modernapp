"""
Vercel Serverless Function Entry Point for FastAPI
This file adapts the FastAPI app to run on Vercel's serverless platform
"""
import sys
from pathlib import Path

# Add backend to path so we can import the FastAPI app
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.main import app

# Vercel serverless handler
# This is the entry point that Vercel will call
handler = app
